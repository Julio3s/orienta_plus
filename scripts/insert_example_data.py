#!/usr/bin/env python
"""
Script d'ajout des filières, matières prioritaires et attribution aux universités
Exécuter: python scripts/add_filieres_to_universities.py
"""

import os
import sys
import django
import random

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'orienta_backend.settings')
django.setup()

from orienta.models import SerieBac, Matiere, Filiere, FiliereSerie, FiliereMatiere, Universite, UniversiteFiliere

# ============================================================================
# MATIÈRES PRIORITAIRES PAR FILIÈRE
# ============================================================================

MATIERES_PRIORITAIRES = {
    # Médecine et Santé
    'MED-GEN': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'MED-CHIR': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'PHARMA': [('CHIMIE', 1), ('SVT', 2), ('MATH', 3)],
    'SOINS-INF': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'SAGE-FEMME': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'SANTE-PUB': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'ODONTO': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'OPTOMETRIE': [('SVT', 1), ('CHIMIE', 2), ('PHY', 3)],
    'KINESITHERAPIE': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'LABO-MED': [('CHIMIE', 1), ('SVT', 2), ('MATH', 3)],
    
    # Sciences fondamentales
    'MATH': [('MATH', 1), ('PHY', 2), ('INFO', 3)],
    'PHYSIQUE': [('PHY', 1), ('MATH', 2), ('CHIMIE', 3)],
    'CHIMIE': [('CHIMIE', 1), ('PHY', 2), ('MATH', 3)],
    'BIOLOGIE': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'BIOCHIMIE': [('CHIMIE', 1), ('SVT', 2), ('MATH', 3)],
    'GEOLOGIE': [('MATH', 1), ('PHY', 2), ('CHIMIE', 3)],
    'SCIENCES-TERRE': [('MATH', 1), ('PHY', 2), ('SVT', 3)],
    'ENVIRONNEMENT': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    
    # Informatique
    'INFO': [('MATH', 1), ('INFO', 2), ('ANG', 3)],
    'GENIE-LOG': [('MATH', 1), ('INFO', 2), ('ANG', 3)],
    'RESEAUX-TELECOM': [('MATH', 1), ('INFO', 2), ('ANG', 3)],
    'CYBERSECURITE': [('MATH', 1), ('INFO', 2), ('ANG', 3)],
    'DATA-SCIENCE': [('MATH', 1), ('INFO', 2), ('ANG', 3)],
    'IA': [('MATH', 1), ('INFO', 2), ('ANG', 3)],
    'BTS-INFO': [('MATH', 1), ('INFO', 2), ('ANG', 3)],
    'MULTIMEDIA': [('INFO', 1), ('ANG', 2), ('FR', 3)],
    
    # Ingénierie
    'GENIE-CIVIL': [('MATH', 1), ('PHY', 2), ('CHIMIE', 3)],
    'GENIE-ELEC': [('MATH', 1), ('PHY', 2), ('INFO', 3)],
    'GENIE-MECA': [('MATH', 1), ('PHY', 2), ('INFO', 3)],
    'GENIE-ENERG': [('MATH', 1), ('PHY', 2), ('CHIMIE', 3)],
    'GENIE-CHIMIQUE': [('CHIMIE', 1), ('MATH', 2), ('PHY', 3)],
    'GENIE-INDUST': [('MATH', 1), ('PHY', 2), ('INFO', 3)],
    'GENIE-RURAL': [('MATH', 1), ('PHY', 2), ('SVT', 3)],
    'TRAVAUX-PUBLICS': [('MATH', 1), ('PHY', 2), ('CHIMIE', 3)],
    'GENIE-BIOMED': [('MATH', 1), ('PHY', 2), ('SVT', 3)],
    
    # Agriculture
    'AGRONOMIE': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'PROD-VEGETALE': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'PROD-ANIMALE': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'ECONOMIE-AGRICOLE': [('MATH', 1), ('ECON', 2), ('SVT', 3)],
    'HORTICULTURE': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'FORETS-FAUNE': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'PECHE-AQUA': [('SVT', 1), ('CHIMIE', 2), ('MATH', 3)],
    'AGROALIMENTAIRE': [('CHIMIE', 1), ('SVT', 2), ('MATH', 3)],
    'AGROBUSINESS': [('MATH', 1), ('ECON', 2), ('SVT', 3)],
    
    # Droit
    'DROIT-PUBLIC': [('FR', 1), ('PHILO', 2), ('HIST', 3)],
    'DROIT-PRIVE': [('FR', 1), ('PHILO', 2), ('HIST', 3)],
    'DROIT-AFFAIRES': [('FR', 1), ('PHILO', 2), ('ECON', 3)],
    'SCIENCES-PO': [('FR', 1), ('PHILO', 2), ('HIST', 3)],
    'RELATIONS-INT': [('ANG', 1), ('FR', 2), ('HIST', 3)],
    'ADMIN-PUB': [('FR', 1), ('PHILO', 2), ('HIST', 3)],
    'DROIT-INT': [('FR', 1), ('ANG', 2), ('PHILO', 3)],
    
    # Économie et Gestion
    'ECO': [('MATH', 1), ('ECON', 2), ('ANG', 3)],
    'GESTION': [('MATH', 1), ('ECON', 2), ('ANG', 3)],
    'FINANCE': [('MATH', 1), ('ECON', 2), ('ANG', 3)],
    'COMPTABILITE': [('MATH', 1), ('COMPTA', 2), ('ECON', 3)],
    'AUDIT': [('MATH', 1), ('COMPTA', 2), ('ECON', 3)],
    'MARKETING': [('ANG', 1), ('ECON', 2), ('FR', 3)],
    'COMMERCE': [('ANG', 1), ('ECON', 2), ('FR', 3)],
    'LOGISTIQUE': [('MATH', 1), ('ANG', 2), ('ECON', 3)],
    'RH': [('FR', 1), ('ANG', 2), ('ECON', 3)],
    'IMMOBILIER': [('MATH', 1), ('ECON', 2), ('FR', 3)],
    
    # Lettres
    'LETTRES': [('FR', 1), ('PHILO', 2), ('HIST', 3)],
    'ANGLAIS': [('ANG', 1), ('FR', 2), ('HIST', 3)],
    'ESPAGNOL': [('ESP', 1), ('FR', 2), ('ANG', 3)],
    'ALLEMAND': [('ALL', 1), ('FR', 2), ('ANG', 3)],
    'ARABE': [('ARABE', 1), ('FR', 2), ('ANG', 3)],
    'PHILOSOPHIE': [('FR', 1), ('PHILO', 2), ('HIST', 3)],
    'HISTOIRE': [('FR', 1), ('HIST', 2), ('PHILO', 3)],
    'GEOGRAPHIE': [('FR', 1), ('HIST', 2), ('GEO', 3)],
    'ARCHEOLOGIE': [('FR', 1), ('HIST', 2), ('PHILO', 3)],
    'SOCIOLOGIE': [('FR', 1), ('PHILO', 2), ('HIST', 3)],
    'ANTHROPOLOGIE': [('FR', 1), ('PHILO', 2), ('HIST', 3)],
    'PSYCHOLOGIE': [('PSYCHO', 1), ('SVT', 2), ('FR', 3)],
    
    # Communication et Arts
    'JOURNALISME': [('FR', 1), ('ANG', 2), ('HIST', 3)],
    'COMMUNICATION': [('FR', 1), ('ANG', 2), ('ECON', 3)],
    'CINEMA': [('FR', 1), ('ANG', 2), ('ART', 3)],
    'BEAUX-ARTS': [('ART', 1), ('FR', 2), ('HIST', 3)],
    'THEATRE': [('FR', 1), ('ART', 2), ('ANG', 3)],
    'MUSIQUE': [('MUSIQUE', 1), ('FR', 2), ('ANG', 3)],
    'PUBLICITE': [('FR', 1), ('ANG', 2), ('ART', 3)],
    
    # Éducation
    'SCIENCES-EDU': [('FR', 1), ('PSYCHO', 2), ('PHILO', 3)],
    'EDUC-PHYSIQUE': [('SPORT', 1), ('SVT', 2), ('FR', 3)],
    'PEDAGOGIE': [('FR', 1), ('PSYCHO', 2), ('PHILO', 3)],
    'PETITE-ENFANCE': [('FR', 1), ('PSYCHO', 2), ('SVT', 3)],
    
    # Tourisme
    'TOURISME': [('ANG', 1), ('FR', 2), ('HIST', 3)],
    'HOTELLERIE': [('ANG', 1), ('FR', 2), ('ECON', 3)],
    'EVENEMENTIEL': [('FR', 1), ('ANG', 2), ('ECON', 3)],
    
    # Théologie
    'THEOLOGIE': [('FR', 1), ('PHILO', 2), ('HIST', 3)],
    'ISLAMOLOGIE': [('ARABE', 1), ('FR', 2), ('PHILO', 3)],
}

