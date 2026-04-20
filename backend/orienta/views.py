import csv
import io
import logging

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .algo import suggerer_filieres
from .groq_service import groq_service
from .models import (
    Filiere,
    FiliereMatiere,
    FiliereSerie,
    Matiere,
    SerieBac,
    Universite,
    UniversiteFiliere,
)
from .notifications import (
    NotificationDeliveryError,
    send_results_email,
    send_results_whatsapp,
)
from .serializers import (
    FiliereSerializer,
    MatiereSerializer,
    SerieBacSerializer,
    SimulationShareSerializer,
    SuggestionInputSerializer,
    UniversiteFiliereSerializer,
    UniversiteSerializer,
)

logger = logging.getLogger(__name__)


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
        'univ_filieres__universite',
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
                filiere=filiere,
                matiere=matiere,
                defaults={'ordre': ordre},
            )
            return Response({'status': 'ok'})
        except Matiere.DoesNotExist:
            return Response({'error': 'Matiere introuvable'}, status=404)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def set_series(self, request, pk=None):
        filiere = self.get_object()
        serie_ids = request.data.get('serie_ids', [])
        FiliereSerie.objects.filter(filiere=filiere).delete()

        for serie_id in serie_ids:
            try:
                serie = SerieBac.objects.get(id=serie_id)
                FiliereSerie.objects.create(filiere=filiere, serie=serie)
            except SerieBac.DoesNotExist:
                continue

        return Response({'status': 'ok', 'series_count': len(serie_ids)})


class UniversiteFiliereViewSet(viewsets.ModelViewSet):
    queryset = UniversiteFiliere.objects.select_related('universite', 'filiere').all()
    serializer_class = UniversiteFiliereSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


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
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                'message': "Aucun canal d'envoi n'a pu etre traite.",
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


@api_view(['POST'])
@permission_classes([AllowAny])
def chatbot_view(request):
    user_message = (request.data.get('message') or '').strip()
    historique = request.data.get('historique', [])
    context = request.data.get('context', {})

    if not user_message:
        return Response({'error': 'Message vide'}, status=status.HTTP_400_BAD_REQUEST)

    response_payload = groq_service.get_response(
        message=user_message,
        contexte=context,
        historique=historique,
    )
    return Response(response_payload)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_dashboard(request):
    return Response(
        {
            'series': SerieBac.objects.count(),
            'matieres': Matiere.objects.count(),
            'universites': Universite.objects.count(),
            'filieres': Filiere.objects.count(),
            'universites_publiques': Universite.objects.filter(est_publique=True).count(),
            'universites_privees': Universite.objects.filter(est_publique=False).count(),
            'seuils_configures': UniversiteFiliere.objects.count(),
            'villes': list(Universite.objects.values_list('ville', flat=True).distinct()),
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_filieres_csv_view(request):
    """
    Importe des filieres depuis un CSV.
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
                    },
                )

                if 'matieres_prio_codes' in row:
                    FiliereMatiere.objects.filter(filiere=filiere).delete()
                    mat_codes = [code.strip() for code in row['matieres_prio_codes'].split(',') if code.strip()]
                    for index, mat_code in enumerate(mat_codes[:3], start=1):
                        matiere_obj = Matiere.objects.filter(code=mat_code).first()
                        if matiere_obj:
                            FiliereMatiere.objects.create(
                                filiere=filiere,
                                matiere=matiere_obj,
                                ordre=index,
                            )

                if 'series_codes' in row:
                    FiliereSerie.objects.filter(filiere=filiere).delete()
                    serie_codes = [code.strip() for code in row['series_codes'].split(',') if code.strip()]
                    for serie_code in serie_codes:
                        serie_obj = SerieBac.objects.filter(code=serie_code).first()
                        if serie_obj:
                            FiliereSerie.objects.create(filiere=filiere, serie=serie_obj)

                imported_count += 1

        return Response({'message': f'{imported_count} filieres traitees avec succes.'})
    except Exception as exc:
        logger.exception("Erreur lors de l'import CSV des filieres.")
        return Response({'error': f"Erreur lors de l'import : {str(exc)}"}, status=500)
