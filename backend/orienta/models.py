from django.db import models


class SerieBac(models.Model):
    code = models.CharField(max_length=10, unique=True)
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Série de bac"
        verbose_name_plural = "Séries de bac"
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.nom}"


class Matiere(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)

    class Meta:
        verbose_name = "Matière"
        verbose_name_plural = "Matières"
        ordering = ['nom']

    def __str__(self):
        return self.nom


class SerieMatiere(models.Model):
    serie = models.ForeignKey(SerieBac, on_delete=models.CASCADE, related_name='serie_matieres')
    matiere = models.ForeignKey(Matiere, on_delete=models.CASCADE, related_name='serie_matieres')
    coefficient = models.PositiveSmallIntegerField(default=1)

    class Meta:
        unique_together = ('serie', 'matiere')
        verbose_name = "Matière par série"
        verbose_name_plural = "Matières par série"

    def __str__(self):
        return f"{self.serie.code} - {self.matiere.nom} (coef {self.coefficient})"


class Universite(models.Model):
    nom = models.CharField(max_length=200)
    ville = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    est_publique = models.BooleanField(default=True)
    site_web = models.URLField(blank=True)
    adresse = models.TextField(blank=True)
    telephone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    annee_creation = models.PositiveIntegerField(null=True, blank=True)
    logo_url = models.URLField(blank=True)

    class Meta:
        verbose_name = "Université"
        verbose_name_plural = "Universités"
        ordering = ['nom']

    def __str__(self):
        return self.nom


class Filiere(models.Model):
    DOMAINE_CHOICES = [
        ('sciences', 'Sciences & Technologie'),
        ('sante', 'Santé & Médecine'),
        ('droit', 'Droit & Sciences Politiques'),
        ('economie', 'Économie & Gestion'),
        ('lettres', 'Lettres & Sciences Humaines'),
        ('agriculture', 'Agriculture & Environnement'),
        ('informatique', 'Informatique & Numérique'),
        ('education', 'Sciences de l\'Éducation'),
        ('art', 'Arts & Communication'),
    ]

    nom = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    duree = models.PositiveSmallIntegerField(help_text="Durée en années")
    description = models.TextField(blank=True)
    debouches = models.TextField(blank=True, help_text="Débouchés séparés par des virgules")
    domaine = models.CharField(max_length=50, choices=DOMAINE_CHOICES, default='sciences')
    exemples_metiers = models.TextField(blank=True, help_text="Exemples de métiers concrets")
    salaire_moyen = models.CharField(max_length=100, blank=True, null=True)
    taux_emploi = models.PositiveSmallIntegerField(null=True, blank=True, help_text="% d'emploi à 1 an")

    class Meta:
        verbose_name = "Filière"
        verbose_name_plural = "Filières"
        ordering = ['nom']

    def __str__(self):
        return f"{self.code} - {self.nom}"

    def get_debouches_list(self):
        return [d.strip() for d in self.debouches.split(',') if d.strip()]

    def get_metiers_list(self):
        return [m.strip() for m in self.exemples_metiers.split(',') if m.strip()]


class FiliereMatiere(models.Model):
    ORDRE_CHOICES = [(1, 'Priorité 1'), (2, 'Priorité 2'), (3, 'Priorité 3')]

    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE, related_name='filiere_matieres')
    matiere = models.ForeignKey(Matiere, on_delete=models.CASCADE, related_name='filiere_matieres')
    ordre = models.PositiveSmallIntegerField(choices=ORDRE_CHOICES)

    class Meta:
        unique_together = ('filiere', 'matiere')
        ordering = ['ordre']
        verbose_name = "Matière prioritaire par filière"
        verbose_name_plural = "Matières prioritaires par filière"

    def __str__(self):
        return f"{self.filiere.nom} → {self.matiere.nom} (Priorité {self.ordre})"


class FiliereSerie(models.Model):
    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE, related_name='filiere_series')
    serie = models.ForeignKey(SerieBac, on_delete=models.CASCADE, related_name='filiere_series')

    class Meta:
        unique_together = ('filiere', 'serie')
        verbose_name = "Série acceptée par filière"
        verbose_name_plural = "Séries acceptées par filière"

    def __str__(self):
        return f"{self.filiere.nom} ← Série {self.serie.code}"


class UniversiteFiliere(models.Model):
    universite = models.ForeignKey(Universite, on_delete=models.CASCADE, related_name='univ_filieres')
    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE, related_name='univ_filieres')
    annee = models.PositiveIntegerField(default=2024)
    seuil_minimum = models.FloatField(help_text="Note min pour admission (sur 20)")
    seuil_demi_bourse = models.FloatField(help_text="Note min pour demi-bourse (sur 20)")
    seuil_bourse = models.FloatField(help_text="Note min pour bourse complète (sur 20)")
    places_disponibles = models.PositiveIntegerField(null=True, blank=True)
    frais_inscription = models.PositiveIntegerField(null=True, blank=True, help_text="Frais en FCFA")

    class Meta:
        unique_together = ('universite', 'filiere', 'annee')
        verbose_name = "Filière dans une université"
        verbose_name_plural = "Filières par université"

    def __str__(self):
        return f"{self.universite.nom} → {self.filiere.nom} ({self.annee})"