# ============================================================================
# TOUTES LES FILIÈRES
# ============================================================================

FILIERES_COMPLETES = [
    # ===== MÉDECINE ET SANTÉ =====
    ('MED-GEN', 'Médecine Générale', 7, 'sante',
     'Formation complète en médecine humaine',
     'Médecin généraliste, Médecin spécialiste',
     '500 000 - 1 500 000 FCFA/mois', ['C', 'D']),
    ('SOINS-INF', 'Sciences Infirmières', 3, 'sante',
     'Soins infirmiers généraux',
     'Infirmier hospitalier, Infirmier scolaire',
     '200 000 - 600 000 FCFA/mois', ['C', 'D']),
    ('PHARMA', 'Pharmacie', 6, 'sante',
     'Sciences pharmaceutiques',
     'Pharmacien d\'officine, Pharmacien hospitalier',
     '400 000 - 1 000 000 FCFA/mois', ['C', 'D']),
    
    # ===== INFORMATIQUE =====
    ('INFO', 'Informatique', 3, 'informatique',
     'Développement logiciel, réseaux et systèmes',
     'Développeur, Administrateur réseau, Data analyst',
     '350 000 - 900 000 FCFA/mois', ['C', 'D', 'E']),
    ('GENIE-LOG', 'Génie Logiciel', 3, 'informatique',
     'Conception et développement de logiciels',
     'Architecte logiciel, Lead développeur',
     '400 000 - 1 200 000 FCFA/mois', ['C', 'D', 'E']),
    
    # ===== DROIT =====
    ('DROIT-PRIVE', 'Droit Privé', 3, 'droit',
     'Droit civil, commercial, social',
     'Avocat, Juriste d\'entreprise, Notaire',
     '300 000 - 1 000 000 FCFA/mois', ['A1', 'A2', 'B', 'C', 'D']),
    
    # ===== ÉCONOMIE =====
    ('ECO', 'Sciences Économiques', 3, 'economie',
     'Économie générale',
     'Économiste, Analyste financier',
     '300 000 - 900 000 FCFA/mois', ['B', 'C', 'G2']),
    ('GESTION', 'Gestion des Entreprises', 3, 'economie',
     'Management, stratégie, organisation',
     'Manager, Consultant, Chef d\'entreprise',
     '350 000 - 1 000 000 FCFA/mois', ['B', 'G1', 'G2', 'C']),
    ('COMPTABILITE', 'Comptabilité', 3, 'economie',
     'Comptabilité générale, analytique, audit',
     'Comptable, Auditeur, Expert-comptable',
     '250 000 - 800 000 FCFA/mois', ['B', 'G2', 'C']),
    
    # ===== LETTRES =====
    ('LETTRES', 'Lettres Modernes', 3, 'lettres',
     'Littérature française et africaine',
     'Enseignant, Journaliste, Écrivain',
     '200 000 - 600 000 FCFA/mois', ['A1', 'A2', 'B']),
    ('ANGLAIS', 'Langue Anglaise', 3, 'lettres',
     'Linguistique anglaise, littérature',
     'Enseignant, Traducteur, Interprète',
     '250 000 - 700 000 FCFA/mois', ['A1', 'A2', 'B', 'C', 'D']),
    
    # ===== COMMUNICATION =====
    ('JOURNALISME', 'Journalisme', 3, 'art',
     'Techniques journalistiques',
     'Journaliste, Rédacteur, Reporter',
     '200 000 - 700 000 FCFA/mois', ['A1', 'A2', 'B', 'C', 'D', 'G1']),
    ('COMMUNICATION', 'Communication', 3, 'art',
     'Communication d\'entreprise, RP',
     'Responsable communication, Community manager',
     '250 000 - 800 000 FCFA/mois', ['A1', 'A2', 'B', 'G1']),
]

