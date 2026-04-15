import csv
import io
import logging
from django.conf import settings
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from openai import OpenAI, AuthenticationError, OpenAIError, RateLimitError

# Ajoute ceci au début du fichier views.py, après les imports
print("🔍 DEBUG - Vérification des variables d'environnement:")
print(f"XAI_API_KEY: {'✅ Présente' if settings.XAI_API_KEY else '❌ Manquante'}")
print(f"XAI_API_KEY length: {len(settings.XAI_API_KEY) if settings.XAI_API_KEY else 0}")
print(f"XAI_MODEL: {getattr(settings, 'XAI_MODEL', 'Non défini')}")

from .models import (
    SerieBac, Matiere, SerieMatiere, Universite, Filiere,
    FiliereMatiere, FiliereSerie, UniversiteFiliere
)
from .serializers import (
    SerieBacSerializer, MatiereSerializer, UniversiteSerializer,
    FiliereSerializer, UniversiteFiliereSerializer, SuggestionInputSerializer,
    SerieBacLightSerializer, SimulationShareSerializer
)
from .algo import suggerer_filieres
from .notifications import (
    NotificationDeliveryError,
    send_results_email,
    send_results_whatsapp,
)

logger = logging.getLogger(__name__)


# ─── ViewSets publics ────────────────────────────────────────────────────────

class SerieBacViewSet(viewsets.ModelViewSet):
    queryset = SerieBac.objects.prefetch_related('serie_matieres__matiere').all()
    serializer_class = SerieBacSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


class MatiereViewSet(viewsets.ModelViewSet):
    queryset = Matiere.objects.all()
    serializer_class = MatiereSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


class UniversiteViewSet(viewsets.ModelViewSet):
    queryset = Universite.objects.all()
    serializer_class = UniversiteSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


class FiliereViewSet(viewsets.ModelViewSet):
    queryset = Filiere.objects.prefetch_related(
        'filiere_matieres__matiere',
        'filiere_series__serie',
        'univ_filieres__universite'
    ).all()
    serializer_class = FiliereSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def set_matieres(self, request, pk=None):
        filiere = self.get_object()
        matiere_id = request.data.get('matiere_id')
        ordre = request.data.get('ordre')
        if not matiere_id or not ordre:
            return Response({'error': 'matiere_id et ordre requis'}, status=400)
        try:
            matiere = Matiere.objects.get(id=matiere_id)
            FiliereMatiere.objects.filter(filiere=filiere, ordre=ordre).delete()
            FiliereMatiere.objects.update_or_create(
                filiere=filiere, matiere=matiere,
                defaults={'ordre': ordre}
            )
            return Response({'status': 'ok'})
        except Matiere.DoesNotExist:
            return Response({'error': 'Matière introuvable'}, status=404)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def set_series(self, request, pk=None):
        filiere = self.get_object()
        serie_ids = request.data.get('serie_ids', [])
        FiliereSerie.objects.filter(filiere=filiere).delete()
        for sid in serie_ids:
            try:
                serie = SerieBac.objects.get(id=sid)
                FiliereSerie.objects.create(filiere=filiere, serie=serie)
            except SerieBac.DoesNotExist:
                pass
        return Response({'status': 'ok', 'series_count': len(serie_ids)})


class UniversiteFiliereViewSet(viewsets.ModelViewSet):
    queryset = UniversiteFiliere.objects.select_related('universite', 'filiere').all()
    serializer_class = UniversiteFiliereSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


