"""
ORIENTA+ — Algorithme de suggestion de filières
Toutes les combinaisons filière × université sont calculées.
Les filières hors série sont plafonnées à 70% de compatibilité.
"""
import logging
from .models import Filiere, UniversiteFiliere, FiliereSerie, FiliereMatiere

logger = logging.getLogger(__name__)

# Catégories de séries
SERIES_SCIENTIFIQUES = ['C', 'D', 'E', 'F1', 'F2', 'F3', 'EA', 'DEAT_PV', 'DEAT_PA', 'DEAT_AER', 'DEAT_FOR']
SERIES_LITTERAIRES = ['A1', 'A2', 'B']
SERIES_TECHNIQUES = ['G1', 'G2', 'G3', 'DT_IMI', 'DT_DWM', 'DT_COM', 'DT_TOUR', 'DT_MAO']


def get_categorie_serie(serie_code: str) -> str:
    """Retourne la catégorie d'une série"""
    if serie_code in SERIES_SCIENTIFIQUES:
        return 'scientifique'
    elif serie_code in SERIES_LITTERAIRES:
        return 'litteraire'
    elif serie_code in SERIES_TECHNIQUES:
        return 'technique'
    return 'autre'


def est_filiere_compatible_serie(filiere, serie_code: str) -> tuple:
    """
    Vérifie si une filière est compatible avec une série.
    Retourne (compatible, raison)
    """
    # Vérifier si la série est explicitement acceptée
    series_acceptees = list(filiere.filiere_series.values_list('serie__code', flat=True))
    
    if serie_code in series_acceptees:
        return True, "Série acceptée"
    
    # Si la filière n'a pas de séries définies, on autorise toutes les séries (sauf scientifique pour certaines)
    if not series_acceptees:
        domaine = filiere.domaine
        categorie_serie = get_categorie_serie(serie_code)
        
        if domaine in ['sante', 'sciences', 'informatique', 'ingenierie']:
            if categorie_serie == 'scientifique':
                return True, "Série scientifique autorisée"
            else:
                return False, "Filière scientifique réservée aux séries scientifiques"
        else:
            return True, "Filière accessible à toutes les séries"
    
    return False, "Série non acceptée"


def calculer_moyenne_prioritaire(notes: dict, matieres_prioritaires: list) -> float:
    """
    Calcule la moyenne des matières prioritaires d'une filière.
    IMPORTANT: Si une matière prioritaire est manquante, retourne 0 (filière non suggérée)
    """
    if not matieres_prioritaires:
        return 0.0
    
    valeurs = []
    for fm in matieres_prioritaires:
        code = fm.matiere.code
        if code not in notes:
            # Une matière prioritaire est manquante → on ne suggère PAS cette filière
            return 0.0
        valeurs.append(float(notes[code]))
    
    return sum(valeurs) / len(valeurs)


def calculer_chances_admission(moyenne: float, uf, serie_compatible: bool = True) -> dict:
    """
    Calcule le pourcentage de compatibilité et le statut d'admission.
    """
    
    # Vérification des seuils
    if uf.seuil_minimum is None or uf.seuil_demi_bourse is None or uf.seuil_bourse is None:
        return {
            'statut': 'non_admissible',
            'label': 'Seuils non définis',
            'couleur': 'rouge',
            'pourcentage': 0,
        }
    
    # Calcul brut
    if moyenne >= uf.seuil_bourse:
        plage = 20 - uf.seuil_bourse
        if plage > 0:
            chances = 75 + ((moyenne - uf.seuil_bourse) / plage * 25)
        else:
            chances = 100
        chances = min(100, chances)
        statut, label, couleur = 'bourse', 'Bourse complète', 'vert'

    elif moyenne >= uf.seuil_demi_bourse:
        plage = uf.seuil_bourse - uf.seuil_demi_bourse
        if plage > 0:
            chances = 65 + ((moyenne - uf.seuil_demi_bourse) / plage * 30)
        else:
            chances = 95
        chances = min(95, chances)
        statut, label, couleur = 'demi_bourse', 'Demi-bourse', 'bleu'

    elif moyenne >= uf.seuil_minimum:
        plage = uf.seuil_demi_bourse - uf.seuil_minimum
        if plage > 0:
            chances = 50 + ((moyenne - uf.seuil_minimum) / plage * 30)
        else:
            chances = 80
        chances = min(80, chances)
        statut, label, couleur = 'payant', 'Admission payante', 'orange'

    elif moyenne >= 10:
        plage = uf.seuil_minimum - 10
        if plage > 0:
            chances = 30 + ((moyenne - 10) / plage * 20)
        else:
            chances = 50
        chances = min(50, chances)
        statut, label, couleur = 'faible', 'Chances faibles', 'orange'

    else:
        return {
            'statut': 'non_admissible',
            'label': 'Non admissible',
            'couleur': 'rouge',
            'pourcentage': 0,
        }

    # Si série non compatible, plafonnement à 70%
    if not serie_compatible:
        chances = min(70, chances)
        if statut == 'bourse' and chances <= 70:
            statut, label, couleur = 'demi_bourse', 'Demi-bourse (série diff.)', 'bleu'

    return {
        'statut': statut,
        'label': label,
        'couleur': couleur,
        'pourcentage': round(min(100, chances)),
    }