# ============================================================================
# ASSOCIATIONS UNIVERSITÉS ↔ FILIÈRES
# ============================================================================

UNIVERSITE_FILIERES_MAPPING = {
    'Université d\'Abomey-Calavi (UAC)': ['MED-GEN', 'PHARMA', 'SOINS-INF', 'INFO', 'DROIT-PRIVE', 'ECO', 'GESTION', 'COMPTABILITE', 'LETTRES', 'ANGLAIS', 'JOURNALISME', 'COMMUNICATION'],
    'Université de Parakou (UP)': ['MED-GEN', 'PHARMA', 'SOINS-INF', 'DROIT-PRIVE', 'ECO', 'GESTION', 'LETTRES', 'ANGLAIS'],
    'Université Protestante de l\'Afrique de l\'Ouest (UPAO)': ['INFO', 'GESTION', 'DROIT-PRIVE', 'COMPTABILITE', 'COMMUNICATION'],
    'Université Internationale de Cotonou (UIC)': ['INFO', 'GESTION', 'COMMUNICATION'],
    'Haute École de Commerce et de Management (HECM)': ['GESTION', 'COMPTABILITE', 'COMMUNICATION'],
    'PIGIER Benin': ['GESTION', 'COMPTABILITE'],
}

# Seuils par défaut
DEFAULT_SEUILS = {
    'public_prestigieux': (14.0, 15.5, 17.0),
    'public_normal': (12.0, 13.5, 15.0),
    'prive_haut': (9.0, 11.0, 13.0),
    'prive_moyen': (8.0, 10.0, 12.0),
}

