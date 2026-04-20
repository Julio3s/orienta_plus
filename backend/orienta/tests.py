from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import SimpleTestCase, override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .groq_service import GroqOrientationService, REFUS_HORS_ORIENTATION
from .models import Matiere, SerieMatiere


class SerieBacAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='admin',
            password='adminpass123',
        )
        self.client.force_authenticate(user=self.user)

        self.maths = Matiere.objects.create(nom='Mathematiques', code='MATH')
        self.physique = Matiere.objects.create(nom='Physique', code='PHYS')
        self.svt = Matiere.objects.create(nom='SVT', code='SVT')

    def test_create_serie_with_matieres_and_coefficients(self):
        response = self.client.post(
            '/api/series/',
            {
                'code': 'C',
                'nom': 'Serie C',
                'description': 'Serie scientifique',
                'matieres': [
                    {'matiere_id': self.maths.id, 'coefficient': 5},
                    {'matiere_id': self.physique.id, 'coefficient': 4},
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SerieMatiere.objects.count(), 2)

        created_matieres = {
            item['matiere']['code']: item['coefficient']
            for item in response.data['matieres']
        }
        self.assertEqual(created_matieres, {'MATH': 5, 'PHYS': 4})

    def test_update_serie_replaces_matiere_coefficients(self):
        create_response = self.client.post(
            '/api/series/',
            {
                'code': 'D',
                'nom': 'Serie D',
                'description': 'Serie biologie',
                'matieres': [
                    {'matiere_id': self.maths.id, 'coefficient': 3},
                    {'matiere_id': self.physique.id, 'coefficient': 2},
                ],
            },
            format='json',
        )
        serie_id = create_response.data['id']

        update_response = self.client.put(
            f'/api/series/{serie_id}/',
            {
                'code': 'D',
                'nom': 'Serie D modifiee',
                'description': 'Serie biologie renforcee',
                'matieres': [
                    {'matiere_id': self.maths.id, 'coefficient': 6},
                    {'matiere_id': self.svt.id, 'coefficient': 5},
                ],
            },
            format='json',
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            SerieMatiere.objects.filter(serie_id=serie_id).count(),
            2,
        )

        updated_matieres = {
            item['matiere']['code']: item['coefficient']
            for item in update_response.data['matieres']
        }
        self.assertEqual(updated_matieres, {'MATH': 6, 'SVT': 5})

    def test_reject_duplicate_matiere_for_same_serie(self):
        response = self.client.post(
            '/api/series/',
            {
                'code': 'A1',
                'nom': 'Serie de test',
                'description': '',
                'matieres': [
                    {'matiere_id': self.maths.id, 'coefficient': 5},
                    {'matiere_id': self.maths.id, 'coefficient': 2},
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('matieres', response.data)


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='no-reply@orienta.plus',
)
class SimulationShareAPITests(APITestCase):
    def test_requires_at_least_one_contact_channel(self):
        response = self.client.post(
            '/api/envoyer-resultats/',
            {
                'serie_code': 'C',
                'serie_nom': 'Serie C',
                'resultats': [
                    {
                        'filiere_nom': 'Informatique',
                        'pourcentage': 92,
                        'label': 'Bourse complete',
                    }
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sends_email_when_email_is_provided(self):
        response = self.client.post(
            '/api/envoyer-resultats/',
            {
                'serie_code': 'D',
                'serie_nom': 'Serie D',
                'email': 'eleve@example.com',
                'notes': {
                    'MATH': 14,
                    'SVT': 15,
                },
                'resultats': [
                    {
                        'filiere_nom': 'Biologie',
                        'pourcentage': 88,
                        'label': 'Demi-bourse',
                        'moyenne_calculee': 14.5,
                        'universites': [
                            {'universite_nom': 'UAC'},
                            {'universite_nom': 'UNSTIM'},
                        ],
                    }
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['delivery']['email']['status'], 'sent')
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('ORIENTA+', mail.outbox[0].subject)
        self.assertIn('Biologie', mail.outbox[0].body)


class GroqServiceScopeTests(SimpleTestCase):
    def test_blocks_off_topic_without_calling_model(self):
        svc = GroqOrientationService()
        out = svc.get_response(
            'Donne-moi la recette du gateau au chocolat',
            historique=[],
        )
        self.assertEqual(out['source'], 'policy')
        self.assertEqual(out['mode'], 'hors_orientation')
        self.assertEqual(out['reponse'], REFUS_HORS_ORIENTATION)

    @override_settings(GROQ_API_KEY='')
    def test_allows_follow_up_when_thread_has_orientation(self):
        svc = GroqOrientationService()
        hist = [
            {'role': 'user', 'content': 'Quelles filieres en informatique au Benin ?'},
            {'role': 'assistant', 'content': 'Tu peux regarder IFRI a l UAC...'},
        ]
        out = svc.get_response('Explique plus en deux phrases', historique=hist)
        self.assertNotEqual(out['source'], 'policy')
        self.assertEqual(out['source'], 'fallback')

    @override_settings(GROQ_API_KEY='')
    def test_on_topic_without_key_uses_fallback(self):
        svc = GroqOrientationService()
        out = svc.get_response(
            'Quelles universites pour le droit au Benin ?',
            historique=[],
        )
        self.assertEqual(out['source'], 'fallback')


class ChatbotAPITests(APITestCase):
    @override_settings(GROQ_API_KEY='')
    def test_chatbot_returns_fallback_when_groq_is_not_configured(self):
        response = self.client.post(
            '/api/chatbot/',
            {
                'message': 'Bonjour',
                'historique': [],
                'context': {'serie': 'C'},
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['source'], 'fallback')
        self.assertEqual(response.data['mode'], 'hors_ligne')

    @override_settings(GROQ_API_KEY='')
    def test_chatbot_off_topic_returns_policy(self):
        response = self.client.post(
            '/api/chatbot/',
            {
                'message': 'Ecrit un script Python pour scraper ce site',
                'historique': [],
                'context': {},
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['source'], 'policy')
        self.assertEqual(response.data['mode'], 'hors_orientation')

    @patch('orienta.views.groq_service.get_response')
    def test_chatbot_endpoint_uses_groq_service_payload(self, mock_get_response):
        mock_get_response.return_value = {
            'reponse': "Bonjour, je suis O+.",
            'source': 'groq',
            'mode': 'groq_chat_completions',
            'model': 'llama-3.1-8b-instant',
        }

        response = self.client.post(
            '/api/chatbot/',
            {
                'message': 'Salut',
                'historique': [{'role': 'assistant', 'content': 'Bonjour'}],
                'context': {'serie': 'D', 'has_results': True},
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['source'], 'groq')
        self.assertEqual(response.data['model'], 'llama-3.1-8b-instant')
        mock_get_response.assert_called_once()
