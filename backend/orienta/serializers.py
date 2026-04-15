from django.db import transaction
from rest_framework import serializers
from .models import (
    SerieBac, Matiere, SerieMatiere, Universite, Filiere,
    FiliereMatiere, FiliereSerie, UniversiteFiliere
)
from .notifications import normalize_whatsapp_number


class MatiereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Matiere
        fields = '__all__'


class SerieMatiereSerializer(serializers.ModelSerializer):
    matiere = MatiereSerializer(read_only=True)
    matiere_id = serializers.PrimaryKeyRelatedField(
        queryset=Matiere.objects.all(), source='matiere', write_only=True
    )

    class Meta:
        model = SerieMatiere
        fields = ['id', 'matiere', 'matiere_id', 'coefficient']


class SerieBacSerializer(serializers.ModelSerializer):
    matieres = SerieMatiereSerializer(source='serie_matieres', many=True, required=False)

    class Meta:
        model = SerieBac
        fields = ['id', 'code', 'nom', 'description', 'matieres']

    def validate_matieres(self, value):
        seen_matiere_ids = set()

        for item in value:
            matiere = item['matiere']
            if matiere.id in seen_matiere_ids:
                raise serializers.ValidationError(
                    "Une matiere ne peut etre definie qu'une seule fois par serie."
                )
            seen_matiere_ids.add(matiere.id)

        return value

    def create(self, validated_data):
        matieres_data = validated_data.pop('serie_matieres', [])

        with transaction.atomic():
            serie = SerieBac.objects.create(**validated_data)
            self._save_matieres(serie, matieres_data)

        return serie

    def update(self, instance, validated_data):
        matieres_data = validated_data.pop('serie_matieres', serializers.empty)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        with transaction.atomic():
            instance.save()

            if matieres_data is not serializers.empty:
                self._save_matieres(instance, matieres_data)

        if hasattr(instance, '_prefetched_objects_cache'):
            instance._prefetched_objects_cache = {}

        return instance

    def _save_matieres(self, serie, matieres_data):
        SerieMatiere.objects.filter(serie=serie).delete()

        if not matieres_data:
            return

        SerieMatiere.objects.bulk_create([
            SerieMatiere(
                serie=serie,
                matiere=item['matiere'],
                coefficient=item['coefficient'],
            )
            for item in matieres_data
        ])


class SerieBacLightSerializer(serializers.ModelSerializer):
    class Meta:
        model = SerieBac
        fields = ['id', 'code', 'nom']


class UniversiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Universite
        fields = '__all__'


class UniversiteFiliereLightSerializer(serializers.ModelSerializer):
    universite = UniversiteSerializer(read_only=True)

    class Meta:
        model = UniversiteFiliere
        fields = [
            'id', 'universite', 'annee', 'seuil_minimum',
            'seuil_demi_bourse', 'seuil_bourse', 'places_disponibles', 'frais_inscription'
        ]


class FiliereMatiereSerializer(serializers.ModelSerializer):
    matiere = MatiereSerializer(read_only=True)
    matiere_id = serializers.PrimaryKeyRelatedField(
        queryset=Matiere.objects.all(), source='matiere', write_only=True
    )

    class Meta:
        model = FiliereMatiere
        fields = ['id', 'matiere', 'matiere_id', 'ordre']


class FiliereSerializer(serializers.ModelSerializer):
    matieres_prioritaires = FiliereMatiereSerializer(source='filiere_matieres', many=True, read_only=True)
    series_acceptees = serializers.SerializerMethodField()
    universites = UniversiteFiliereLightSerializer(source='univ_filieres', many=True, read_only=True)
    debouches_list = serializers.SerializerMethodField()
    metiers_list = serializers.SerializerMethodField()

    class Meta:
        model = Filiere
        fields = [
            'id', 'nom', 'code', 'duree', 'description', 'debouches', 'debouches_list',
            'domaine', 'exemples_metiers', 'metiers_list', 'salaire_moyen', 'taux_emploi',
            'matieres_prioritaires', 'series_acceptees', 'universites'
        ]

    def get_series_acceptees(self, obj):
        return SerieBacLightSerializer(
            [fs.serie for fs in obj.filiere_series.select_related('serie').all()],
            many=True
        ).data

    def get_debouches_list(self, obj):
        return obj.get_debouches_list()

    def get_metiers_list(self, obj):
        return obj.get_metiers_list()


class FiliereLightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Filiere
        fields = ['id', 'nom', 'code', 'duree', 'domaine']


class UniversiteFiliereSerializer(serializers.ModelSerializer):
    universite_id = serializers.PrimaryKeyRelatedField(
        queryset=Universite.objects.all(), source='universite', write_only=True
    )
    filiere_id = serializers.PrimaryKeyRelatedField(
        queryset=Filiere.objects.all(), source='filiere', write_only=True
    )
    universite = UniversiteSerializer(read_only=True)
    filiere = FiliereLightSerializer(read_only=True)

    class Meta:
        model = UniversiteFiliere
        fields = '__all__'


class SuggestionInputSerializer(serializers.Serializer):
    serie_id = serializers.IntegerField()
    notes = serializers.DictField(child=serializers.FloatField())


class SimulationShareSerializer(serializers.Serializer):
    serie_code = serializers.CharField(required=False, allow_blank=True)
    serie_nom = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    whatsapp = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.DictField(child=serializers.FloatField(), required=False)
    resultats = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_whatsapp(self, value):
        if not value:
            return ''

        normalized = normalize_whatsapp_number(value)
        if len(normalized) < 11 or len(normalized) > 15:
            raise serializers.ValidationError(
                'Le numero WhatsApp doit etre valide et inclure un indicatif pays.'
            )

        return normalized

    def validate(self, attrs):
        if not attrs.get('email') and not attrs.get('whatsapp'):
            raise serializers.ValidationError(
                'Renseignez au moins un email ou un numero WhatsApp.'
            )

        return attrs