UNIVERSITE_CLASSES = {
    'Université d\'Abomey-Calavi (UAC)': 'public_prestigieux',
    'Université de Parakou (UP)': 'public_normal',
    'Université Protestante de l\'Afrique de l\'Ouest (UPAO)': 'prive_haut',
    'Université Internationale de Cotonou (UIC)': 'prive_moyen',
    'Haute École de Commerce et de Management (HECM)': 'prive_moyen',
    'PIGIER Benin': 'prive_moyen',
}


def add_filieres():
    """Ajout des filières"""
    print("🎓 Création des filières...")
    filieres_obj = {}
    
    for code, nom, duree, domaine, description, debouches, salaire, series in FILIERES_COMPLETES:
        f, created = Filiere.objects.get_or_create(
            code=code,
            defaults={
                'nom': nom,
                'duree': duree,
                'domaine': domaine,
                'description': description,
                'debouches': debouches,
                'exemples_metiers': debouches,
                'salaire_moyen': salaire,
            }
        )
        filieres_obj[code] = f
        
        # Association avec les séries acceptées
        for serie_code in series:
            try:
                serie = SerieBac.objects.get(code=serie_code)
                FiliereSerie.objects.get_or_create(filiere=f, serie=serie)
            except SerieBac.DoesNotExist:
                pass
        
        print(f"  ✓ {code} - {nom[:30]}...")
    
    return filieres_obj


