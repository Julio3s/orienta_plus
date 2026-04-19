"""Service d'integration avec l'API Grok (xAI)."""

from __future__ import annotations

import logging
import re
from typing import Any

from django.conf import settings
from openai import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    OpenAI as XAIClient,
    RateLimitError,
)

logger = logging.getLogger(__name__)

# Message si le filtre serveur bloque (economise l'API et garantit le perimetre).
REFUS_HORS_ORIENTATION = (
    "Je ne reponds qu'aux questions liees a l'orientation scolaire et universitaire au Benin "
    "(filiere, universite, debouches, bourses, choix apres le bac, serie, notes, parcours, "
    "metiers accessibles via les etudes, etc.). Reformule ta question dans ce cadre, par exemple "
    "sur une filiere, une universite ou ton projet d'etudes."
)

# Sous-chaines (message normalise) liees a l'orientation — mots courts type « bac » via _ORIENTATION_SHORT_RE.
_ORIENTATION_TERMS = (
    'orientation',
    'réorientation',
    'reorientation',
    'bachelier',
    'bachelière',
    'lycée',
    'lycee',
    'collège',
    'college',
    'université',
    'universite',
    'univ',
    'unstim',
    ' enset',
    'eneam',
    'epac',
    'fss',
    'injeps',
    'ifri',
    'filière',
    'filiere',
    'étude',
    'etude',
    'études',
    'etudes',
    'formation',
    'master',
    'licence',
    'doctorat',
    'mastère',
    'mastere',
    'concours',
    'admission',
    'inscription',
    'campus',
    'faculté',
    'faculte',
    'scolarité',
    'scolarite',
    'école',
    'ecole',
    'série',
    'serie',
    'moyenne',
    'coefficient',
    'débouché',
    'debouche',
    'métier',
    'metier',
    'carrière',
    'carriere',
    'emploi',
    'alternance',
    'stage',
    'avenir',
    'choix',
    'parcours',
    'perdu',
    'perdue',
    'hésitation',
    'hesitation',
    'hésite',
    'hesite',
    'bourse',
    'ingénieur',
    'ingenieur',
    'médecine',
    'medecine',
    'droit',
    'informatique',
    'commerce',
    'gestion',
    'marketing',
    'finance',
    'comptab',
    'architecture',
    'enseignant',
    'éducation',
    'education',
    'pharma',
    'infirmier',
    'cybersécurité',
    'cybersecurite',
    'développeur',
    'developpeur',
    'programmation',
    'data science',
    'intelligence artificielle',
    'économie',
    'economie',
    'statistique',
    'biologie',
    'physique',
    'chimie',
    'philosophie',
    'anglais',
    'allemand',
    'espagnol',
    'communication',
    'journalisme',
    'psycholog',
    'sociolog',
    'logistique',
    'génie',
    'genie',
    'university',
    'college',
    'scholarship',
    'major',
    'career',
    'degree',
)

# Mots courts d'etablissements ou du bac : frontieres de mots pour eviter les sous-chaines parasites.
_ORIENTATION_SHORT_RE = re.compile(
    r'\b(bac|uac|up|fss|eneam|epac|injeps)\b',
    re.IGNORECASE,
)

_GREETING_OR_POLITENESS = re.compile(
    r'^('
    r'bonjour|salut|coucou|hello|hey|hi|bonsoir|'
    r'bonne\s+journ[ée]e|bonne\s+soir[ée]e|'
    r'merci|thanks|thank\s+you|'
    r'ok|okay|d\'accord|dac|'
    r'au\s+revoir|[àa]\s+bient[oô]t'
    r')(\s+[!?.…]+)?\s*$',
    re.IGNORECASE,
)