def suggerer_filieres(serie_id: int, notes: dict, serie_code: str = None) -> list:
    """
    Retourne TOUTES les filières (série compatible ou non) triées
    par compatibilité décroissante.
    """
    
    # Récupérer le code de la série si non fourni
    if serie_code is None:
        try:
            from .models import SerieBac
            serie = SerieBac.objects.get(id=serie_id)
            serie_code = serie.code
        except:
            serie_code = 'C'
    
    print(f"📊 Série: {serie_code}")
    print(f"📝 Notes reçues: {notes}")
    
    # Récupérer toutes les filières
    toutes_filieres = Filiere.objects.all().prefetch_related(
        'filiere_matieres__matiere',
        'univ_filieres__universite',
        'filiere_series__serie'
    )
    
    print(f"🏛️ Nombre total de filières: {toutes_filieres.count()}")
    
    resultats = []

    for filiere in toutes_filieres:
        matieres_prio = list(filiere.filiere_matieres.order_by('ordre').select_related('matiere'))
        
        # Vérifier la compatibilité réelle de la série avec cette filière
        serie_compatible, raison = est_filiere_compatible_serie(filiere, serie_code)
        
        # Si la filière est incompatible et que c'est une filière scientifique, on ne la suggère PAS
        if not serie_compatible:
            domaine = filiere.domaine
            categorie_serie = get_categorie_serie(serie_code)
            
            if domaine in ['sante', 'sciences', 'informatique', 'ingenierie']:
                if categorie_serie != 'scientifique':
                    print(f"  ❌ {filiere.nom}: filière scientifique non accessible à la série {serie_code}")
                    continue
        
        # Calculer la moyenne (retourne 0 si une matière prioritaire manque)
        moyenne = calculer_moyenne_prioritaire(notes, matieres_prio)
        
        # Si moyenne = 0, soit pas de matières prioritaires, soit matière manquante
        if moyenne == 0:
            if matieres_prio:
                print(f"  ❌ {filiere.nom}: matière(s) prioritaire(s) manquante(s)")
            continue
        
        # Ne suggérer que si moyenne >= 10
        if moyenne < 10:
            print(f"  ❌ {filiere.nom}: moyenne trop basse ({moyenne:.2f} < 10)")
            continue
        
        univ_filieres = list(filiere.univ_filieres.select_related('universite').all())
        
        if not univ_filieres:
            print(f"  ❌ {filiere.nom}: aucune université associée")
            continue

        universites_details = []
        meilleur_resultat = None
        meilleur_pct = -1

        for uf in univ_filieres:
            if uf.seuil_minimum is None or uf.seuil_demi_bourse is None or uf.seuil_bourse is None:
                continue
            
            res = calculer_chances_admission(moyenne, uf, serie_compatible)
            
            if res['pourcentage'] < 15:
                continue
            
            univ_info = {
                'universite_id': uf.universite.id,
                'universite_nom': uf.universite.nom,
                'universite_ville': uf.universite.ville,
                'est_publique': uf.universite.est_publique,
                'seuil_minimum': uf.seuil_minimum,
                'seuil_demi_bourse': uf.seuil_demi_bourse,
                'seuil_bourse': uf.seuil_bourse,
                'places_disponibles': uf.places_disponibles,
                'frais_inscription': uf.frais_inscription,
                **res,
            }
            universites_details.append(univ_info)
            
            if res['pourcentage'] > meilleur_pct:
                meilleur_pct = res['pourcentage']
                meilleur_resultat = res

        universites_details.sort(key=lambda x: -x['pourcentage'])

        if meilleur_resultat and meilleur_pct >= 15:
            resultats.append({
                'filiere_id': filiere.id,
                'filiere_nom': filiere.nom,
                'filiere_code': filiere.code,
                'filiere_duree': filiere.duree,
                'filiere_domaine': filiere.domaine,
                'filiere_description': filiere.description,
                'filiere_debouches': filiere.get_debouches_list(),
                'filiere_metiers': filiere.get_metiers_list(),
                'filiere_salaire': filiere.salaire_moyen,
                'filiere_taux_emploi': filiere.taux_emploi,
                'moyenne_calculee': round(moyenne, 2),
                'matieres_utilisees': [fm.matiere.nom for fm in matieres_prio],
                'serie_compatible': serie_compatible,
                'raison_compatibilite': raison if not serie_compatible else None,
                **meilleur_resultat,
                'universites': universites_details,
            })
            print(f"  ✅ {filiere.nom}: {meilleur_pct}% (moyenne: {moyenne:.2f})")

    # Tri: d'abord les série compatibles, puis par pourcentage
    resultats.sort(key=lambda x: (-x['pourcentage'], 0 if x['serie_compatible'] else 1))
    
    print(f"\n🎯 {len(resultats)} filière(s) suggérée(s)")
    
    return resultats