# ─── Suggestions ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def suggerer_view(request):
    serializer = SuggestionInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serie_id = serializer.validated_data['serie_id']
    notes = serializer.validated_data['notes']

    try:
        resultats = suggerer_filieres(serie_id, notes)
        return Response({'count': len(resultats), 'resultats': resultats})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def envoyer_resultats_view(request):
    serializer = SimulationShareSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    payload = serializer.validated_data
    delivery = {}
    sent_channels = []
    share_channels = []
    errors = {}

    if payload.get('email'):
        try:
            delivery['email'] = send_results_email(payload, payload['email'])
            sent_channels.append('email')
        except NotificationDeliveryError as exc:
            delivery['email'] = {
                'status': 'error',
                'target': payload['email'],
                'detail': str(exc),
            }
            errors['email'] = str(exc)

    if payload.get('whatsapp'):
        try:
            delivery['whatsapp'] = send_results_whatsapp(payload, payload['whatsapp'])
            if delivery['whatsapp']['status'] == 'sent':
                sent_channels.append('whatsapp')
            elif delivery['whatsapp']['status'] == 'share_link':
                share_channels.append('whatsapp')
        except NotificationDeliveryError as exc:
            delivery['whatsapp'] = {
                'status': 'error',
                'target': payload['whatsapp'],
                'detail': str(exc),
            }
            errors['whatsapp'] = str(exc)

    if not sent_channels and not share_channels:
        return Response(
            {
                'message': "Aucun canal d envoi n a pu etre traite.",
                'delivery': delivery,
                'errors': errors,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            'message': 'Les resultats ont ete prepares avec succes.',
            'delivery': delivery,
            'sent_channels': sent_channels,
            'share_channels': share_channels,
            'errors': errors,
        }
    )


# ─── Chatbot O+ avec GROK (xAI) ─────────────────────────────────────────────

SYSTEM_PROMPT = """Tu es O+, le conseiller d'orientation universitaire ORIENTA+ pour les bacheliers béninois.
Tu connais parfaitement :
- Les universités publiques et privées du Bénin (UAC, UNSTIM, EPAC, ENSET, ENEAM, FSS, INJEPS, etc.)
- Toutes les filières disponibles et leurs débouchés
- Le système de bourses et d'aide financière au Bénin
- Les programmes de l'ANIP et du MESRS pour les étudiants
- Le marché de l'emploi béninois et ouest-africain

Réponds toujours en français, de façon chaleureuse, précise et encourageante.
Sois concret : donne des noms d'université, des fourchettes de salaire en FCFA, des conseils pratiques.
Si une question sort de ton domaine, redirige poliment vers le bon service.
Format : paragraphes courts, pas de listes trop longues. Maximum 200 mots par réponse.
"""


def get_grok_client():
    """Initialise le client Grok (xAI)"""
    api_key = getattr(settings, 'XAI_API_KEY', None)
    if not api_key:
        logger.warning("XAI_API_KEY non configurée")
        return None
    
    try:
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1",
            timeout=30.0,
            max_retries=2,
        )
        logger.info("✅ Client Grok initialisé avec succès")
        return client
    except Exception as e:
        logger.error(f"❌ Erreur initialisation client Grok: {e}")
        return None


@api_view(['POST'])
@permission_classes([AllowAny])
def chatbot_view(request):
    user_message = request.data.get('message', '')
    historique = request.data.get('historique', [])
    context = request.data.get('context', {})

    if not user_message:
        return Response({'error': 'Message vide'}, status=status.HTTP_400_BAD_REQUEST)

    # Initialiser le client Grok
    client = get_grok_client()
    
    if not client:
        # Fallback sans API
        fallback = _get_fallback_response(user_message, context)
        return Response({
            'reponse': fallback,
            'source': 'fallback',
            'mode': 'hors_ligne'
        })

    try:
        # Construction du prompt système avec contexte
        system_prompt = SYSTEM_PROMPT
        
        if context:
            serie = context.get('serie', 'Non spécifiée')
            has_results = context.get('has_results', False)
            system_prompt += f"\n\nContexte étudiant: Série {serie}. "
            system_prompt += f"Simulation effectuée: {'Oui' if has_results else 'Non'}."

        # Construction des messages
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Ajouter l'historique (max 8 messages)
        for msg in historique[-8:]:
            messages.append({
                'role': msg.get('role', 'user'),
                'content': msg.get('content', '')
            })
        
        messages.append({"role": "user", "content": user_message})

        # Appel à Grok
        response = client.chat.completions.create(
            model=getattr(settings, 'XAI_MODEL', 'grok-beta'),
            messages=messages,
            max_tokens=int(getattr(settings, 'XAI_MAX_TOKENS', 1000)),
            temperature=float(getattr(settings, 'XAI_TEMPERATURE', 0.7)),
        )

        reponse_text = response.choices[0].message.content
        
        return Response({
            'reponse': reponse_text,
            'source': 'grok',
            'mode': 'grok_xai',
            'model': getattr(settings, 'XAI_MODEL', 'grok-beta')
        })

    except RateLimitError:
        logger.error("Rate limit atteint pour Grok")
        return Response({
            'reponse': "⚠️ Le service O+ est temporairement saturé. Veuillez réessayer dans quelques instants. Merci pour votre patience !",
            'source': 'error',
            'error_code': 'rate_limit'
        })
    except AuthenticationError:
        logger.error("Clé API Grok invalide")
        return Response({
            'reponse': "⚠️ La configuration du service O+ nécessite une mise à jour technique. Veuillez contacter l'administrateur.",
            'source': 'error',
            'error_code': 'invalid_api_key'
        })
    except OpenAIError as e:
        logger.error(f"Erreur OpenAI/Grok: {str(e)}")
        fallback = _get_fallback_response(user_message, context)
        return Response({
            'reponse': fallback,
            'source': 'fallback',
            'error_code': 'openai_error'
        })
    except Exception as e:
        logger.error(f"Erreur inattendue: {str(e)}")
        fallback = _get_fallback_response(user_message, context)
        return Response({
            'reponse': fallback,
            'source': 'fallback',
            'error_code': 'unknown_error'
        })


