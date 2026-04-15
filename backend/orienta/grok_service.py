"""
Service d'intégration avec l'API Grok (xAI)
"""

import os
import logging
from openai import OpenAI, AuthenticationError, RateLimitError, APIError

logger = logging.getLogger(__name__)


class GrokService:
    """Service pour interagir avec l'API Grok (xAI)"""
    
    def __init__(self):
        self.api_key = os.environ.get('XAI_API_KEY', '')
        self.api_base = "https://api.x.ai/v1"
        self.model = os.environ.get('XAI_MODEL', 'grok-beta')
        
        # Log de débogage
        if self.api_key:
            logger.info(f"🔑 Clé API Grok chargée (longueur: {len(self.api_key)})")
            logger.info(f"📡 Modèle: {self.model}")
        else:
            logger.warning("⚠️ XAI_API_KEY non configurée")
        
        self.client = None
        if self.api_key:
            try:
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url=self.api_base,
                    timeout=30.0,
                    max_retries=2,
                )
                logger.info("✅ Client Grok initialisé avec succès")
            except Exception as e:
                logger.error(f"❌ Erreur initialisation client Grok: {e}")
    
    def is_available(self) -> bool:
        """Vérifie si le service Grok est disponible"""
        return self.client is not None
    
    def get_response(self, message: str, contexte: dict = None, historique: list = None) -> str:
        """
        Envoie un message à Grok et retourne la réponse.
        
        Args:
            message: Le message de l'utilisateur
            contexte: Contexte de l'utilisateur (série, notes, résultats)
            historique: Historique des messages précédents
        
        Returns:
            Réponse de Grok
        """
        if not self.client:
            logger.info("Client non disponible, utilisation du fallback")
            return self._fallback_response(message, contexte)
        
        # Construction du prompt système
        system_prompt = self._build_system_prompt(contexte)
        
        # Construction des messages
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Ajouter l'historique si fourni
        if historique and len(historique) > 0:
            for msg in historique[-6:]:  # Garder les 6 derniers messages
                messages.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })
        
        messages.append({"role": "user", "content": message})
        
        try:
            logger.info(f"📨 Envoi à Grok: {message[:50]}...")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=float(os.environ.get('XAI_TEMPERATURE', '0.7')),
                max_tokens=int(os.environ.get('XAI_MAX_TOKENS', '1000')),
            )
            
            reponse = response.choices[0].message.content
            logger.info(f"✅ Réponse reçue de Grok ({len(reponse)} caractères)")
            
            return reponse
            
        except AuthenticationError as e:
            logger.error(f"❌ Erreur d'authentification Grok: {e}")
            return self._fallback_response(message, contexte)
            
        except RateLimitError as e:
            logger.error(f"❌ Rate limit Grok: {e}")
            return "⚠️ Le service O+ est temporairement saturé. Veuillez réessayer dans quelques instants."
            
        except APIError as e:
            logger.error(f"❌ Erreur API Grok: {e}")
            return self._fallback_response(message, contexte)
            
        except Exception as e:
            logger.error(f"❌ Erreur inattendue Grok: {type(e).__name__}: {e}")
            return self._fallback_response(message, contexte)
    
    def _build_system_prompt(self, contexte: dict = None) -> str:
        """Construit le prompt système pour Grok"""
        base_prompt = """Tu es O+, un conseiller d'orientation universitaire spécialisé dans le système éducatif béninois.
Tu aides les étudiants à choisir leur filière d'études après le baccalauréat.

Règles importantes:
1. Sois précis, concis et bienveillant dans tes réponses
2. Donne des conseils pratiques basés sur les données réelles du Bénin
3. Si tu ne sais pas, dis-le honnêtement
4. Utilise un ton amical mais professionnel
5. Propose toujours des alternatives si possible
6. Réponds toujours en français
7. Cite des exemples concrets d'universités béninoises (UAC, UP, UNSTIM, EPAC, ENEAM, etc.)
8. Utilise des émojis de manière appropriée pour rendre la conversation plus agréable

Format de réponse:
- Paragraphes courts
- Maximum 200 mots par réponse
- Structure claire avec des points clés si nécessaire"""

        if contexte:
            base_prompt += f"""

Contexte actuel de l'étudiant:
- Série: {contexte.get('serie', 'Non spécifiée')}
- A déjà fait une simulation: {'Oui' if contexte.get('has_results') else 'Non'}"""

            if contexte.get('email'):
                base_prompt += f"\n- Email: {contexte.get('email')}"

        return base_prompt
    
    def _fallback_response(self, message: str, contexte: dict = None) -> str:
        """Réponse par défaut quand l'API n'est pas disponible"""
        
        message_lower = message.lower()
        
        # Mots-clés pour identifier l'intention
        if any(word in message_lower for word in ['bonjour', 'salut', 'hello', 'coucou', 'hey']):
            return "👋 **Bonjour !** Je suis O+, votre conseiller d'orientation ORIENTA+.\n\nJe peux vous aider à découvrir les filières qui correspondent à votre profil. Que souhaitez-vous savoir ?"
        
        if any(word in message_lower for word in ['médecine', 'medecine', 'docteur', 'chirurgien']):
            return """🏥 **Médecine au Bénin**

• **Séries accessibles**: C et D
• **Universités**: UAC (Faculté des Sciences de la Santé)
• **Durée**: 7 ans (3 ans tronc commun + 4 ans spécialisation)
• **Seuil admission**: environ 14/20
• **Débouchés**: Médecin généraliste, Médecin spécialiste, Chercheur

**Salaire moyen**: 500 000 - 1 500 000 FCFA/mois

Souhaitez-vous plus de détails sur une université en particulier ?"""
        
        if any(word in message_lower for word in ['informatique', 'info', 'programmation', 'dev']):
            return """💻 **Informatique au Bénin**

• **Séries accessibles**: C, D, E, F3
• **Écoles**: IFRI (UAC), UNSTIM, EPAC, ISTA
• **Durée**: 3-5 ans
• **Débouchés**: Développeur, Data analyst, Administrateur réseau, IA engineer
• **Salaire moyen**: 350 000 - 900 000 FCFA/mois

**Filières disponibles**:
- Génie Logiciel
- Réseaux et Télécommunications
- Cybersécurité
- Intelligence Artificielle
- Data Science

Quel domaine vous intéresse le plus ?"""
        
        if any(word in message_lower for word in ['droit', 'avocat', 'juriste', 'magistrat']):
            return """⚖️ **Droit au Bénin**

• **Séries accessibles**: A1, A2, B, C, D
• **Universités**: UAC, UP, UCAO, UPAO
• **Durée**: 3 ans (Licence) + 2 ans (Master)
• **Débouchés**: Avocat, Juriste d'entreprise, Magistrat, Notaire
• **Salaire moyen**: 300 000 - 1 000 000 FCFA/mois

**Spécialités possibles**:
- Droit des Affaires
- Droit Public
- Droit International
- Carrières Judiciaires

Des questions sur une spécialité ?"""
        
        if any(word in message_lower for word in ['économie', 'gestion', 'commerce', 'management', 'finance']):
            return """📈 **Économie et Gestion au Bénin**

• **Séries accessibles**: B, C, G1, G2
• **Écoles**: ENEAM (UAC), FASEG (UP), HECM, PIGIER
• **Durée**: 3 ans
• **Débouchés**: Économiste, Analyste financier, Manager, Comptable
• **Salaire moyen**: 250 000 - 800 000 FCFA/mois

**Filières disponibles**:
- Sciences Économiques
- Gestion des Entreprises
- Finance et Banque
- Marketing et Commerce
- Comptabilité et Audit

Quelle filière vous attire ?"""
        
        if 'bourse' in message_lower or 'allocation' in message_lower:
            return """🎓 **Bourses au Bénin**

**Critères d'obtention**:
- Les bourses sont attribuées sur classement
- Basé sur la moyenne générale et la série
- Bourse complète: généralement > 16/20
- Demi-bourse: généralement > 14/20
- Admission payante: moyenne ≥ seuil minimum

**Conseils**:
1. Visez les meilleures notes possibles
2. Choisissez des filières en adéquation avec votre série
3. Renseignez-vous sur les quotas par université

Voulez-vous que je vous aide à évaluer vos chances ?"""
        
        if 'série' in message_lower or 'serie' in message_lower:
            serie = contexte.get('serie') if contexte else None
            if serie:
                if serie in ['C', 'D']:
                    return f"""📚 **Votre série {serie}**

Cette série scientifique vous ouvre les portes des filières:
• Médecine, Pharmacie
• Informatique, Génie Logiciel
• Sciences (Maths, Physique, Chimie)
• Ingénierie (Civil, Électrique, Mécanique)

**Conseil**: Avec votre profil, privilégiez les filières scientifiques où vous aurez les meilleures chances.

Quel domaine vous intéresse ?"""
                elif serie in ['A1', 'A2']:
                    return f"""📚 **Votre série {serie}**

Cette série littéraire vous ouvre les portes des filières:
• Droit
• Lettres Modernes
• Journalisme et Communication
• Sciences du Langage
• Sociologie

**Conseil**: Ces filières offrent de bons débouchés dans l'enseignement, la communication et le droit.

Souhaitez-vous des informations sur une filière en particulier ?"""
                elif serie in ['B', 'G1', 'G2', 'G3']:
                    return f"""📚 **Votre série {serie}**

Cette série vous ouvre les portes des filières:
• Économie et Gestion
• Commerce et Marketing
• Comptabilité
• Finance et Banque
• Ressources Humaines

**Conseil**: Les débouchés sont nombreux dans le secteur privé et public.

Quelle filière vous attire le plus ?"""
                else:
                    return f"""📚 **Votre série {serie}**

Cette série technique vous prépare aux métiers:
• Génie Civil, Électrique, Mécanique
• Informatique et Réseaux
• Maintenance industrielle

**Conseil**: Excellentes perspectives d'emploi dans l'industrie et le BTP.

Souhaitez-vous plus d'informations ?"""
            
            return """📚 **Les séries du bac au Bénin**

**Séries scientifiques**: C, D, E, F1, F2, F3
→ Médecine, Info, Ingénierie, Sciences

**Séries littéraires**: A1, A2
→ Droit, Lettres, Communication

**Séries économiques**: B, G1, G2, G3
→ Économie, Gestion, Commerce

Quelle est votre série ?"""
        
        if 'université' in message_lower or 'universite' in message_lower or 'campus' in message_lower:
            return """🏛️ **Universités principales du Bénin**

**Publiques**:
• **UAC** (Abomey-Calavi) - Plus grande université
• **UP** (Parakou) - Université du nord
• **UNSTIM** (Abomey) - Sciences et technologies
• **UNA** (Kétou) - Agriculture

**Privées**:
• **UPAO, UIC, UCAO** - Références privées
• **HECM, PIGIER** - Management et commerce
• **ISTA, ESGT** - Technologies

Souhaitez-vous des informations sur une université en particulier ?"""
        
        # Réponse par défaut
        return """🤔 **Je suis O+, votre conseiller d'orientation**

Je peux vous renseigner sur:

• 🏥 **Les filières** (Médecine, Droit, Informatique, Économie, Ingénierie...)
• 📚 **Les conditions d'admission** par série
• 🏛️ **Les universités** et leurs spécificités
• 💰 **Les débouchés et salaires** par filière
• 🎓 **Les bourses et aides financières**

**Posez-moi une question précise**, par exemple:
- "Quelles études pour devenir médecin ?"
- "L'informatique est-elle accessible avec la série C ?"
- "Comment obtenir une bourse ?"

Que souhaitez-vous savoir ?"""
    
    def analyze_profile(self, notes: dict, serie: str, results: list = None) -> str:
        """Analyse le profil de l'étudiant et donne des recommandations"""
        
        if not self.client:
            return self._fallback_profile_analysis(notes, serie, results)
        
        try:
            prompt = f"""Analyse le profil d'un étudiant béninois et donne des conseils d'orientation:

Série: {serie}
Notes: {notes}

Résultats de simulation: 
{results[:3] if results else 'Non encore calculés'}

Donne des recommandations personnalisées sur:
1. Les filières les plus adaptées à son profil
2. Les points forts et axes d'amélioration
3. Des conseils pour maximiser ses chances
4. Les débouchés potentiels

Réponds en français, de manière encourageante et concrète."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Tu es un expert en orientation universitaire au Bénin. Réponds toujours en français."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Erreur analyse profil: {e}")
            return self._fallback_profile_analysis(notes, serie, results)
    
    def _fallback_profile_analysis(self, notes: dict, serie: str, results: list = None) -> str:
        """Analyse de profil par défaut"""
        
        if not notes:
            avg = 0
        else:
            avg = sum(notes.values()) / len(notes)
        
        if avg >= 16:
            niveau = "excellent"
            conseil = "vous avez un très bon dossier. Postulez pour les bourses !"
            recommandations = [
                "Visez les filières sélectives (Médecine, Pharmacie, Grandes Écoles)",
                "Candidatez aux bourses complètes",
                "Préparez plusieurs dossiers pour les universités de prestige"
            ]
        elif avg >= 14:
            niveau = "bon"
            conseil = "vous êtes compétitif. Considérez les filières sélectives."
            recommandations = [
                "Vous avez vos chances en Médecine, Droit, Informatique",
                "Candidatez aux demi-bourses",
                "Pensez aussi aux universités privées"
            ]
        elif avg >= 12:
            niveau = "moyen"
            conseil = "vous avez des chances. Pensez aussi aux universités privées."
            recommandations = [
                "Filières comme Économie, Gestion, Lettres",
                "Universités privées = bonne alternative",
                "Travaillez les matières où vous êtes faible"
            ]
        else:
            niveau = "à améliorer"
            conseil = "travaillez vos matières faibles. Les filières techniques peuvent être une bonne option."
            recommandations = [
                "Filières techniques (BTS, IUT)",
                "Formations professionnelles",
                "Remise à niveau possible"
            ]
        
        recommandations_text = "\n".join([f"• {r}" for r in recommandations])
        
        return f"""📊 **Analyse de votre profil (Série {serie})**

📈 **Niveau général**: {niveau} (moyenne ≈ {avg:.1f}/20)

💡 **Conseil principal**: {conseil}

🎯 **Recommandations**:
{recommandations_text}

📚 **Besoin de précisions sur une filière spécifique ?** N'hésitez pas à me poser des questions !"""


# Instance singleton
grok_service = GrokService()