from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from .models import (
    SerieBac, Matiere, SerieMatiere, Universite, Filiere,
    FiliereMatiere, FiliereSerie, UniversiteFiliere
)


# ==================== FILTRES PERSONNALISÉS ====================

class DomaineFiliereFilter(SimpleListFilter):
    title = 'Domaine de la filière'
    parameter_name = 'filiere__domaine'
    
    def lookups(self, request, model_admin):
        return Filiere.DOMAINE_CHOICES
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(filiere__domaine=self.value())
        return queryset


class OrdrePrioriteFilter(SimpleListFilter):
    title = 'Ordre de priorité'
    parameter_name = 'ordre'
    
    def lookups(self, request, model_admin):
        return (
            (1, 'Priorité 1 (la plus importante)'),
            (2, 'Priorité 2'),
            (3, 'Priorité 3'),
        )
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(ordre=self.value())
        return queryset


# ==================== INLINES ====================

class SerieMatiereInline(admin.TabularInline):
    model = SerieMatiere
    extra = 1
    autocomplete_fields = ['matiere']
    fields = ['matiere', 'coefficient']
    verbose_name = "Matière de la série"
    verbose_name_plural = "Matières de la série"


class UniversiteFiliereInline(admin.TabularInline):
    model = UniversiteFiliere
    extra = 1
    autocomplete_fields = ['filiere']
    fields = ['filiere', 'annee', 'seuil_minimum', 'seuil_demi_bourse', 'seuil_bourse', 'places_disponibles', 'frais_inscription']
    show_change_link = True
    verbose_name = "Filière proposée"
    verbose_name_plural = "Filières proposées"


class FiliereMatiereInline(admin.TabularInline):
    """Attribution des matières prioritaires à une filière"""
    model = FiliereMatiere
    extra = 1
    autocomplete_fields = ['matiere']
    fields = ['matiere', 'ordre']
    ordering = ['ordre']
    verbose_name = "Matière prioritaire"
    verbose_name_plural = "Matières prioritaires (max 3)"


class FiliereSerieInline(admin.TabularInline):
    """Attribution des séries acceptées par une filière"""
    model = FiliereSerie
    extra = 1
    autocomplete_fields = ['serie']
    fields = ['serie']
    verbose_name = "Série acceptée"
    verbose_name_plural = "Séries acceptées"


# ==================== ADMIN DES SÉRIES ====================

@admin.register(SerieBac)
class SerieBacAdmin(admin.ModelAdmin):
    list_display = ['code', 'nom']
    list_display_links = ['code', 'nom']
    search_fields = ['code', 'nom']
    inlines = [SerieMatiereInline]
    fieldsets = (
        ('Informations générales', {
            'fields': ('code', 'nom', 'description')
        }),
    )


# ==================== ADMIN DES MATIÈRES ====================

@admin.register(Matiere)
class MatiereAdmin(admin.ModelAdmin):
    list_display = ['code', 'nom']
    list_display_links = ['code', 'nom']
    search_fields = ['nom', 'code']
    fieldsets = (
        ('Informations générales', {
            'fields': ('code', 'nom')
        }),
    )


# ==================== ADMIN DES UNIVERSITÉS ====================

@admin.register(Universite)
class UniversiteAdmin(admin.ModelAdmin):
    list_display = ['nom', 'ville', 'est_publique']
    list_display_links = ['nom']
    list_filter = ['est_publique', 'ville']
    search_fields = ['nom', 'ville']
    inlines = [UniversiteFiliereInline]
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'ville', 'est_publique', 'description')
        }),
        ('Contact', {
            'fields': ('adresse', 'telephone', 'email', 'site_web'),
            'classes': ('collapse',)
        }),
        ('Localisation', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Autres informations', {
            'fields': ('annee_creation', 'logo_url'),
            'classes': ('collapse',)
        }),
    )


# ==================== ADMIN DES FILIÈRES ====================

@admin.register(Filiere)
class FiliereAdmin(admin.ModelAdmin):
    list_display = ['code', 'nom', 'duree', 'domaine', 'salaire_moyen', 'taux_emploi']
    list_display_links = ['code', 'nom']
    list_filter = ['domaine', 'duree']
    search_fields = ['nom', 'code', 'description']
    inlines = [FiliereMatiereInline, FiliereSerieInline]
    fieldsets = (
        ('Informations générales', {
            'fields': ('code', 'nom', 'domaine', 'duree', 'description')
        }),
        ('Débouchés et métiers', {
            'fields': ('debouches', 'exemples_metiers'),
            'description': 'Séparez chaque élément par une virgule'
        }),
        ('Statistiques', {
            'fields': ('salaire_moyen', 'taux_emploi'),
            'classes': ('collapse',)
        }),
    )