def _get_fallback_response(message: str, context: dict = None) -> str:
    """Réponses de fallback intelligentes quand l'API n'est pas disponible"""
    
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['bonjour', 'salut', 'hello', 'coucou', 'hey']):
        return "👋 Bonjour ! Je suis O+, votre conseiller d'orientation ORIENTA+. Bien que mon assistant AI soit momentanément indisponible, je peux encore vous aider ! Que souhaitez-vous savoir sur les filières ou universités au Bénin ?"
    
    if 'médecine' in message_lower or 'medecine' in message_lower:
        return "🏥 **Médecine au Bénin**\n\n• Séries accessibles: C et D\n• Université principale: UAC (Faculté des Sciences de la Santé)\n• Durée: 7 ans\n• Seuil admission: environ 14/20\n• Débouchés: Médecin généraliste, spécialiste, chercheur\n\nSouhaitez-vous plus de détails sur les études ou les spécialisations ?"
    
    if 'informatique' in message_lower or 'info' in message_lower:
        return "💻 **Informatique au Bénin**\n\n• Séries accessibles: C, D, E, F3\n• Écoles: IFRI (UAC), UNSTIM, EPAC\n• Durée: 3-5 ans\n• Débouchés: Développeur, Data analyst, Administrateur réseau, IA engineer\n• Salaire moyen: 350 000 - 900 000 FCFA/mois\n\nQuel domaine vous intéresse particulièrement ?"
    
    if 'droit' in message_lower:
        return "⚖️ **Droit au Bénin**\n\n• Séries accessibles: A1, A2, B, C, D\n• Universités: UAC, UP, UCAO, UPAO\n• Durée: 3 ans (Licence)\n• Débouchés: Avocat, Juriste d'entreprise, Magistrat, Notaire\n• Salaire moyen: 300 000 - 1 000 000 FCFA/mois\n\nDes questions sur une spécialité particulière ?"
    
    if 'économie' in message_lower or 'gestion' in message_lower or 'commerce' in message_lower:
        return "📈 **Économie et Gestion au Bénin**\n\n• Séries accessibles: B, C, G1, G2\n• Écoles: ENEAM (UAC), FASEG (UP), HECM\n• Durée: 3 ans\n• Débouchés: Économiste, Analyste financier, Manager, Comptable\n• Salaire moyen: 250 000 - 800 000 FCFA/mois\n\nQuelle filière vous attire le plus ?"
    
    if 'bourse' in message_lower or 'allocation' in message_lower:
        return "🎓 **Bourses au Bénin**\n\n• Les bourses sont attribuées sur classement\n• Critères: moyenne générale et série\n• Bourse complète: généralement > 16/20\n• Demi-bourse: généralement > 14/20\n• Les meilleures moyennes sont prioritaires\n\nVoulez-vous connaître les conditions détaillées ?"
    
    if 'série' in message_lower or 'serie' in message_lower:
        serie = context.get('serie') if context else None
        if serie:
            return f"📚 **Votre série {serie}**\n\nCette série vous ouvre les portes de nombreuses filières. Je peux vous orienter vers les formations les plus adaptées à votre profil. Quels domaines vous intéressent ? (Médecine, Informatique, Droit, Économie...)"
        return "📚 **Les séries du bac au Bénin**\n\n• C/D: Sciences (Médecine, Info, Ingénierie)\n• B: Économie, Gestion\n• A1/A2: Lettres, Droit, Communication\n• E/F: Techniques, Génie\n• G1/G2/G3: Gestion, Commerce\n\nQuelle est votre série ?"
    
    if 'université' in message_lower or 'universite' in message_lower or 'uac' in message_lower or 'up' in message_lower:
        return "🏛️ **Universités principales du Bénin**\n\n• **UAC** (Abomey-Calavi): Plus grande université publique\n• **UP** (Parakou): Université du nord\n• **UNSTIM** (Abomey): Sciences et technologies\n• **UNA** (Kétou): Agriculture\n• **UPAO, UIC, UCAO**: Universités privées\n\nSouhaitez-vous des informations sur une université en particulier ?"
    
    # Réponse par défaut
    return "🤔 Je suis O+, votre conseiller d'orientation. Je peux vous renseigner sur:\n\n• Les filières disponibles (Médecine, Droit, Informatique, Économie...)\n• Les conditions d'admission par série\n• Les universités et leurs spécificités\n• Les débouchés et salaires\n• Les bourses et aides financières\n\nQuelle information cherchez-vous ?"