SYSTEM_PROMPT = """Tu es O+, l'assistant ORIENTA+ : tu ne reponds QU'aux questions liees a l'orientation scolaire et universitaire au Benin.

Perimetre autorise (tu aides sur ces sujets) :
- Choix de filiere, d'universite (publique ou privee), de parcours apres le bac
- Series du bac, notes, candidature, debouches, metiers lies aux etudes
- Bourses et aides liees aux etudes superieures au Benin
- Comparaisons d'etablissements ou de formations (UAC, UNSTIM, EPAC, ENSET, ENEAM, FSS, INJEPS, etc.)

Hors perimetre (tu refuses poliment, sans donner de contenu utile sur le sujet) :
- Programmation, devoirs, maths ou sciences hors contexte orientation
- Sante personnelle, juridique ou financiere hors etudes
- Actualite, politique, sport, divertissement, cuisine, jeux, etc.

Si la question est hors sujet, reponds en une ou deux phrases en francais pour rappeler ton role et invite a poser une question d'orientation.

Regles de style :
- Francais uniquement pour tes reponses
- Chaleureux, precis, encourageant ; paragraphes courts ; max 200 mots
- Cite des universites ou filieres reelles au Benin quand c'est pertinent
"""


class GrokService:
    """Service pour interagir avec l'API Grok via le SDK OpenAI-compatible."""

    def __init__(self) -> None:
        self._client: XAIClient | None = None
        self._client_signature: tuple[str, str, float] | None = None

    def _get_config(self) -> dict[str, Any]:
        return {
            'api_key': getattr(settings, 'XAI_API_KEY', '').strip(),
            'base_url': getattr(settings, 'XAI_API_BASE', 'https://api.x.ai/v1').rstrip('/'),
            'model': getattr(settings, 'XAI_MODEL', 'grok-3-mini'),
            'max_tokens': int(getattr(settings, 'XAI_MAX_TOKENS', 800)),
            'temperature': float(getattr(settings, 'XAI_TEMPERATURE', 0.7)),
            'timeout': float(getattr(settings, 'XAI_REQUEST_TIMEOUT', 30.0)),
            'prefer_responses_api': bool(getattr(settings, 'XAI_USE_RESPONSES_API', True)),
            'store_conversations': bool(getattr(settings, 'XAI_STORE_CONVERSATIONS', False)),
        }

    def _get_client(self) -> tuple[XAIClient | None, dict[str, Any]]:
        config = self._get_config()
        if not config['api_key']:
            logger.warning("XAI_API_KEY non configuree.")
            return None, config

        signature = (
            config['api_key'],
            config['base_url'],
            config['timeout'],
        )
        if self._client is not None and self._client_signature == signature:
            return self._client, config

        try:
            self._client = XAIClient(
                api_key=config['api_key'],
                base_url=config['base_url'],
                timeout=config['timeout'],
                max_retries=2,
            )
            self._client_signature = signature
            logger.info("Client Grok initialise sur %s avec le modele %s.", config['base_url'], config['model'])
        except Exception:
            logger.exception("Impossible d'initialiser le client Grok.")
            self._client = None
            self._client_signature = None

        return self._client, config

    def is_available(self) -> bool:
        client, _ = self._get_client()
        return client is not None

    def _has_orientation_term(self, text: str) -> bool:
        normalized = ' '.join(text.lower().split())
        if any(len(term) >= 4 and term in normalized for term in _ORIENTATION_TERMS):
            return True
        return bool(_ORIENTATION_SHORT_RE.search(normalized))

    def _thread_mentions_orientation(self, historique: list[dict[str, Any]] | None) -> bool:
        if not historique:
            return False
        parts = [self._coerce_text(item.get('content', '')) for item in historique[-8:]]
        blob = ' '.join(parts)
        return self._has_orientation_term(blob)

    @staticmethod
    def _is_short_social_message(text: str) -> bool:
        t = text.strip()
        if len(t) > 88:
            return False
        if _GREETING_OR_POLITENESS.match(t):
            return True
        tl = t.lower()
        if re.match(r'^(merci|thanks)(\s+[!?.…]+)?\s*$', tl):
            return True
        if re.match(r'^(ok|okay|oui|non)(\s+[!?.…]+)?\s*$', tl):
            return True
        return False

    def _message_concerne_orientation(
        self,
        message: str,
        historique: list[dict[str, Any]] | None = None,
    ) -> bool:
        raw = self._coerce_text(message)
        if not raw:
            return False
        if self._has_orientation_term(raw):
            return True
        if self._is_short_social_message(raw):
            return True
        if len(raw) <= 48 and self._thread_mentions_orientation(historique):
            return True
        return False

    def get_response(
        self,
        message: str,
        contexte: dict[str, Any] | None = None,
        historique: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        message_clean = self._coerce_text(message)
        if not self._message_concerne_orientation(message_clean, historique):
            return {
                'reponse': REFUS_HORS_ORIENTATION,
                'source': 'policy',
                'mode': 'hors_orientation',
            }

        client, config = self._get_client()
        if client is None:
            return self._fallback_payload(message_clean, contexte, error_code='missing_api_key')

        messages = self._build_messages(message_clean, contexte, historique)

        try:
            response_text, mode = self._generate_response(client, config, messages)
            return {
                'reponse': response_text,
                'source': 'grok',
                'mode': mode,
                'model': config['model'],
            }
        except RateLimitError:
            logger.warning("Rate limit xAI atteint.")
            return {
                'reponse': (
                    "Le service O+ est temporairement sature. "
                    "Reessaie dans quelques instants, s'il te plait."
                ),
                'source': 'error',
                'mode': 'xai_rate_limit',
                'error_code': 'rate_limit',
            }
        except AuthenticationError:
            logger.error("Authentification xAI invalide.")
            return {
                'reponse': (
                    "La configuration de l'assistant O+ doit etre corrigee. "
                    "Merci de verifier la cle xAI."
                ),
                'source': 'error',
                'mode': 'xai_auth_error',
                'error_code': 'invalid_api_key',
            }
        except (APIConnectionError, APIError):
            logger.exception("Erreur xAI pendant l'appel Grok.")
            return self._fallback_payload(message_clean, contexte, error_code='xai_api_error')
        except Exception:
            logger.exception("Erreur inattendue pendant l'appel Grok.")
            return self._fallback_payload(message_clean, contexte, error_code='unknown_error')

    def analyze_profile(self, notes: dict[str, float], serie: str, results: list[dict[str, Any]] | None = None) -> str:
        client, config = self._get_client()
        if client is None:
            return self._fallback_profile_analysis(notes, serie, results)

        prompt = f"""Analyse le profil d'un etudiant beninois et donne des conseils d'orientation.

Serie: {serie}
Notes: {notes}
Resultats de simulation: {results[:3] if results else 'Non disponibles'}

Donne :
1. Les filieres les plus adaptees
2. Les points forts et axes d'amelioration
3. Des conseils pratiques pour maximiser ses chances
4. Les debouches potentiels

Reponds en francais, de facon encourageante et concrete.
"""

        messages = [
            {
                'role': 'system',
                'content': (
                    "Tu es un expert en orientation scolaire et universitaire au Benin. "
                    "Ne reponds qu'a ce sujet (parcours, filieres, debouches, strategie de candidature). "
                    "Francais uniquement."
                ),
            },
            {'role': 'user', 'content': prompt},
        ]

        try:
            response_text, _ = self._generate_response(client, config, messages)
            return response_text
        except Exception:
            logger.exception("Erreur pendant l'analyse de profil Grok.")
            return self._fallback_profile_analysis(notes, serie, results)

    def _generate_response(
        self,
        client: XAIClient,
        config: dict[str, Any],
        messages: list[dict[str, str]],
    ) -> tuple[str, str]:
        if config['prefer_responses_api']:
            try:
                response = client.responses.create(
                    model=config['model'],
                    input=messages,
                    store=config['store_conversations'],
                )
                response_text = self._extract_response_text(response)
                if response_text:
                    return response_text, 'grok_xai_responses'

                logger.warning("La Responses API xAI a retourne une reponse vide, repli sur chat.completions.")
            except Exception:
                logger.warning(
                    "Echec de la Responses API xAI, repli sur chat.completions.",
                    exc_info=True,
                )

        completion = client.chat.completions.create(
            model=config['model'],
            messages=messages,
            max_tokens=config['max_tokens'],
            temperature=config['temperature'],
        )
        response_text = self._coerce_text(completion.choices[0].message.content)
        return response_text or self._fallback_response(messages[-1]['content']), 'grok_xai_chat_completions'

    def _build_messages(
        self,
        message: str,
        contexte: dict[str, Any] | None = None,
        historique: list[dict[str, Any]] | None = None,
    ) -> list[dict[str, str]]:
        system_prompt = self._build_system_prompt(contexte)
        messages = [{'role': 'system', 'content': system_prompt}]

        allowed_roles = {'system', 'user', 'assistant'}
        for item in (historique or [])[-8:]:
            role = item.get('role', 'user')
            content = self._coerce_text(item.get('content', ''))
            if role in allowed_roles and content:
                messages.append({'role': role, 'content': content})

        messages.append({'role': 'user', 'content': self._coerce_text(message)})
        return messages

    def _build_system_prompt(self, contexte: dict[str, Any] | None = None) -> str:
        prompt = SYSTEM_PROMPT
        if not contexte:
            return prompt

        serie = contexte.get('serie', 'Non specifiee')
        has_results = 'Oui' if contexte.get('has_results') else 'Non'
        prompt += f"\nContexte etudiant : serie {serie}. Simulation effectuee : {has_results}."
        if contexte.get('email'):
            prompt += f"\nEmail de contact : {contexte['email']}."
        return prompt

    def _extract_response_text(self, response: Any) -> str:
        output_text = getattr(response, 'output_text', None)
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()

        chunks: list[str] = []
        for item in getattr(response, 'output', []) or []:
            item_type = self._read_field(item, 'type')
            if item_type not in (None, 'message'):
                continue

            for content in self._read_field(item, 'content', []) or []:
                content_type = self._read_field(content, 'type')
                text = self._read_field(content, 'text')
                if content_type == 'output_text' and isinstance(text, str) and text.strip():
                    chunks.append(text.strip())

        return "\n".join(chunks).strip()

    @staticmethod
    def _read_field(value: Any, field: str, default: Any = None) -> Any:
        if isinstance(value, dict):
            return value.get(field, default)
        return getattr(value, field, default)

    def _fallback_payload(
        self,
        message: str,
        contexte: dict[str, Any] | None = None,
        *,
        error_code: str,
    ) -> dict[str, Any]:
        return {
            'reponse': self._fallback_response(message, contexte),
            'source': 'fallback',
            'mode': 'hors_ligne',
            'error_code': error_code,
        }

    def _coerce_text(self, value: Any) -> str:
        if isinstance(value, str):
            return value.strip()

        if isinstance(value, list):
            chunks: list[str] = []
            for item in value:
                if isinstance(item, dict):
                    text = item.get('text')
                else:
                    text = getattr(item, 'text', None)
                if isinstance(text, str) and text.strip():
                    chunks.append(text.strip())
            return "\n".join(chunks).strip()

        return str(value).strip() if value is not None else ''

    def _fallback_response(self, message: str, contexte: dict[str, Any] | None = None) -> str:
        message_lower = message.lower()

        if any(word in message_lower for word in ['bonjour', 'salut', 'hello', 'coucou', 'hey']):
            return (
                "Bonjour ! Je suis O+, votre conseiller d'orientation ORIENTA+. "
                "Le service Grok est momentanement indisponible, mais je peux deja vous guider "
                "sur les filieres et universites au Benin."
            )

        if any(word in message_lower for word in ['medecine', 'médecine', 'docteur']):
            return (
                "La medecine est surtout accessible aux series C et D. A l'UAC, la Faculte des "
                "Sciences de la Sante reste une reference. Si tu veux, je peux aussi te proposer "
                "des alternatives proches comme pharmacie ou biologie."
            )

        if any(word in message_lower for word in ['informatique', 'info', 'cybersecurite', 'cybersécurité']):
            return (
                "Pour l'informatique, regarde surtout l'IFRI a l'UAC, l'EPAC et l'UNSTIM. "
                "Les series C, D, E et certaines filieres techniques sont souvent les plus adaptees. "
                "Je peux t'aider a comparer les debouches si tu veux."
            )

        if 'droit' in message_lower:
            return (
                "Le droit est accessible a plusieurs series comme A1, A2, B, C et D. "
                "Tu peux viser l'UAC, l'UP ou certaines universites privees reconnues. "
                "Si tu veux, je peux te detailler les debouches comme avocat, juriste ou magistrat."
            )

        if any(word in message_lower for word in ['bourse', 'allocation']):
            return (
                "Les bourses dependent surtout du classement, de la moyenne et parfois de la filiere. "
                "En general, de tres bonnes notes augmentent fortement les chances. "
                "Je peux t'aider a estimer ton niveau si tu me donnes ta serie et quelques notes."
            )

        if any(word in message_lower for word in ['serie', 'série']):
            serie = contexte.get('serie') if contexte else None
            if serie:
                return (
                    f"Avec la serie {serie}, je peux t'orienter vers les filieres les plus coherentes "
                    "avec ton profil. Dis-moi simplement le domaine qui t'attire : sante, informatique, "
                    "droit, gestion ou ingenierie."
                )
            return (
                "Les series scientifiques ouvrent surtout vers sante, informatique et ingenierie, "
                "alors que les series litteraires et economiques mènent plus vers droit, communication "
                "ou gestion. Dis-moi ta serie pour une reponse plus precise."
            )

        if any(word in message_lower for word in ['universite', 'université', 'uac', 'unstim', 'up']):
            return (
                "Parmi les references au Benin, on retrouve l'UAC, l'UP, l'UNSTIM et plusieurs "
                "etablissements prives selon les filieres. Si tu veux, je peux te comparer deux "
                "universites precisement."
            )

        return (
            "Je peux t'aider sur les filieres, les universites, les debouches, les bourses et "
            "les choix selon ta serie. Pose-moi une question precise, par exemple sur l'informatique, "
            "la medecine, le droit ou les aides financieres."
        )

    def _fallback_profile_analysis(
        self,
        notes: dict[str, float],
        serie: str,
        results: list[dict[str, Any]] | None = None,
    ) -> str:
        average = sum(notes.values()) / len(notes) if notes else 0

        if average >= 16:
            level = 'excellent'
            advice = "vous avez un tres bon dossier. Visez les filieres selectives et les bourses."
            recommendations = [
                "Postuler aux filieres les plus competitives",
                "Preparer aussi des choix de secours strategiques",
                "Verifier les conditions de bourse des universites ciblees",
            ]
        elif average >= 14:
            level = 'bon'
            advice = "vous etes competitif. Gardez des choix ambitieux et des choix securises."
            recommendations = [
                "Cibler des filieres solides dans votre domaine fort",
                "Comparer public et prive selon vos moyens",
                "Renforcer les matieres les plus importantes de votre serie",
            ]
        elif average >= 12:
            level = 'correct'
            advice = "votre profil est exploitable, mais il faut choisir avec strategie."
            recommendations = [
                "Prioriser les filieres ou vos matieres fortes comptent vraiment",
                "Etudier aussi les options privees ou professionnalisantes",
                "Chercher des plans B realistes selon vos resultats",
            ]
        else:
            level = 'fragile'
            advice = "il faut privilegier des options progressives et bien encadrees."
            recommendations = [
                "Envisager des filieres techniques ou professionnalisantes",
                "Travailler une remise a niveau sur les matieres faibles",
                "Construire un projet d'etudes par etapes",
            ]

        recommendations_text = "\n".join(f"- {item}" for item in recommendations)
        top_results = results[:2] if results else []

        return f"""Analyse de votre profil

Serie : {serie}
Niveau general : {level} (moyenne approx. {average:.1f}/20)
Conseil principal : {advice}

Recommandations :
{recommendations_text}

Resultats deja identifies : {top_results if top_results else 'aucun pour le moment'}"""


grok_service = GrokService()