# ==================== ADMIN DES ASSOCIATIONS UNIVERSITÉ-FILIÈRE ====================

@admin.register(UniversiteFiliere)
class UniversiteFiliereAdmin(admin.ModelAdmin):
    list_display = ['universite', 'filiere', 'annee', 'seuil_minimum', 'seuil_demi_bourse', 'seuil_bourse', 'places_disponibles']
    list_display_links = ['universite', 'filiere']
    list_filter = ['annee', DomaineFiliereFilter, 'universite__est_publique', 'universite__ville']
    search_fields = ['universite__nom', 'filiere__nom', 'filiere__code']
    autocomplete_fields = ['universite', 'filiere']
    
    fieldsets = (
        ('Association Université-Filière', {
            'fields': ('universite', 'filiere', 'annee')
        }),
        ('Seuils d\'admission (notes sur 20)', {
            'fields': ('seuil_minimum', 'seuil_demi_bourse', 'seuil_bourse'),
            'description': '''
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 5px;">
                    <strong>📌 Explication des seuils :</strong><br>
                    • <strong>Seuil minimum</strong> = Admission simple (note minimum pour être admis)<br>
                    • <strong>Seuil demi-bourse</strong> = 50% de bourse (note à partir de laquelle tu obtiens une demi-bourse)<br>
                    • <strong>Seuil bourse</strong> = Bourse complète (note à partir de laquelle tu obtiens une bourse totale)
                </div>
            '''
        }),
        ('Capacité et frais', {
            'fields': ('places_disponibles', 'frais_inscription'),
            'classes': ('collapse',),
            'description': 'Les frais sont en FCFA'
        }),
    )
    
    def get_ordering(self, request):
        return ['-annee', 'universite__nom', 'filiere__nom']


# ==================== ADMIN DES MATIÈRES PAR SÉRIE ====================

@admin.register(SerieMatiere)
class SerieMatiereAdmin(admin.ModelAdmin):
    list_display = ['serie', 'matiere', 'coefficient']
    list_display_links = ['serie', 'matiere']
    list_filter = ['serie', 'matiere']
    search_fields = ['serie__code', 'serie__nom', 'matiere__nom']
    autocomplete_fields = ['serie', 'matiere']
    fieldsets = (
        ('Association Série-Matière', {
            'fields': ('serie', 'matiere', 'coefficient')
        }),
    )


# ==================== ADMIN DES MATIÈRES PRIORITAIRES PAR FILIÈRE ====================

@admin.register(FiliereMatiere)
class FiliereMatiereAdmin(admin.ModelAdmin):
    list_display = ['filiere', 'matiere', 'get_ordre_display']
    list_display_links = ['filiere', 'matiere']
    list_filter = ['filiere__domaine', OrdrePrioriteFilter]
    search_fields = ['filiere__nom', 'filiere__code', 'matiere__nom']
    autocomplete_fields = ['filiere', 'matiere']
    
    fieldsets = (
        ('Association Filière-Matière Prioritaire', {
            'fields': ('filiere', 'matiere', 'ordre'),
            'description': '''
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 5px;">
                    <strong>📌 À propos des matières prioritaires :</strong><br>
                    • <strong>Priorité 1</strong> = La matière la plus importante pour cette filière<br>
                    • <strong>Priorité 2</strong> = Deuxième matière la plus importante<br>
                    • <strong>Priorité 3</strong> = Troisième matière la plus importante<br>
                    ⚠️ Maximum 3 matières prioritaires par filière
                </div>
            '''
        }),
    )
    
    def get_ordre_display(self, obj):
        return f"Priorité {obj.ordre}"
    get_ordre_display.short_description = "Ordre de priorité"


# ==================== ADMIN DES SÉRIES ACCEPTÉES PAR FILIÈRE ====================

@admin.register(FiliereSerie)
class FiliereSerieAdmin(admin.ModelAdmin):
    list_display = ['filiere', 'serie']
    list_display_links = ['filiere', 'serie']
    list_filter = ['filiere__domaine', 'serie']
    search_fields = ['filiere__nom', 'filiere__code', 'serie__code']
    autocomplete_fields = ['filiere', 'serie']
    fieldsets = (
        ('Association Filière-Série Acceptée', {
            'fields': ('filiere', 'serie'),
            'description': 'Définit quelles séries de bac sont acceptées pour cette filière'
        }),
    )