# ─── Statistiques dashboard admin ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_dashboard(request):
    return Response({
        'series': SerieBac.objects.count(),
        'matieres': Matiere.objects.count(),
        'universites': Universite.objects.count(),
        'filieres': Filiere.objects.count(),
        'universites_publiques': Universite.objects.filter(est_publique=True).count(),
        'universites_privees': Universite.objects.filter(est_publique=False).count(),
        'seuils_configures': UniversiteFiliere.objects.count(),
        'villes': list(Universite.objects.values_list('ville', flat=True).distinct()),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_filieres_csv_view(request):
    """
    Importe des filières depuis un CSV.
    Format attendu : nom,code,duree,domaine,description,debouches,exemples_metiers,
    salaire_moyen,taux_emploi,matieres_prio_codes,series_codes
    """
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'Aucun fichier fourni'}, status=400)

    try:
        decoded_file = file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        imported_count = 0
        with transaction.atomic():
            for row in reader:
                # Création ou mise à jour de la filière
                filiere, _ = Filiere.objects.update_or_create(
                    code=row['code'].strip(),
                    defaults={
                        'nom': row['nom'].strip(),
                        'duree': int(row.get('duree', 3)),
                        'domaine': row.get('domaine', 'sciences'),
                        'description': row.get('description', ''),
                        'debouches': row.get('debouches', ''),
                        'exemples_metiers': row.get('exemples_metiers', ''),
                        'salaire_moyen': row.get('salaire_moyen', ''),
                        'taux_emploi': int(row['taux_emploi']) if row.get('taux_emploi') else None,
                    }
                )

                # Matières prioritaires (codes séparés par virgules, ex: MATH,PHY,SVT)
                if 'matieres_prio_codes' in row:
                    FiliereMatiere.objects.filter(filiere=filiere).delete()
                    mat_codes = [c.strip() for c in row['matieres_prio_codes'].split(',') if c.strip()]
                    for i, m_code in enumerate(mat_codes[:3], 1):
                        matiere_obj = Matiere.objects.filter(code=m_code).first()
                        if matiere_obj:
                            FiliereMatiere.objects.create(filiere=filiere, matiere=matiere_obj, ordre=i)

                # Séries acceptées (codes séparés par virgules, ex: C,D,E)
                if 'series_codes' in row:
                    FiliereSerie.objects.filter(filiere=filiere).delete()
                    ser_codes = [c.strip() for c in row['series_codes'].split(',') if c.strip()]
                    for s_code in ser_codes:
                        serie_obj = SerieBac.objects.filter(code=s_code).first()
                        if serie_obj:
                            FiliereSerie.objects.create(filiere=filiere, serie=serie_obj)
                
                imported_count += 1

        return Response({'message': f'{imported_count} filières traitées avec succès.'})
    except Exception as e:
        return Response({'error': f"Erreur lors de l'import : {str(e)}"}, status=500)