def add_matières_prioritaires(filieres_obj):
    """Ajout des matières prioritaires pour chaque filière"""
    print("\n⭐ Ajout des matières prioritaires...")
    count = 0
    
    for filiere_code, matieres in MATIERES_PRIORITAIRES.items():
        if filiere_code not in filieres_obj:
            print(f"  ⚠️ Filière {filiere_code} non trouvée - création en cours...")
            continue
        
        filiere = filieres_obj[filiere_code]
        
        for matiere_code, ordre in matieres:
            try:
                matiere = Matiere.objects.get(code=matiere_code)
                obj, created = FiliereMatiere.objects.get_or_create(
                    filiere=filiere,
                    matiere=matiere,
                    defaults={'ordre': ordre}
                )
                if created:
                    count += 1
                    print(f"  ✓ {filiere.nom} → {matiere.nom} (ordre {ordre})")
            except Matiere.DoesNotExist:
                print(f"  ⚠️ Matière {matiere_code} non trouvée")
    
    print(f"  ✅ {count} matières prioritaires ajoutées")
    return count


def assign_filieres_to_universities(filieres_obj):
    """Attribution des filières aux universités"""
    print("\n🏛️ Attribution des filières aux universités...")
    count = 0
    
    all_universities = Universite.objects.all()
    print(f"   {all_universities.count()} universités trouvées")
    
    for universite in all_universities:
        nom_univ = universite.nom
        filiere_codes = []
        
        # Recherche exacte
        if nom_univ in UNIVERSITE_FILIERES_MAPPING:
            filiere_codes = UNIVERSITE_FILIERES_MAPPING[nom_univ]
        else:
            for key, codes in UNIVERSITE_FILIERES_MAPPING.items():
                if key.lower() in nom_univ.lower() or nom_univ.lower() in key.lower():
                    filiere_codes = codes
                    break
        
        if not filiere_codes:
            continue
        
        univ_class = UNIVERSITE_CLASSES.get(nom_univ, 'prive_moyen')
        seuil_min, seuil_demi, seuil_bourse = DEFAULT_SEUILS.get(univ_class, DEFAULT_SEUILS['prive_moyen'])
        
        for code in filiere_codes[:6]:
            if code in filieres_obj:
                filiere = filieres_obj[code]
                frais = random.randint(150000, 350000) if univ_class.startswith('prive') else 0
                places = random.randint(30, 150)
                
                UniversiteFiliere.objects.get_or_create(
                    universite=universite,
                    filiere=filiere,
                    annee=2025,
                    defaults={
                        'seuil_minimum': seuil_min,
                        'seuil_demi_bourse': seuil_demi,
                        'seuil_bourse': seuil_bourse,
                        'places_disponibles': places,
                        'frais_inscription': frais,
                    }
                )
                count += 1
                print(f"  ✓ {universite.nom[:30]} → {filiere.nom[:25]}")
    
    print(f"  ✅ {count} associations université-filière créées")
    return count


def main():
    print("=" * 70)
    print("🚀 ORIENTA+ - Ajout des filières, matières prioritaires et universités")
    print("=" * 70)
    
    univ_count = Universite.objects.count()
    print(f"\n📊 Universités existantes: {univ_count}")
    
    if univ_count == 0:
        print("⚠️ Aucune université trouvée!")
        return
    
    # Supprimer les anciennes données
    print("\n⚠️ Nettoyage des anciennes données...")
    FiliereMatiere.objects.all().delete()
    FiliereSerie.objects.all().delete()
    UniversiteFiliere.objects.all().delete()
    Filiere.objects.all().delete()
    print("  ✓ Anciennes données supprimées")
    
    # Insertion
    filieres_obj = add_filieres()
    add_matières_prioritaires(filieres_obj)
    assign_filieres_to_universities(filieres_obj)
    
    print("\n" + "=" * 70)
    print("✅ INSERTION TERMINÉE !")
    print("=" * 70)
    print(f"\n📊 RÉCAPITULATIF:")
    print(f"   • Filières: {Filiere.objects.count()}")
    print(f"   • Matières prioritaires: {FiliereMatiere.objects.count()}")
    print(f"   • Associations filière-série: {FiliereSerie.objects.count()}")
    print(f"   • Associations université-filière: {UniversiteFiliere.objects.count()}")
    print("\n🎉 Base de données prête !")


if __name__ == '__main__':
    main()