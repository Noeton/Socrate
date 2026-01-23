/**
 * COMPETENCE INDEX - Source unique de vérité
 * 
 * Fichier généré automatiquement par scripts/generate-competence-index.js
 * NE PAS MODIFIER MANUELLEMENT - Relancer le script après modification des templates
 * 
 * Généré le: 2026-01-23T10:44:23.055Z
 * Templates: 76
 * Compétences: 48
 * 
 * Couverture:
 * - Complète (2+ templates): 35
 * - Partielle (1 template): 7
 * - Aucune (0 template): 6
 */

// ═══════════════════════════════════════════════════════════════════════════
// INDEX PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const COMPETENCE_INDEX = {
  "byCompetence": {
    "1": {
      "key": "SAISIE_DONNEES",
      "nom": "Saisie de données",
      "niveau": "debutant",
      "templates": [
        "debutant_24_saisie_navigation"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "partial"
    },
    "2": {
      "key": "FORMATAGE_CELLULES",
      "nom": "Formatage cellules",
      "niveau": "debutant",
      "templates": [
        "debutant_04_planning_travail",
        "debutant_08_annuaire_entreprise",
        "debutant_25_formatage_cellules"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "3": {
      "key": "SOMME",
      "nom": "SOMME",
      "niveau": "debutant",
      "templates": [
        "debutant_01_budget_mensuel",
        "debutant_14_diagnostic_erreurs",
        "debutant_26_somme_bases",
        "debutant_27_nb_nbval_comptage"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "4": {
      "key": "MOYENNE",
      "nom": "MOYENNE",
      "niveau": "debutant",
      "templates": [
        "debutant_01_budget_mensuel",
        "debutant_02_notes_etudiants",
        "debutant_14_diagnostic_erreurs",
        "intermediaire_14_mentions_bac",
        "intermediaire_21_moyennes_classes",
        "intermediaire_23_dashboard_ventes_graphiques"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "5": {
      "key": "MIN_MAX",
      "nom": "MIN/MAX",
      "niveau": "debutant",
      "templates": [
        "debutant_02_notes_etudiants",
        "debutant_03_calcul_prix"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "6": {
      "key": "COPIER_COLLER",
      "nom": "Copier-coller",
      "niveau": "debutant",
      "templates": [
        "debutant_04_planning_travail",
        "debutant_17_recopie_formules"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "7": {
      "key": "TRI_SIMPLE",
      "nom": "Tri simple",
      "niveau": "debutant",
      "templates": [
        "debutant_05_tri_ventes",
        "debutant_22_tri_filtres_analyse"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "8": {
      "key": "FILTRES_BASIQUES",
      "nom": "Filtres basiques",
      "niveau": "debutant",
      "templates": [
        "debutant_05_tri_ventes",
        "debutant_22_tri_filtres_analyse"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "9": {
      "key": "SI",
      "nom": "SI",
      "niveau": "debutant",
      "templates": [
        "debutant_01_budget_mensuel",
        "debutant_06_alerte_stock",
        "debutant_14_diagnostic_erreurs",
        "intermediaire_27_sierreur_formules_robustes",
        "intermediaire_43_si_imbriques_scoring"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "10": {
      "key": "MFC_SIMPLE",
      "nom": "MFC simple",
      "niveau": "debutant",
      "templates": [
        "debutant_07_temperatures",
        "debutant_20_mfc_alertes",
        "intermediaire_42_mfc_formule"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "11": {
      "key": "NB_SI",
      "nom": "NB.SI",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_11_comptage_ventes",
        "intermediaire_14_mentions_bac",
        "intermediaire_32_nbsi_comptage_conditionnel"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "12": {
      "key": "NB_SI_ENS",
      "nom": "NB.SI.ENS",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_16_analyse_multicriteres",
        "intermediaire_25_nbsi_ens_rh"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "13": {
      "key": "SOMME_SI",
      "nom": "SOMME.SI",
      "niveau": "intermediaire",
      "templates": [
        "debutant_16_camembert_categories",
        "intermediaire_12_ca_par_region",
        "intermediaire_21_moyennes_classes",
        "intermediaire_23_dashboard_ventes_graphiques"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "14": {
      "key": "SOMME_SI_ENS",
      "nom": "SOMME.SI.ENS",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_17_ca_segmente",
        "intermediaire_26_sommesi_ens_ventes"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "15": {
      "key": "REFERENCES_ABSOLUES",
      "nom": "Références absolues",
      "niveau": "intermediaire",
      "templates": [
        "debutant_11_grille_tarifaire",
        "debutant_12_tva_multipays",
        "debutant_14_diagnostic_erreurs",
        "intermediaire_13_calcul_remises",
        "intermediaire_34_references_absolues_mixtes",
        "intermediaire_46_references_table_multiplication",
        "avance_07_index_equiv_prix"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "16": {
      "key": "SI_IMBRIQUES",
      "nom": "SI imbriqués",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_14_mentions_bac",
        "intermediaire_24_si_imbriques_mentions",
        "intermediaire_43_si_imbriques_scoring"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "17": {
      "key": "FONCTIONS_TEXTE",
      "nom": "Fonctions texte",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_18_generation_emails",
        "intermediaire_33_fonctions_texte_manipulation",
        "intermediaire_35_tcd_analyse_ventes",
        "intermediaire_38_tcd_structure",
        "intermediaire_44_texte_extraction_codes"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "18": {
      "key": "RECHERCHEV",
      "nom": "RECHERCHEV",
      "niveau": "intermediaire",
      "templates": [
        "debutant_12_tva_multipays",
        "debutant_14_diagnostic_erreurs",
        "intermediaire_15_commandes_recherchev",
        "intermediaire_27_sierreur_formules_robustes"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "19": {
      "key": "CONCATENER",
      "nom": "CONCATENER",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_18_generation_emails",
        "intermediaire_33_fonctions_texte_manipulation"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "20": {
      "key": "FONCTIONS_DATE",
      "nom": "Fonctions date",
      "niveau": "intermediaire",
      "templates": [
        "debutant_13_planning_mensuel",
        "intermediaire_19_anciennete_employes",
        "intermediaire_31_fonctions_dates_complet",
        "intermediaire_33_fonctions_texte_manipulation",
        "intermediaire_44_texte_extraction_codes",
        "intermediaire_45_dates_echeances"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "21": {
      "key": "GRAPHIQUES_BASIQUES",
      "nom": "Graphiques basiques",
      "niveau": "intermediaire",
      "templates": [
        "debutant_09_graphique_ca",
        "debutant_15_premier_graphique",
        "debutant_16_camembert_categories",
        "debutant_23_graphiques_visualisation",
        "intermediaire_23_dashboard_ventes_graphiques",
        "intermediaire_31_fonctions_dates_complet",
        "intermediaire_45_dates_echeances",
        "avance_30_dashboard_executif"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "22": {
      "key": "SIERREUR",
      "nom": "SIERREUR",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_27_sierreur_formules_robustes",
        "intermediaire_29_validation_donnees_formulaire",
        "intermediaire_41_validation_liste"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "23": {
      "key": "TCD_BASIQUE",
      "nom": "TCD basique",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_20_analyse_tcd",
        "intermediaire_35_tcd_analyse_ventes",
        "intermediaire_38_tcd_structure",
        "avance_04_sommeprod_calculs_matriciels",
        "avance_09_sommeprod_multicriteres",
        "avance_30_dashboard_executif"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "24": {
      "key": "INDEX_EQUIV",
      "nom": "INDEX/EQUIV",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_37_mfc_avancee",
        "intermediaire_42_mfc_formule",
        "avance_01_index_equiv_recherche_bidirectionnelle",
        "avance_07_index_equiv_prix",
        "avance_23_index_equiv_commandes",
        "avance_24_tarification_dynamique",
        "avance_30_dashboard_executif"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "25": {
      "key": "VALIDATION_DONNEES",
      "nom": "Validation données",
      "niveau": "intermediaire",
      "templates": [
        "debutant_10_formulaire_conges",
        "debutant_23_graphiques_visualisation",
        "intermediaire_29_validation_donnees_formulaire",
        "intermediaire_41_validation_liste"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "26": {
      "key": "TCD_AVANCE",
      "nom": "TCD avancé",
      "niveau": "avance",
      "templates": [
        "avance_01_index_equiv_recherche_bidirectionnelle",
        "avance_07_index_equiv_prix"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "27": {
      "key": "TABLEAUX_STRUCTURES",
      "nom": "Tableaux structurés",
      "niveau": "avance",
      "templates": [
        "intermediaire_36_tableaux_structures",
        "avance_25_tableaux_structures",
        "avance_30_dashboard_executif"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "28": {
      "key": "SOMMEPROD",
      "nom": "SOMMEPROD",
      "niveau": "avance",
      "templates": [
        "avance_04_sommeprod_calculs_matriciels",
        "avance_05_decaler_plages_dynamiques",
        "avance_08_decaler_moyenne_mobile",
        "avance_09_sommeprod_multicriteres"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "29": {
      "key": "FORMULES_MATRICIELLES",
      "nom": "Formules matricielles",
      "niveau": "avance",
      "templates": [
        "avance_03_formules_matricielles_dynamiques",
        "avance_27_moyennes_mobiles",
        "avance_29_formules_dynamiques",
        "avance_30_dashboard_executif"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "30": {
      "key": "INDIRECT",
      "nom": "INDIRECT",
      "niveau": "avance",
      "templates": [
        "avance_05_decaler_plages_dynamiques",
        "avance_06_power_query_intro",
        "avance_08_decaler_moyenne_mobile",
        "avance_27_moyennes_mobiles"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "31": {
      "key": "GRAPHIQUES_AVANCES",
      "nom": "Graphiques avancés",
      "niveau": "avance",
      "templates": [
        "avance_05_decaler_plages_dynamiques",
        "avance_26_dashboard_graphiques"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "32": {
      "key": "MFC_AVANCEE",
      "nom": "MFC avancée",
      "niveau": "avance",
      "templates": [
        "intermediaire_22_heatmap_ventes",
        "intermediaire_37_mfc_avancee",
        "intermediaire_42_mfc_formule"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "33": {
      "key": "MACROS",
      "nom": "Macros",
      "niveau": "avance",
      "templates": [],
      "validationType": "manual",
      "needsScreenshot": false,
      "coverage": "none"
    },
    "34": {
      "key": "VBA_BASIQUE",
      "nom": "VBA basique",
      "niveau": "avance",
      "templates": [],
      "validationType": "manual",
      "needsScreenshot": false,
      "coverage": "none"
    },
    "35": {
      "key": "POWER_QUERY_IMPORT",
      "nom": "Power Query Import",
      "niveau": "avance",
      "templates": [
        "avance_06_power_query_intro"
      ],
      "validationType": "manual",
      "needsScreenshot": false,
      "coverage": "partial"
    },
    "36": {
      "key": "POWER_QUERY_TRANSFORM",
      "nom": "Power Query Transform",
      "niveau": "avance",
      "templates": [],
      "validationType": "manual",
      "needsScreenshot": false,
      "coverage": "none"
    },
    "37": {
      "key": "POWER_QUERY_MERGE",
      "nom": "Power Query Merge",
      "niveau": "avance",
      "templates": [],
      "validationType": "manual",
      "needsScreenshot": false,
      "coverage": "none"
    },
    "38": {
      "key": "RECHERCHEX",
      "nom": "RECHERCHEX",
      "niveau": "avance",
      "templates": [
        "avance_01_index_equiv_recherche_bidirectionnelle",
        "avance_02_recherchex_moderne"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "39": {
      "key": "FORMULES_DYNAMIQUES",
      "nom": "Formules dynamiques",
      "niveau": "avance",
      "templates": [
        "avance_02_recherchex_moderne",
        "avance_03_formules_matricielles_dynamiques",
        "avance_29_formules_dynamiques"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "40": {
      "key": "TABLEAUX_BORD",
      "nom": "Tableaux de bord",
      "niveau": "avance",
      "templates": [
        "avance_26_dashboard_graphiques"
      ],
      "validationType": "manual",
      "needsScreenshot": true,
      "coverage": "partial"
    },
    "51": {
      "key": "REFERENCES_MIXTES",
      "nom": "Références mixtes",
      "niveau": "intermediaire",
      "templates": [
        "debutant_11_grille_tarifaire",
        "intermediaire_34_references_absolues_mixtes",
        "intermediaire_46_references_table_multiplication"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "full"
    },
    "52": {
      "key": "SERIES_AUTOMATIQUES",
      "nom": "Séries automatiques",
      "niveau": "debutant",
      "templates": [
        "debutant_13_planning_mensuel",
        "debutant_18_series_automatiques"
      ],
      "validationType": "semi_auto",
      "needsScreenshot": true,
      "coverage": "full"
    },
    "53": {
      "key": "RECHERCHEV_APPROCHEE",
      "nom": "RECHERCHEV approchée",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_30_recherchev_approchee_baremes"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "partial"
    },
    "54": {
      "key": "RECHERCHEH",
      "nom": "RECHERCHEH",
      "niveau": "intermediaire",
      "templates": [
        "intermediaire_28_rechercheh_planning"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "partial"
    },
    "55": {
      "key": "FONCTIONS_BD",
      "nom": "Fonctions BD",
      "niveau": "avance",
      "templates": [],
      "validationType": "manual",
      "needsScreenshot": false,
      "coverage": "none"
    },
    "56": {
      "key": "REFERENCES_STRUCTUREES",
      "nom": "Références structurées",
      "niveau": "avance",
      "templates": [
        "intermediaire_36_tableaux_structures"
      ],
      "validationType": "manual",
      "needsScreenshot": false,
      "coverage": "partial"
    },
    "57": {
      "key": "FILTRES_AVANCES",
      "nom": "Filtres avancés",
      "niveau": "avance",
      "templates": [],
      "validationType": "manual",
      "needsScreenshot": true,
      "coverage": "none"
    },
    "58": {
      "key": "COLLAGE_SPECIAL",
      "nom": "Collage spécial",
      "niveau": "debutant",
      "templates": [
        "debutant_19_collage_special"
      ],
      "validationType": "full_auto",
      "needsScreenshot": false,
      "coverage": "partial"
    }
  },
  "byTemplate": {
    "debutant_01_budget_mensuel": {
      "id": "debutant_01_budget_mensuel",
      "titre": "Gestion Budget Personnel Mensuel",
      "niveau": "debutant",
      "metier": "finance",
      "competenceIds": [
        3,
        4,
        9
      ],
      "competenceNames": [
        "SOMME",
        "MOYENNE",
        "SI"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": false,
      "filename": "debutant_01_budget_mensuel.json"
    },
    "debutant_02_notes_etudiants": {
      "id": "debutant_02_notes_etudiants",
      "titre": "Calcul Moyennes et Classement Étudiants",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        4,
        5
      ],
      "competenceNames": [
        "MOYENNE",
        "MIN",
        "MAX"
      ],
      "checkpointsCount": 5,
      "hasVisualCheckpoints": false,
      "filename": "debutant_02_notes_etudiants.json"
    },
    "debutant_03_calcul_prix": {
      "id": "debutant_03_calcul_prix",
      "titre": "Catalogue Produits - Calcul Prix TTC",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        5
      ],
      "competenceNames": [
        "calculs_base",
        "MIN",
        "MAX"
      ],
      "checkpointsCount": 5,
      "hasVisualCheckpoints": false,
      "filename": "debutant_03_calcul_prix.json"
    },
    "debutant_04_planning_travail": {
      "id": "debutant_04_planning_travail",
      "titre": "Planning Heures de Travail - Copier-Coller",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        6,
        2
      ],
      "competenceNames": [
        "copier_coller",
        "formatage"
      ],
      "checkpointsCount": 10,
      "hasVisualCheckpoints": false,
      "filename": "debutant_04_planning_travail.json"
    },
    "debutant_05_tri_ventes": {
      "id": "debutant_05_tri_ventes",
      "titre": "Tri et Recherche dans Liste de Ventes",
      "niveau": "debutant",
      "metier": "commercial",
      "competenceIds": [
        7,
        8
      ],
      "competenceNames": [
        "tri",
        "filtres"
      ],
      "checkpointsCount": 5,
      "hasVisualCheckpoints": false,
      "filename": "debutant_05_tri_ventes.json"
    },
    "debutant_06_alerte_stock": {
      "id": "debutant_06_alerte_stock",
      "titre": "Alertes de Stock avec Fonction SI",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        9
      ],
      "competenceNames": [
        "SI"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "debutant_06_alerte_stock.json"
    },
    "debutant_07_temperatures": {
      "id": "debutant_07_temperatures",
      "titre": "Suivi Températures avec Mise en Forme Conditionnelle",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        10
      ],
      "competenceNames": [
        "mise_en_forme_conditionnelle"
      ],
      "checkpointsCount": 5,
      "hasVisualCheckpoints": false,
      "filename": "debutant_07_temperatures.json"
    },
    "debutant_08_annuaire_entreprise": {
      "id": "debutant_08_annuaire_entreprise",
      "titre": "Annuaire Entreprise - Formatage Professionnel",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        2
      ],
      "competenceNames": [
        "formatage"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": true,
      "filename": "debutant_08_annuaire_entreprise.json"
    },
    "debutant_09_graphique_ca": {
      "id": "debutant_09_graphique_ca",
      "titre": "Graphique d'Évolution du Chiffre d'Affaires",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        21
      ],
      "competenceNames": [
        "graphiques"
      ],
      "checkpointsCount": 5,
      "hasVisualCheckpoints": true,
      "filename": "debutant_09_graphique_ca.json"
    },
    "debutant_10_formulaire_conges": {
      "id": "debutant_10_formulaire_conges",
      "titre": "Formulaire de Demande de Congés avec Validation",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        25
      ],
      "competenceNames": [
        "validation_donnees"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": false,
      "filename": "debutant_10_formulaire_conges.json"
    },
    "debutant_11_grille_tarifaire": {
      "id": "debutant_11_grille_tarifaire",
      "titre": "Maîtrise des Références - Grille Tarifaire SaaS",
      "niveau": "debutant",
      "metier": "commercial",
      "competenceIds": [
        15,
        51
      ],
      "competenceNames": [
        "Références absolues ($)",
        "Références mixtes"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "debutant_11_grille_tarifaire.json"
    },
    "debutant_12_tva_multipays": {
      "id": "debutant_12_tva_multipays",
      "titre": "Calcul TVA Multi-Pays avec RECHERCHEV",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        18
      ],
      "competenceNames": [
        "RECHERCHEV",
        "Références absolues ($)"
      ],
      "checkpointsCount": 9,
      "hasVisualCheckpoints": false,
      "filename": "debutant_12_tva_multipays.json"
    },
    "debutant_13_planning_mensuel": {
      "id": "debutant_13_planning_mensuel",
      "titre": "Génération Planning Mensuel - Séries et Dates",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        52,
        20
      ],
      "competenceNames": [
        "Génération de séries",
        "Formules date (AUJOURDHUI, MOIS)"
      ],
      "checkpointsCount": 10,
      "hasVisualCheckpoints": false,
      "filename": "debutant_13_planning_mensuel.json"
    },
    "debutant_14_diagnostic_erreurs": {
      "id": "debutant_14_diagnostic_erreurs",
      "titre": "Diagnostic et Correction d'Erreurs Excel",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        3,
        4,
        9,
        18
      ],
      "competenceNames": [
        "SOMME",
        "MOYENNE",
        "SI simple",
        "RECHERCHEV",
        "Références absolues ($)"
      ],
      "checkpointsCount": 11,
      "hasVisualCheckpoints": false,
      "filename": "debutant_14_diagnostic_erreurs.json"
    },
    "debutant_15_premier_graphique": {
      "id": "debutant_15_premier_graphique",
      "titre": "Mon Premier Graphique - Évolution du CA",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        21
      ],
      "competenceNames": [
        "Graphiques simples"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": true,
      "filename": "debutant_15_premier_graphique.json"
    },
    "debutant_16_camembert_categories": {
      "id": "debutant_16_camembert_categories",
      "titre": "Répartition des Ventes par Catégorie - Graphique Secteurs",
      "niveau": "debutant",
      "metier": "commercial",
      "competenceIds": [
        13
      ],
      "competenceNames": [
        "Graphiques simples",
        "SOMME.SI"
      ],
      "checkpointsCount": 12,
      "hasVisualCheckpoints": true,
      "filename": "debutant_16_camembert_categories.json"
    },
    "debutant_17_recopie_formules": {
      "id": "debutant_17_recopie_formules",
      "titre": "Maîtriser la Recopie de Formules",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        6
      ],
      "competenceNames": [
        "Copier-coller",
        "Recopie de formules"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": false,
      "filename": "debutant_17_recopie_formules.json"
    },
    "debutant_18_series_automatiques": {
      "id": "debutant_18_series_automatiques",
      "titre": "Générer des Séries Automatiques",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        52
      ],
      "competenceNames": [
        "Génération de séries",
        "Recopie incrémentée"
      ],
      "checkpointsCount": 9,
      "hasVisualCheckpoints": false,
      "filename": "debutant_18_series_automatiques.json"
    },
    "debutant_19_collage_special": {
      "id": "debutant_19_collage_special",
      "titre": "Maîtriser le Collage Spécial",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        58
      ],
      "competenceNames": [
        "Collage spécial",
        "Valeurs",
        "Transposition"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "debutant_19_collage_special.json"
    },
    "debutant_20_mfc_alertes": {
      "id": "debutant_20_mfc_alertes",
      "titre": "Alertes Visuelles avec la Mise en Forme Conditionnelle",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        10
      ],
      "competenceNames": [
        "Mise en forme conditionnelle",
        "Alertes visuelles"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": true,
      "filename": "debutant_20_mfc_alertes.json"
    },
    "debutant_22_tri_filtres_analyse": {
      "id": "debutant_22_tri_filtres_analyse",
      "titre": "Tri et Filtres : Organiser et Analyser ses Données",
      "niveau": "debutant",
      "metier": "commercial",
      "competenceIds": [
        7,
        8
      ],
      "competenceNames": [
        "Tri simple",
        "Tri multi-niveaux",
        "Filtres automatiques",
        "Filtres personnalisés"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "debutant_22_tri_filtres_analyse.json"
    },
    "debutant_23_graphiques_visualisation": {
      "id": "debutant_23_graphiques_visualisation",
      "titre": "Graphiques : Visualiser ses Données",
      "niveau": "debutant",
      "metier": "marketing",
      "competenceIds": [
        25
      ],
      "competenceNames": [
        "Graphiques simples",
        "Histogrammes",
        "Courbes",
        "Secteurs"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": true,
      "filename": "debutant_23_graphiques_visualisation.json"
    },
    "debutant_24_saisie_navigation": {
      "id": "debutant_24_saisie_navigation",
      "titre": "Saisie et Navigation : Les Bases Essentielles",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        1
      ],
      "competenceNames": [
        "Saisie de données",
        "Navigation clavier",
        "Sélection",
        "Raccourcis"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "debutant_24_saisie_navigation.json"
    },
    "debutant_25_formatage_cellules": {
      "id": "debutant_25_formatage_cellules",
      "titre": "Formatage : Rendre ses Données Lisibles",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        2
      ],
      "competenceNames": [
        "Formatage cellules",
        "Format nombre",
        "Alignement",
        "Bordures",
        "Couleurs"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": true,
      "filename": "debutant_25_formatage_cellules.json"
    },
    "debutant_26_somme_bases": {
      "id": "debutant_26_somme_bases",
      "titre": "SOMME : La Formule Fondamentale",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        3
      ],
      "competenceNames": [
        "SOMME",
        "Formules de base",
        "Plages",
        "Raccourcis"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "debutant_26_somme_bases.json"
    },
    "debutant_27_nb_nbval_comptage": {
      "id": "debutant_27_nb_nbval_comptage",
      "titre": "Compter avec NB et NBVAL",
      "niveau": "debutant",
      "metier": "general",
      "competenceIds": [
        3
      ],
      "competenceNames": [
        "NB",
        "NBVAL",
        "Comptage",
        "Différence nombres/valeurs"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "debutant_27_nb_nbval_comptage.json"
    },
    "intermediaire_11_comptage_ventes": {
      "id": "intermediaire_11_comptage_ventes",
      "titre": "Analyse Commerciale avec NB.SI",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        11
      ],
      "competenceNames": [
        "NB.SI"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_11_comptage_ventes.json"
    },
    "intermediaire_12_ca_par_region": {
      "id": "intermediaire_12_ca_par_region",
      "titre": "Calcul CA par Région avec SOMME.SI",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        13
      ],
      "competenceNames": [
        "SOMME.SI",
        "calculs_pourcentage"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": true,
      "filename": "intermediaire_12_ca_par_region.json"
    },
    "intermediaire_13_calcul_remises": {
      "id": "intermediaire_13_calcul_remises",
      "titre": "Calcul de Remises avec Références Absolues",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        15
      ],
      "competenceNames": [
        "references_absolues"
      ],
      "checkpointsCount": 9,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_13_calcul_remises.json"
    },
    "intermediaire_14_mentions_bac": {
      "id": "intermediaire_14_mentions_bac",
      "titre": "Attribution Mentions avec SI Imbriqués",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        4,
        11
      ],
      "competenceNames": [
        "SI_imbriques",
        "MOYENNE",
        "NB.SI"
      ],
      "checkpointsCount": 10,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_14_mentions_bac.json"
    },
    "intermediaire_15_commandes_recherchev": {
      "id": "intermediaire_15_commandes_recherchev",
      "titre": "Gestion Commandes avec RECHERCHEV",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        18
      ],
      "competenceNames": [
        "RECHERCHEV"
      ],
      "checkpointsCount": 9,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_15_commandes_recherchev.json"
    },
    "intermediaire_16_analyse_multicriteres": {
      "id": "intermediaire_16_analyse_multicriteres",
      "titre": "Analyse Multi-Critères avec NB.SI.ENS",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        12
      ],
      "competenceNames": [
        "NB.SI.ENS"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_16_analyse_multicriteres.json"
    },
    "intermediaire_17_ca_segmente": {
      "id": "intermediaire_17_ca_segmente",
      "titre": "CA Segmenté avec SOMME.SI.ENS",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        14
      ],
      "competenceNames": [
        "SOMME.SI.ENS"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_17_ca_segmente.json"
    },
    "intermediaire_18_generation_emails": {
      "id": "intermediaire_18_generation_emails",
      "titre": "Génération Automatique d'Emails et Codes",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        19
      ],
      "competenceNames": [
        "CONCATENER",
        "texte"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_18_generation_emails.json"
    },
    "intermediaire_19_anciennete_employes": {
      "id": "intermediaire_19_anciennete_employes",
      "titre": "Calcul d'Ancienneté et Dates avec Formules",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        20
      ],
      "competenceNames": [
        "formules_date"
      ],
      "checkpointsCount": 9,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_19_anciennete_employes.json"
    },
    "intermediaire_20_analyse_tcd": {
      "id": "intermediaire_20_analyse_tcd",
      "titre": "Analyse Ventes avec Tableau Croisé Dynamique",
      "niveau": "intermediaire",
      "metier": "commercial",
      "competenceIds": [
        23
      ],
      "competenceNames": [
        "tableaux_croises_dynamiques"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": true,
      "filename": "intermediaire_20_analyse_tcd.json"
    },
    "intermediaire_21_moyennes_classes": {
      "id": "intermediaire_21_moyennes_classes",
      "titre": "Moyennes par Classe avec MOYENNE.SI",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        4,
        13
      ],
      "competenceNames": [
        "MOYENNE.SI"
      ],
      "checkpointsCount": 9,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_21_moyennes_classes.json"
    },
    "intermediaire_22_heatmap_ventes": {
      "id": "intermediaire_22_heatmap_ventes",
      "titre": "Heatmap des Ventes avec Mise en Forme Avancée",
      "niveau": "intermediaire",
      "metier": "commercial",
      "competenceIds": [
        32
      ],
      "competenceNames": [
        "mise_forme_conditionnelle_avancee"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_22_heatmap_ventes.json"
    },
    "intermediaire_23_dashboard_ventes_graphiques": {
      "id": "intermediaire_23_dashboard_ventes_graphiques",
      "titre": "Dashboard Commercial : Visualisation des Performances",
      "niveau": "intermediaire",
      "metier": "commercial",
      "competenceIds": [
        21,
        13,
        4
      ],
      "competenceNames": [
        "Graphiques basiques",
        "SOMME.SI",
        "Analyse de données"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": true,
      "filename": "intermediaire_23_dashboard_ventes_graphiques.json"
    },
    "intermediaire_24_si_imbriques_mentions": {
      "id": "intermediaire_24_si_imbriques_mentions",
      "titre": "SI Imbriqués : Attribution Automatique de Mentions",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        16
      ],
      "competenceNames": [
        "SI imbriqués",
        "Logique conditionnelle"
      ],
      "checkpointsCount": 9,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_24_si_imbriques_mentions.json"
    },
    "intermediaire_25_nbsi_ens_rh": {
      "id": "intermediaire_25_nbsi_ens_rh",
      "titre": "NB.SI.ENS : Analyse RH Multi-Critères",
      "niveau": "intermediaire",
      "metier": "rh",
      "competenceIds": [
        12
      ],
      "competenceNames": [
        "NB.SI.ENS",
        "Comptage multi-critères"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_25_nbsi_ens_rh.json"
    },
    "intermediaire_26_sommesi_ens_ventes": {
      "id": "intermediaire_26_sommesi_ens_ventes",
      "titre": "SOMME.SI.ENS : Analyse des Ventes Multi-Critères",
      "niveau": "intermediaire",
      "metier": "commercial",
      "competenceIds": [
        14
      ],
      "competenceNames": [
        "SOMME.SI.ENS",
        "Somme multi-critères"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_26_sommesi_ens_ventes.json"
    },
    "intermediaire_27_sierreur_formules_robustes": {
      "id": "intermediaire_27_sierreur_formules_robustes",
      "titre": "SIERREUR : Formules Robustes et Gestion d'Erreurs",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        9,
        18
      ],
      "competenceNames": [
        "SIERREUR",
        "Gestion des erreurs",
        "Formules robustes"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_27_sierreur_formules_robustes.json"
    },
    "intermediaire_28_rechercheh_planning": {
      "id": "intermediaire_28_rechercheh_planning",
      "titre": "RECHERCHEH : Recherche dans un Planning Horizontal",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        54
      ],
      "competenceNames": [
        "RECHERCHEH",
        "Recherche horizontale"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_28_rechercheh_planning.json"
    },
    "intermediaire_29_validation_donnees_formulaire": {
      "id": "intermediaire_29_validation_donnees_formulaire",
      "titre": "Validation de Données : Formulaire de Saisie Contrôlé",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        22
      ],
      "competenceNames": [
        "Validation de données",
        "Listes déroulantes",
        "Contrôle de saisie"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_29_validation_donnees_formulaire.json"
    },
    "intermediaire_30_recherchev_approchee_baremes": {
      "id": "intermediaire_30_recherchev_approchee_baremes",
      "titre": "RECHERCHEV Approchée : Barèmes et Tranches Automatiques",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        53
      ],
      "competenceNames": [
        "RECHERCHEV approchée",
        "Barèmes",
        "Tranches"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_30_recherchev_approchee_baremes.json"
    },
    "intermediaire_31_fonctions_dates_complet": {
      "id": "intermediaire_31_fonctions_dates_complet",
      "titre": "Maîtriser les Fonctions Date : DATEDIF, ANNEE, MOIS et Plus",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        21
      ],
      "competenceNames": [
        "Fonctions date",
        "DATEDIF",
        "ANNEE",
        "MOIS",
        "JOUR",
        "FIN.MOIS"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_31_fonctions_dates_complet.json"
    },
    "intermediaire_32_nbsi_comptage_conditionnel": {
      "id": "intermediaire_32_nbsi_comptage_conditionnel",
      "titre": "NB.SI : Compter avec des Critères",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        11
      ],
      "competenceNames": [
        "NB.SI",
        "Comptage conditionnel",
        "Critères"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_32_nbsi_comptage_conditionnel.json"
    },
    "intermediaire_33_fonctions_texte_manipulation": {
      "id": "intermediaire_33_fonctions_texte_manipulation",
      "titre": "Fonctions Texte : Manipuler et Transformer les Données",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        19,
        20
      ],
      "competenceNames": [
        "CONCATENER",
        "CONCAT",
        "GAUCHE",
        "DROITE",
        "STXT",
        "CHERCHE",
        "NBCAR"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_33_fonctions_texte_manipulation.json"
    },
    "intermediaire_34_references_absolues_mixtes": {
      "id": "intermediaire_34_references_absolues_mixtes",
      "titre": "Références Absolues ($) et Mixtes : Maîtriser la Recopie",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        15,
        51
      ],
      "competenceNames": [
        "Références absolues",
        "Références mixtes",
        "Recopie de formules"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_34_references_absolues_mixtes.json"
    },
    "intermediaire_35_tcd_analyse_ventes": {
      "id": "intermediaire_35_tcd_analyse_ventes",
      "titre": "Tableaux Croisés Dynamiques : L'Outil d'Analyse Ultime",
      "niveau": "intermediaire",
      "metier": "commercial",
      "competenceIds": [
        17
      ],
      "competenceNames": [
        "Tableaux croisés dynamiques",
        "TCD",
        "Analyse multidimensionnelle"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": true,
      "filename": "intermediaire_35_tcd_analyse_ventes.json"
    },
    "intermediaire_36_tableaux_structures": {
      "id": "intermediaire_36_tableaux_structures",
      "titre": "Tableaux Structurés : Organiser ses Données Intelligemment",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        27,
        56
      ],
      "competenceNames": [
        "Tableaux structurés",
        "Références structurées",
        "Ctrl+T"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_36_tableaux_structures.json"
    },
    "intermediaire_37_mfc_avancee": {
      "id": "intermediaire_37_mfc_avancee",
      "titre": "Mise en Forme Conditionnelle Avancée",
      "niveau": "intermediaire",
      "metier": "commercial",
      "competenceIds": [
        24
      ],
      "competenceNames": [
        "MFC avancée",
        "Barres de données",
        "Nuances couleurs",
        "Jeux d'icônes",
        "Formules MFC"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": true,
      "filename": "intermediaire_37_mfc_avancee.json"
    },
    "intermediaire_38_tcd_structure": {
      "id": "intermediaire_38_tcd_structure",
      "titre": "Structurer un Tableau Croisé Dynamique",
      "niveau": "intermediaire",
      "metier": "commercial",
      "competenceIds": [
        17
      ],
      "competenceNames": [
        "Tableaux croisés dynamiques",
        "Champs lignes/colonnes",
        "Structure TCD"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": true,
      "filename": "intermediaire_38_tcd_structure.json"
    },
    "intermediaire_41_validation_liste": {
      "id": "intermediaire_41_validation_liste",
      "titre": "Créer des listes déroulantes avec validation",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        22
      ],
      "competenceNames": [
        "Validation données",
        "Listes déroulantes",
        "Contrôle de saisie"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_41_validation_liste.json"
    },
    "intermediaire_42_mfc_formule": {
      "id": "intermediaire_42_mfc_formule",
      "titre": "Mise en forme conditionnelle avec formules",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        24
      ],
      "competenceNames": [
        "MFC avancée",
        "Formules MFC",
        "Mise en forme conditionnelle"
      ],
      "checkpointsCount": 5,
      "hasVisualCheckpoints": true,
      "filename": "intermediaire_42_mfc_formule.json"
    },
    "intermediaire_43_si_imbriques_scoring": {
      "id": "intermediaire_43_si_imbriques_scoring",
      "titre": "Scoring Client avec SI Imbriqués",
      "niveau": "intermediaire",
      "metier": "commercial",
      "competenceIds": [
        16,
        9
      ],
      "competenceNames": [
        "SI imbriqués",
        "Logique conditionnelle",
        "Classification"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_43_si_imbriques_scoring.json"
    },
    "intermediaire_44_texte_extraction_codes": {
      "id": "intermediaire_44_texte_extraction_codes",
      "titre": "Extraction de Données avec Fonctions Texte",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        20
      ],
      "competenceNames": [
        "GAUCHE",
        "DROITE",
        "STXT",
        "CHERCHE",
        "NBCAR",
        "Extraction de données"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_44_texte_extraction_codes.json"
    },
    "intermediaire_45_dates_echeances": {
      "id": "intermediaire_45_dates_echeances",
      "titre": "Gestion des Échéances avec Fonctions Date",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        21
      ],
      "competenceNames": [
        "DATEDIF",
        "FIN.MOIS",
        "JOURSEM",
        "NB.JOURS.OUVRES",
        "Calculs de dates"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_45_dates_echeances.json"
    },
    "intermediaire_46_references_table_multiplication": {
      "id": "intermediaire_46_references_table_multiplication",
      "titre": "Table de Multiplication - Maîtriser les Références",
      "niveau": "intermediaire",
      "metier": "general",
      "competenceIds": [
        15,
        51
      ],
      "competenceNames": [
        "Références absolues ($)",
        "Références mixtes",
        "Recopie de formules"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "intermediaire_46_references_table_multiplication.json"
    },
    "avance_01_index_equiv_recherche_bidirectionnelle": {
      "id": "avance_01_index_equiv_recherche_bidirectionnelle",
      "titre": "INDEX + EQUIV : La Recherche Bidirectionnelle",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        26
      ],
      "competenceNames": [
        "INDEX",
        "EQUIV",
        "Recherche bidirectionnelle",
        "Alternative RECHERCHEV"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "avance_01_index_equiv_recherche_bidirectionnelle.json"
    },
    "avance_02_recherchex_moderne": {
      "id": "avance_02_recherchex_moderne",
      "titre": "RECHERCHEX : Le Successeur Moderne de RECHERCHEV",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        38
      ],
      "competenceNames": [
        "RECHERCHEX",
        "XLOOKUP",
        "Excel 365"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "avance_02_recherchex_moderne.json"
    },
    "avance_03_formules_matricielles_dynamiques": {
      "id": "avance_03_formules_matricielles_dynamiques",
      "titre": "Formules Matricielles Dynamiques : FILTER, SORT, UNIQUE",
      "niveau": "avance",
      "metier": "marketing",
      "competenceIds": [
        29,
        39
      ],
      "competenceNames": [
        "Formules matricielles",
        "FILTER",
        "SORT",
        "UNIQUE",
        "Tableaux dynamiques"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "avance_03_formules_matricielles_dynamiques.json"
    },
    "avance_04_sommeprod_calculs_matriciels": {
      "id": "avance_04_sommeprod_calculs_matriciels",
      "titre": "SOMMEPROD : Calculs Matriciels Sans Limites",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        23
      ],
      "competenceNames": [
        "SOMMEPROD",
        "Calculs matriciels",
        "Conditions multiples"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "avance_04_sommeprod_calculs_matriciels.json"
    },
    "avance_05_decaler_plages_dynamiques": {
      "id": "avance_05_decaler_plages_dynamiques",
      "titre": "DECALER : Créer des Plages Dynamiques",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        28
      ],
      "competenceNames": [
        "DECALER",
        "Plages dynamiques",
        "Graphiques dynamiques"
      ],
      "checkpointsCount": 6,
      "hasVisualCheckpoints": false,
      "filename": "avance_05_decaler_plages_dynamiques.json"
    },
    "avance_06_power_query_intro": {
      "id": "avance_06_power_query_intro",
      "titre": "Power Query : Automatiser le Nettoyage de Données",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        30
      ],
      "competenceNames": [
        "Power Query",
        "ETL",
        "Nettoyage données",
        "Transformation"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "avance_06_power_query_intro.json"
    },
    "avance_07_index_equiv_prix": {
      "id": "avance_07_index_equiv_prix",
      "titre": "Grille Tarifaire Dynamique avec INDEX+EQUIV",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        26,
        15
      ],
      "competenceNames": [
        "INDEX+EQUIV",
        "Recherche bidirectionnelle",
        "Références absolues"
      ],
      "checkpointsCount": 4,
      "hasVisualCheckpoints": false,
      "filename": "avance_07_index_equiv_prix.json"
    },
    "avance_08_decaler_moyenne_mobile": {
      "id": "avance_08_decaler_moyenne_mobile",
      "titre": "Moyennes Mobiles avec DECALER",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        28
      ],
      "competenceNames": [
        "DECALER",
        "Moyennes mobiles",
        "Plages dynamiques",
        "Analyse temporelle"
      ],
      "checkpointsCount": 5,
      "hasVisualCheckpoints": false,
      "filename": "avance_08_decaler_moyenne_mobile.json"
    },
    "avance_09_sommeprod_multicriteres": {
      "id": "avance_09_sommeprod_multicriteres",
      "titre": "Analyse Multicritères avec SOMMEPROD",
      "niveau": "avance",
      "metier": "commercial",
      "competenceIds": [
        23
      ],
      "competenceNames": [
        "SOMMEPROD",
        "Calculs matriciels",
        "Conditions multiples",
        "Alternative aux formules ENS"
      ],
      "checkpointsCount": 4,
      "hasVisualCheckpoints": false,
      "filename": "avance_09_sommeprod_multicriteres.json"
    },
    "avance_23_index_equiv_commandes": {
      "id": "avance_23_index_equiv_commandes",
      "titre": "Recherche Avancée avec INDEX+EQUIV",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        24
      ],
      "competenceNames": [
        "INDEX+EQUIV"
      ],
      "checkpointsCount": 9,
      "hasVisualCheckpoints": false,
      "filename": "avance_23_index_equiv_commandes.json"
    },
    "avance_24_tarification_dynamique": {
      "id": "avance_24_tarification_dynamique",
      "titre": "Tarification Dynamique avec INDEX+EQUIV Bidirectionnel",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        24
      ],
      "competenceNames": [
        "INDEX+EQUIV_avance"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": false,
      "filename": "avance_24_tarification_dynamique.json"
    },
    "avance_25_tableaux_structures": {
      "id": "avance_25_tableaux_structures",
      "titre": "Gestion de Données avec Tableaux Structurés",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        27
      ],
      "competenceNames": [
        "tableaux_structures"
      ],
      "checkpointsCount": 9,
      "hasVisualCheckpoints": false,
      "filename": "avance_25_tableaux_structures.json"
    },
    "avance_26_dashboard_graphiques": {
      "id": "avance_26_dashboard_graphiques",
      "titre": "Dashboard Exécutif avec Graphiques Combinés",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        31,
        40
      ],
      "competenceNames": [
        "graphiques_combines",
        "visualisation"
      ],
      "checkpointsCount": 8,
      "hasVisualCheckpoints": true,
      "filename": "avance_26_dashboard_graphiques.json"
    },
    "avance_27_moyennes_mobiles": {
      "id": "avance_27_moyennes_mobiles",
      "titre": "Moyennes Mobiles avec DECALER",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        29
      ],
      "competenceNames": [
        "DECALER"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": true,
      "filename": "avance_27_moyennes_mobiles.json"
    },
    "avance_29_formules_dynamiques": {
      "id": "avance_29_formules_dynamiques",
      "titre": "Analyses Dynamiques avec Formules Matricielles",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        29,
        39
      ],
      "competenceNames": [
        "formules_matricielles",
        "FILTRE",
        "UNIQUE",
        "SORT"
      ],
      "checkpointsCount": 7,
      "hasVisualCheckpoints": false,
      "filename": "avance_29_formules_dynamiques.json"
    },
    "avance_30_dashboard_executif": {
      "id": "avance_30_dashboard_executif",
      "titre": "Dashboard Exécutif Complet Multi-Compétences",
      "niveau": "avance",
      "metier": "general",
      "competenceIds": [
        24,
        23
      ],
      "competenceNames": [
        "INDEX+EQUIV",
        "tableaux_structures",
        "graphiques",
        "formules_matricielles",
        "TCD"
      ],
      "checkpointsCount": 10,
      "hasVisualCheckpoints": true,
      "filename": "avance_30_dashboard_executif.json"
    }
  },
  "aliases": {
    "SOMME": 3,
    "SUM": 3,
    "Somme": 3,
    "somme": 3,
    "MOYENNE": 4,
    "AVERAGE": 4,
    "Moyenne": 4,
    "moyenne": 4,
    "MIN": 5,
    "MAX": 5,
    "MIN_MAX": 5,
    "Min/Max": 5,
    "min": 5,
    "max": 5,
    "COPIER_COLLER": 6,
    "Copier-coller": 6,
    "copier_coller": 6,
    "TRI": 7,
    "TRI_SIMPLE": 7,
    "Tri simple": 7,
    "tri": 7,
    "Tri": 7,
    "FILTRES": 8,
    "FILTRES_BASIQUES": 8,
    "Filtres basiques": 8,
    "filtres": 8,
    "Filtres": 8,
    "SI": 9,
    "IF": 9,
    "Si": 9,
    "si": 9,
    "SI simple": 9,
    "MFC": 10,
    "MFC_SIMPLE": 10,
    "MFC simple": 10,
    "Mise en forme conditionnelle": 10,
    "mise_en_forme_conditionnelle": 10,
    "Format conditionnel": 10,
    "NB.SI": 11,
    "NB_SI": 11,
    "NBSI": 11,
    "COUNTIF": 11,
    "Comptage conditionnel": 11,
    "NB.SI.ENS": 12,
    "NB_SI_ENS": 12,
    "NBSIENS": 12,
    "COUNTIFS": 12,
    "Comptage multi-critères": 12,
    "SOMME.SI": 13,
    "SOMME_SI": 13,
    "SOMMESI": 13,
    "SUMIF": 13,
    "SOMME.SI.ENS": 14,
    "SOMME_SI_ENS": 14,
    "SOMMESIENS": 14,
    "SUMIFS": 14,
    "Somme multi-critères": 14,
    "REFERENCES_ABSOLUES": 15,
    "Références absolues": 15,
    "references_absolues": 15,
    "Références absolues ($)": 15,
    "$": 15,
    "SI_IMBRIQUES": 16,
    "SI imbriqués": 16,
    "Si imbriqués": 16,
    "SI_imbriques": 16,
    "SI imbriquées": 16,
    "Logique conditionnelle": 16,
    "FONCTIONS_TEXTE": 17,
    "Fonctions texte": 17,
    "texte": 17,
    "TEXTE": 17,
    "GAUCHE": 17,
    "DROITE": 17,
    "STXT": 17,
    "NBCAR": 17,
    "CHERCHE": 17,
    "RECHERCHEV": 18,
    "VLOOKUP": 18,
    "RechercheV": 18,
    "recherchev": 18,
    "CONCATENER": 19,
    "CONCAT": 19,
    "Concatener": 19,
    "concatener": 19,
    "FONCTIONS_DATE": 20,
    "Fonctions date": 20,
    "formules_date": 20,
    "DATE": 20,
    "DATES": 20,
    "JOUR": 20,
    "MOIS": 20,
    "ANNEE": 20,
    "DATEDIF": 20,
    "FIN.MOIS": 20,
    "NB.JOURS.OUVRES": 20,
    "JOURSEM": 20,
    "GRAPHIQUES_BASIQUES": 21,
    "Graphiques basiques": 21,
    "graphiques": 21,
    "Graphiques": 21,
    "Graphiques simples": 21,
    "Histogrammes": 21,
    "Secteurs": 21,
    "Courbes": 21,
    "SIERREUR": 22,
    "IFERROR": 22,
    "SI.ERREUR": 22,
    "SiErreur": 22,
    "Gestion des erreurs": 22,
    "Formules robustes": 22,
    "TCD": 23,
    "TCD_BASIQUE": 23,
    "TCD basique": 23,
    "Tableau croisé dynamique": 23,
    "Tableaux croisés dynamiques": 23,
    "tableaux_croises_dynamiques": 23,
    "INDEX_EQUIV": 24,
    "INDEX/EQUIV": 24,
    "INDEX EQUIV": 24,
    "INDEX+EQUIV": 24,
    "INDEX": 24,
    "EQUIV": 24,
    "MATCH": 24,
    "Recherche bidirectionnelle": 24,
    "VALIDATION_DONNEES": 25,
    "Validation de données": 25,
    "validation_donnees": 25,
    "Validation données": 25,
    "Validation": 25,
    "Listes déroulantes": 25,
    "Contrôle de saisie": 25,
    "TCD_AVANCE": 26,
    "TCD avancé": 26,
    "TABLEAUX_STRUCTURES": 27,
    "Tableaux structurés": 27,
    "tableaux_structures": 27,
    "Tableau structuré": 27,
    "Ctrl+T": 27,
    "Références structurées": 56,
    "SOMMEPROD": 28,
    "SUMPRODUCT": 28,
    "Sommeprod": 28,
    "Calculs matriciels": 28,
    "FORMULES_MATRICIELLES": 29,
    "Formules matricielles": 29,
    "formules_matricielles": 29,
    "INDIRECT": 30,
    "GRAPHIQUES_AVANCES": 31,
    "Graphiques avancés": 31,
    "graphiques_combines": 31,
    "Graphiques dynamiques": 31,
    "MFC_AVANCEE": 32,
    "MFC avancée": 32,
    "mise_forme_conditionnelle_avancee": 32,
    "Formules MFC": 32,
    "Jeux d'icônes": 32,
    "Barres de données": 32,
    "Nuances couleurs": 32,
    "RECHERCHEX": 38,
    "XLOOKUP": 38,
    "RechercheX": 38,
    "Alternative RECHERCHEV": 38,
    "FORMULES_DYNAMIQUES": 39,
    "Formules dynamiques": 39,
    "FILTER": 39,
    "SORT": 39,
    "UNIQUE": 39,
    "Excel 365": 39,
    "Tableaux dynamiques": 39,
    "REFERENCES_MIXTES": 51,
    "Références mixtes": 51,
    "SERIES_AUTOMATIQUES": 52,
    "Séries automatiques": 52,
    "Génération de séries": 52,
    "Recopie incrémentée": 52,
    "RECHERCHEV_APPROCHEE": 53,
    "RECHERCHEV approchée": 53,
    "Barèmes": 53,
    "RECHERCHEH": 54,
    "HLOOKUP": 54,
    "RechercheH": 54,
    "Recherche horizontale": 54,
    "COLLAGE_SPECIAL": 58,
    "Collage spécial": 58,
    "Transposition": 58,
    "Valeurs": 58,
    "SAISIE_DONNEES": 1,
    "Saisie de données": 1,
    "Navigation clavier": 1,
    "Sélection": 1,
    "FORMATAGE_CELLULES": 2,
    "Formatage cellules": 2,
    "formatage": 2,
    "Formatage": 2,
    "Couleurs": 2,
    "Bordures": 2,
    "Alignement": 2,
    "Format nombre": 2,
    "POWER_QUERY": 35,
    "Power Query": 35,
    "ETL": 35,
    "Nettoyage données": 35,
    "DECALER": 30,
    "Plages dynamiques": 30,
    "Moyennes mobiles": 30
  },
  "meta": {
    "generatedAt": "2026-01-23T10:44:23.055Z",
    "templateCount": 76,
    "competenceCount": 48,
    "coverageStats": {
      "full": 35,
      "partial": 7,
      "none": 6
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtient les templates pour une compétence donnée
 * @param {number} competenceId - ID de la compétence
 * @returns {string[]} Liste des IDs de templates
 */
export function getTemplatesForCompetence(competenceId) {
  return COMPETENCE_INDEX.byCompetence[competenceId]?.templates || [];
}

/**
 * Résout un nom ou alias de compétence en ID
 * @param {string} nameOrAlias - Nom ou alias de compétence
 * @returns {number|null} ID de la compétence ou null
 */
export function resolveCompetenceId(nameOrAlias) {
  // Essayer directement
  if (COMPETENCE_INDEX.aliases[nameOrAlias]) {
    return COMPETENCE_INDEX.aliases[nameOrAlias];
  }
  
  // Essayer en majuscules
  const upper = nameOrAlias.toUpperCase();
  if (COMPETENCE_INDEX.aliases[upper]) {
    return COMPETENCE_INDEX.aliases[upper];
  }
  
  // Essayer avec normalisation
  const normalized = nameOrAlias.toUpperCase().replace(/[.\s-]/g, '_');
  for (const [alias, id] of Object.entries(COMPETENCE_INDEX.aliases)) {
    if (alias.toUpperCase().replace(/[.\s-]/g, '_') === normalized) {
      return id;
    }
  }
  
  return null;
}

/**
 * Obtient les infos d'une compétence
 * @param {number} competenceId - ID de la compétence
 * @returns {Object|null} Infos de la compétence
 */
export function getCompetenceInfo(competenceId) {
  return COMPETENCE_INDEX.byCompetence[competenceId] || null;
}

/**
 * Obtient les infos d'un template
 * @param {string} templateId - ID du template
 * @returns {Object|null} Infos du template
 */
export function getTemplateInfo(templateId) {
  return COMPETENCE_INDEX.byTemplate[templateId] || null;
}

/**
 * Vérifie si une compétence nécessite un screenshot
 * @param {number} competenceId - ID de la compétence
 * @returns {boolean}
 */
export function competenceNeedsScreenshot(competenceId) {
  return COMPETENCE_INDEX.byCompetence[competenceId]?.needsScreenshot || false;
}

/**
 * Obtient la couverture d'une compétence
 * @param {number} competenceId - ID de la compétence
 * @returns {'full'|'partial'|'none'}
 */
export function getCompetenceCoverage(competenceId) {
  return COMPETENCE_INDEX.byCompetence[competenceId]?.coverage || 'none';
}

/**
 * Obtient toutes les compétences sans templates
 * @returns {number[]} Liste des IDs
 */
export function getOrphanCompetences() {
  return Object.entries(COMPETENCE_INDEX.byCompetence)
    .filter(([_, data]) => data.coverage === 'none')
    .map(([id]) => parseInt(id));
}

/**
 * Obtient les stats de couverture
 * @returns {Object} { full, partial, none }
 */
export function getCoverageStats() {
  return COMPETENCE_INDEX.meta.coverageStats;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════════════════

export default COMPETENCE_INDEX;
