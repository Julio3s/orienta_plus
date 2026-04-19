from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'series', views.SerieBacViewSet)
router.register(r'matieres', views.MatiereViewSet)
router.register(r'universites', views.UniversiteViewSet)
router.register(r'filieres', views.FiliereViewSet)
router.register(r'seuils', views.UniversiteFiliereViewSet)

urlpatterns = [
    path('filieres/import-csv/', views.import_filieres_csv_view, name='import-filieres-csv'),
    path('', include(router.urls)),
    path('suggerer/', views.suggerer_view, name='suggerer'),
    path('envoyer-resultats/', views.envoyer_resultats_view, name='envoyer-resultats'),
    path('chatbot/', views.chatbot_view, name='chatbot'),
    path('stats/', views.stats_dashboard, name='stats'),
]
