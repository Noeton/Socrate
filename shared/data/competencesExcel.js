/**
 * RÉFÉRENTIEL DES 58 COMPÉTENCES EXCEL - v2.0
 * 
 * Structure enrichie :
 * - id : identifiant unique
 * - niveau : 1-58
 * - nom : nom de la compétence
 * - categorie : formule, analyse, automatisation, basique, visualisation
 * - prerequis : compétences nécessaires avant
 * - sous_competences : découpage granulaire (optionnel)
 * - concepts_cles : points essentiels à retenir
 * - erreurs_frequentes : erreurs typiques des apprenants
 * - exercices_drill : exercices de renforcement
 */

export const COMPETENCES_EXCEL = [
  // ═══════════════════════════════════════════════════════════════
  // NIVEAU DÉBUTANT (1-10)
  // ═══════════════════════════════════════════════════════════════
  { 
    id: 1, 
    niveau: 1, 
    nom: "Saisie de données", 
    categorie: "basique", 
    prerequis: [],
    concepts_cles: [
      "Entrée = valider la saisie",
      "Tab = passer à la cellule suivante",
      "Les types de données : texte, nombre, date"
    ],
    erreurs_frequentes: [
      "Oublier de valider avec Entrée",
      "Confondre virgule et point pour les décimales",
      "Saisir une date comme du texte (01/01/2024 vs '01/01/2024)"
    ],
    exercices_drill: ["saisie_base", "types_donnees"]
  },
  { 
    id: 2, 
    niveau: 2, 
    nom: "Formatage cellules", 
    categorie: "basique", 
    prerequis: [1],
    concepts_cles: [
      "Format ≠ valeur (la cellule garde sa vraie valeur)",
      "Ctrl+1 = menu Format de cellule",
      "Formats personnalisés : # ##0,00 €"
    ],
    erreurs_frequentes: [
      "Croire que formater change la valeur",
      "Confondre format monétaire et comptabilité",
      "Texte aligné à gauche, nombres à droite par défaut"
    ],
    exercices_drill: ["formatage_nombres", "formatage_dates"]
  },
  { 
    id: 3, 
    niveau: 3, 
    nom: "SOMME", 
    categorie: "formule", 
    prerequis: [1],
    concepts_cles: [
      "=SOMME(plage) additionne toutes les cellules",
      "Ignorer les cellules vides et texte",
      "Alt+= raccourci pour SOMME automatique"
    ],
    erreurs_frequentes: [
      "Oublier le = au début",
      "Sélectionner la mauvaise plage",
      "Inclure la cellule de total dans la plage (référence circulaire)"
    ],
    exercices_drill: ["budget_mensuel", "total_ventes"]
  },
  { 
    id: 4, 
    niveau: 4, 
    nom: "MOYENNE", 
    categorie: "formule", 
    prerequis: [3],
    concepts_cles: [
      "MOYENNE ignore les cellules vides",
      "Attention aux 0 qui comptent dans la moyenne",
      "MOYENNE.SI pour moyenne conditionnelle"
    ],
    erreurs_frequentes: [
      "Confondre cellule vide et 0",
      "Inclure des cellules texte dans la plage",
      "Oublier que MOYENNE arrondit l'affichage mais pas la valeur"
    ],
    exercices_drill: ["notes_etudiants", "moyenne_ventes"]
  },
  { 
    id: 5, 
    niveau: 5, 
    nom: "MIN/MAX", 
    categorie: "formule", 
    prerequis: [3],
    concepts_cles: [
      "MIN/MAX ignorent texte et cellules vides",
      "PETITE.VALEUR/GRANDE.VALEUR pour le Nième",
      "Combinable avec SI pour conditions"
    ],
    erreurs_frequentes: [
      "Confondre MIN et PETITE.VALEUR",
      "Oublier que les dates sont des nombres"
    ],
    exercices_drill: ["temperatures", "extremes_ventes"]
  },
  { 
    id: 6, 
    niveau: 6, 
    nom: "Copier-coller", 
    categorie: "basique", 
    prerequis: [2],
    concepts_cles: [
      "Ctrl+C / Ctrl+V classique",
      "Collage spécial (Ctrl+Alt+V) : valeurs, formats, formules",
      "La poignée de recopie adapte les références"
    ],
    erreurs_frequentes: [
      "Coller des formules au lieu de valeurs",
      "Ne pas comprendre pourquoi les références changent",
      "Oublier le collage spécial 'Valeurs'"
    ],
    exercices_drill: ["recopie_formules", "collage_special"]
  },
  { 
    id: 7, 
    niveau: 7, 
    nom: "Tri simple", 
    categorie: "analyse", 
    prerequis: [1],
    concepts_cles: [
      "Toujours sélectionner TOUTES les colonnes liées",
      "Tri croissant A→Z / décroissant Z→A",
      "Attention aux lignes d'en-tête"
    ],
    erreurs_frequentes: [
      "Trier une seule colonne = données décalées",
      "Oublier de cocher 'Mes données ont des en-têtes'",
      "Trier des nombres stockés comme texte (1, 10, 2...)"
    ],
    exercices_drill: ["tri_ventes", "tri_dates"]
  },
  { 
    id: 8, 
    niveau: 8, 
    nom: "Filtres basiques", 
    categorie: "analyse", 
    prerequis: [7],
    concepts_cles: [
      "Ctrl+Maj+L = activer/désactiver filtres",
      "Les filtres masquent, ils ne suppriment pas",
      "Filtres texte : contient, commence par..."
    ],
    erreurs_frequentes: [
      "Oublier qu'un filtre est actif (icône entonnoir)",
      "Copier des données filtrées inclut les lignes masquées",
      "Confondre filtre et tri"
    ],
    exercices_drill: ["filtre_produits", "filtre_dates"]
  },
  { 
    id: 9, 
    niveau: 9, 
    nom: "SI simple", 
    categorie: "formule", 
    prerequis: [3],
    concepts_cles: [
      "=SI(condition; si_vrai; si_faux)",
      "Les textes entre guillemets",
      "Opérateurs : =, <>, <, >, <=, >="
    ],
    erreurs_frequentes: [
      "Oublier les guillemets autour du texte",
      "Confondre = (égal) et == (n'existe pas en Excel)",
      "Parenthèse fermante manquante"
    ],
    exercices_drill: ["alerte_stock", "mention_bac"]
  },
  { 
    id: 10, 
    niveau: 10, 
    nom: "Mise en forme conditionnelle simple", 
    categorie: "visualisation", 
    prerequis: [2],
    concepts_cles: [
      "Règles prédéfinies : supérieur à, entre...",
      "Barres de données pour visualiser",
      "Icônes pour catégoriser"
    ],
    erreurs_frequentes: [
      "Appliquer sur la mauvaise plage",
      "Trop de règles = illisible",
      "Oublier de gérer l'ordre des règles"
    ],
    exercices_drill: ["heatmap_simple", "alertes_visuelles"]
  },

  // ═══════════════════════════════════════════════════════════════
  // NIVEAU INTERMÉDIAIRE (11-25)
  // ═══════════════════════════════════════════════════════════════
  { 
    id: 11, 
    niveau: 11, 
    nom: "NB.SI", 
    categorie: "formule", 
    prerequis: [9],
    concepts_cles: [
      "=NB.SI(plage; critère) compte les cellules",
      "Critère texte entre guillemets",
      "Wildcards : * (tout) et ? (1 caractère)"
    ],
    erreurs_frequentes: [
      "Oublier les guillemets du critère texte",
      "Confondre NB.SI et NB.SI.ENS",
      "Critère sensible à la casse ? Non par défaut"
    ],
    exercices_drill: ["comptage_ventes", "comptage_categories"]
  },
  { 
    id: 12, 
    niveau: 12, 
    nom: "NB.SI.ENS", 
    categorie: "formule", 
    prerequis: [11],
    concepts_cles: [
      "Plusieurs critères = ET logique",
      "Toutes les plages doivent avoir la même taille",
      "=NB.SI.ENS(plage1;critère1;plage2;critère2)"
    ],
    erreurs_frequentes: [
      "Plages de tailles différentes",
      "Oublier qu'il n'y a pas de OU natif (utiliser +)",
      "Inverser plage et critère"
    ],
    exercices_drill: ["analyse_multicriteres", "segmentation"]
  },
  { 
    id: 13, 
    niveau: 13, 
    nom: "SOMME.SI", 
    categorie: "formule", 
    prerequis: [3, 9],
    concepts_cles: [
      "=SOMME.SI(plage_critère; critère; plage_somme)",
      "3ème argument optionnel si même plage",
      "Critères avec opérateurs : \">100\", \"<>0\""
    ],
    erreurs_frequentes: [
      "Inverser plage_critère et plage_somme",
      "Oublier les guillemets autour des opérateurs",
      "Plages de tailles différentes"
    ],
    exercices_drill: ["ca_par_region", "somme_conditionnelle"]
  },
  { 
    id: 14, 
    niveau: 14, 
    nom: "SOMME.SI.ENS", 
    categorie: "formule", 
    prerequis: [13],
    concepts_cles: [
      "=SOMME.SI.ENS(plage_somme; plage1;critère1; plage2;critère2)",
      "Attention : plage_somme EN PREMIER",
      "Jusqu'à 127 paires critères"
    ],
    erreurs_frequentes: [
      "Oublier que plage_somme est en premier (inverse de SOMME.SI)",
      "Plages désalignées",
      "Confondre avec SOMMEPROD"
    ],
    exercices_drill: ["ca_segmente", "analyse_croisee"]
  },
  { 
    id: 15, 
    niveau: 15, 
    nom: "Références absolues ($)", 
    categorie: "formule", 
    prerequis: [6],
    sous_competences: [
      { id: "15a", nom: "Référence absolue complète ($A$1)", difficulte: 1 },
      { id: "15b", nom: "Référence mixte ligne (A$1)", difficulte: 2 },
      { id: "15c", nom: "Référence mixte colonne ($A1)", difficulte: 2 }
    ],
    concepts_cles: [
      "$ fige la coordonnée qui le suit",
      "F4 fait basculer entre les 4 modes",
      "Penser à la recopie AVANT d'écrire la formule"
    ],
    erreurs_frequentes: [
      "Oubli de figer avant recopie → #REF! ou mauvais résultats",
      "$ mal placé (avant lettre vs avant chiffre)",
      "Tout figer quand mixte suffirait"
    ],
    exercices_drill: ["table_multiplication", "grille_tarifaire", "calcul_tva_multi"]
  },
  { 
    id: 16, 
    niveau: 16, 
    nom: "SI imbriqués", 
    categorie: "formule", 
    prerequis: [9],
    concepts_cles: [
      "Max 7 niveaux d'imbrication (64 depuis Excel 2007)",
      "Lire de gauche à droite comme un arbre de décision",
      "Alternative : SI.CONDITIONS (Excel 2019+)"
    ],
    erreurs_frequentes: [
      "Perdre le fil des parenthèses",
      "Mauvais ordre des conditions (tester du plus restrictif au moins)",
      "Oublier le cas 'sinon' final"
    ],
    exercices_drill: ["mentions_bac", "tranches_impots", "categories_age"]
  },
  { 
    id: 17, 
    niveau: 17, 
    nom: "Tableaux croisés dynamiques", 
    categorie: "analyse", 
    prerequis: [7, 8, 13],
    sous_competences: [
      { id: "17a", nom: "Création TCD basique", difficulte: 1 },
      { id: "17b", nom: "Champs lignes/colonnes/valeurs", difficulte: 1 },
      { id: "17c", nom: "Filtres et segments", difficulte: 2 },
      { id: "17d", nom: "Calculs et pourcentages", difficulte: 2 },
      { id: "17e", nom: "Groupement dates", difficulte: 2 }
    ],
    concepts_cles: [
      "Source = tableau propre sans lignes vides",
      "Actualiser après modification des données source",
      "Glisser-déposer pour réorganiser"
    ],
    erreurs_frequentes: [
      "Données source avec lignes/colonnes vides",
      "Oublier d'actualiser le TCD",
      "Confondre Somme et Nombre dans les valeurs"
    ],
    exercices_drill: ["analyse_tcd", "dashboard_ventes", "tcd_dates"]
  },
  { 
    id: 18, 
    niveau: 18, 
    nom: "RECHERCHEV", 
    categorie: "formule", 
    prerequis: [9, 15],
    sous_competences: [
      { id: "18a", nom: "RECHERCHEV exacte (FAUX)", difficulte: 1 },
      { id: "18b", nom: "RECHERCHEV approchée/encadrement (VRAI)", difficulte: 2 }
    ],
    concepts_cles: [
      "=RECHERCHEV(cherché; table; n°colonne; [correspondance])",
      "FAUX = correspondance exacte, VRAI = approchée",
      "La valeur cherchée doit être dans la 1ère colonne"
    ],
    erreurs_frequentes: [
      "Table non figée avec $ → #REF! à la recopie",
      "VRAI sur table non triée = résultats faux sans erreur !",
      "N° colonne trop grand → #REF!",
      "Valeur non trouvée → #N/A"
    ],
    exercices_drill: ["commandes_recherchev", "bareme_commissions", "catalogue_produits"]
  },
  { 
    id: 19, 
    niveau: 19, 
    nom: "CONCATENER", 
    categorie: "formule", 
    prerequis: [1],
    concepts_cles: [
      "=CONCAT() ou & pour assembler",
      "Ajouter des espaces : A1&\" \"&B1",
      "JOINDRE.TEXTE avec délimiteur"
    ],
    erreurs_frequentes: [
      "Oublier les espaces entre les éléments",
      "Concaténer un nombre perd le format",
      "Utiliser CONCATENER au lieu de CONCAT (obsolète)"
    ],
    exercices_drill: ["generation_emails", "noms_complets"]
  },
  { 
    id: 20, 
    niveau: 20, 
    nom: "Formules texte (GAUCHE, DROITE)", 
    categorie: "formule", 
    prerequis: [19],
    concepts_cles: [
      "GAUCHE/DROITE : extraire N caractères",
      "STXT : extraire du milieu",
      "NBCAR : compter les caractères"
    ],
    erreurs_frequentes: [
      "Oublier que les espaces comptent",
      "STXT : confusion position/longueur",
      "Extraire d'un nombre = d'abord TEXTE()"
    ],
    exercices_drill: ["extraction_codes", "parsing_donnees"]
  },
  { 
    id: 21, 
    niveau: 21, 
    nom: "Formules date (AUJOURDHUI, MOIS)", 
    categorie: "formule", 
    prerequis: [1],
    concepts_cles: [
      "Les dates sont des nombres (1 = 01/01/1900)",
      "AUJOURDHUI() se recalcule chaque jour",
      "DATEDIF pour écarts entre dates"
    ],
    erreurs_frequentes: [
      "Soustraire des dates-texte au lieu de vraies dates",
      "Oublier que AUJOURDHUI change chaque jour",
      "Confondre MOIS (extrait) et MOIS.DECALER (ajoute)"
    ],
    exercices_drill: ["anciennete_employes", "planning_mensuel", "echeances"]
  },
  { 
    id: 22, 
    niveau: 22, 
    nom: "Validation données", 
    categorie: "basique", 
    prerequis: [2],
    concepts_cles: [
      "Liste déroulante = saisie contrôlée",
      "Message d'erreur personnalisable",
      "Validation personnalisée avec formule"
    ],
    erreurs_frequentes: [
      "Plage source de la liste non figée",
      "Oublier d'autoriser les cellules vides si nécessaire",
      "Validation trop restrictive = frustration utilisateur"
    ],
    exercices_drill: ["formulaire_conges", "saisie_securisee"]
  },
  { 
    id: 23, 
    niveau: 23, 
    nom: "SOMMEPROD", 
    categorie: "formule", 
    prerequis: [14, 18],
    concepts_cles: [
      "Multiplie puis additionne des plages",
      "Astuce : (condition)*valeurs pour filtrer",
      "Alternative aux formules matricielles"
    ],
    erreurs_frequentes: [
      "Plages de tailles différentes",
      "Oublier les parenthèses autour des conditions",
      "Confondre avec SOMME.SI.ENS"
    ],
    exercices_drill: ["ca_pondere", "analyse_avancee"]
  },
  { 
    id: 24, 
    niveau: 24, 
    nom: "Mise en forme conditionnelle avancée", 
    categorie: "visualisation", 
    prerequis: [10, 16],
    concepts_cles: [
      "Formules personnalisées dans les règles",
      "Référence relative pour appliquer à chaque ligne",
      "Combiner plusieurs règles"
    ],
    erreurs_frequentes: [
      "Oublier de fixer la colonne, pas la ligne ($A1)",
      "Règle qui s'applique à toute la plage au lieu de ligne par ligne",
      "Ordre des règles (première vraie = appliquée)"
    ],
    exercices_drill: ["heatmap_ventes", "lignes_alternees", "alertes_formules"]
  },
  { 
    id: 25, 
    niveau: 25, 
    nom: "Graphiques simples", 
    categorie: "visualisation", 
    prerequis: [17],
    concepts_cles: [
      "Sélectionner les bonnes données avant insertion",
      "Histogramme vs Barres (vertical vs horizontal)",
      "Courbe pour évolution, Secteurs pour répartition"
    ],
    erreurs_frequentes: [
      "Inclure les totaux dans les données → graphique faussé",
      "Camembert avec trop de catégories",
      "Axes non libellés"
    ],
    exercices_drill: ["graphique_ca", "repartition_categories", "evolution_mensuelle"]
  },

  // ═══════════════════════════════════════════════════════════════
  // NIVEAU AVANCÉ (26-35)
  // ═══════════════════════════════════════════════════════════════
  { 
    id: 26, 
    niveau: 26, 
    nom: "INDEX + EQUIV", 
    categorie: "formule", 
    prerequis: [18],
    concepts_cles: [
      "INDEX retourne une valeur à une position",
      "EQUIV retourne la position d'une valeur",
      "Combinaison = RECHERCHEV sans limites"
    ],
    erreurs_frequentes: [
      "Confondre l'ordre des arguments INDEX",
      "EQUIV renvoie une position, pas une valeur",
      "Oublier le 0 (exact) dans EQUIV"
    ],
    exercices_drill: ["index_equiv_commandes", "recherche_bidirectionnelle"]
  },
  { 
    id: 27, 
    niveau: 27, 
    nom: "Tableaux structurés", 
    categorie: "analyse", 
    prerequis: [17],
    concepts_cles: [
      "Ctrl+T = convertir en tableau",
      "Références structurées : [@Colonne]",
      "S'étend automatiquement"
    ],
    erreurs_frequentes: [
      "Mélanger références classiques et structurées",
      "Oublier que le tableau s'étend auto → formules incluses",
      "Nommer le tableau clairement"
    ],
    exercices_drill: ["tableaux_structures", "references_structurees"]
  },
  { 
    id: 28, 
    niveau: 28, 
    nom: "DECALER", 
    categorie: "formule", 
    prerequis: [15],
    concepts_cles: [
      "=DECALER(ref; lignes; colonnes; [hauteur]; [largeur])",
      "Crée une plage dynamique",
      "Utile pour graphiques dynamiques"
    ],
    erreurs_frequentes: [
      "Confondre le sens (+/- lignes/colonnes)",
      "Oublier que DECALER est volatile (recalcul constant)",
      "Plage résultante hors feuille"
    ],
    exercices_drill: ["plages_dynamiques", "moyennes_mobiles"]
  },
  { 
    id: 29, 
    niveau: 29, 
    nom: "Formules matricielles", 
    categorie: "formule", 
    prerequis: [26],
    concepts_cles: [
      "Ctrl+Maj+Entrée (legacy) ou déversement auto",
      "Opérations sur des plages entières",
      "Excel 365 : déversement automatique"
    ],
    erreurs_frequentes: [
      "Oublier Ctrl+Maj+Entrée (anciennes versions)",
      "Modifier une partie d'une formule matricielle",
      "Plage de sortie trop petite"
    ],
    exercices_drill: ["formules_dynamiques", "calculs_matriciels"]
  },
  { 
    id: 30, 
    niveau: 30, 
    nom: "Power Query", 
    categorie: "automatisation", 
    prerequis: [27],
    concepts_cles: [
      "Données > Obtenir des données",
      "Transformations sans modifier la source",
      "Actualisation automatique"
    ],
    erreurs_frequentes: [
      "Modifier les données au lieu de la requête",
      "Oublier de charger dans une feuille",
      "Source déplacée = requête cassée"
    ],
    exercices_drill: ["import_power_query", "nettoyage_donnees"]
  },
  { 
    id: 31, 
    niveau: 31, 
    nom: "ETL Power Query", 
    categorie: "automatisation", 
    prerequis: [30],
    concepts_cles: [
      "Extract, Transform, Load",
      "Fusionner plusieurs sources",
      "Colonnes conditionnelles"
    ],
    erreurs_frequentes: [
      "Jointures sur mauvaises colonnes",
      "Types de données non définis",
      "Ordre des étapes incorrect"
    ],
    exercices_drill: ["fusion_sources", "etl_complet"]
  },
  { 
    id: 32, 
    niveau: 32, 
    nom: "Graphiques combinés", 
    categorie: "visualisation", 
    prerequis: [25],
    concepts_cles: [
      "Axe secondaire pour échelles différentes",
      "Combiner barres et courbes",
      "Modifier le type par série"
    ],
    erreurs_frequentes: [
      "Échelles incompatibles sans axe secondaire",
      "Trop de séries = illisible",
      "Légende mal positionnée"
    ],
    exercices_drill: ["dashboard_graphiques", "combo_chart"]
  },
  { 
    id: 33, 
    niveau: 33, 
    nom: "Graphiques dynamiques", 
    categorie: "visualisation", 
    prerequis: [32],
    concepts_cles: [
      "Source = plage dynamique ou tableau",
      "Lier à des cellules de contrôle",
      "Segments et chronologies"
    ],
    erreurs_frequentes: [
      "Source fixe au lieu de dynamique",
      "Graphique ne s'actualise pas",
      "Segments mal connectés"
    ],
    exercices_drill: ["graphique_dynamique", "dashboard_interactif"]
  },
  { 
    id: 34, 
    niveau: 34, 
    nom: "VBA débutant", 
    categorie: "automatisation", 
    prerequis: [],
    concepts_cles: [
      "Alt+F11 = éditeur VBA",
      "Sub = procédure, Function = fonction",
      "Enregistreur de macros pour commencer"
    ],
    erreurs_frequentes: [
      "Macro enregistrée avec références absolues",
      "Oublier de sauvegarder en .xlsm",
      "Code non optimisé (Select/Activate)"
    ],
    exercices_drill: ["premiere_macro", "automatisation_simple"]
  },
  { 
    id: 35, 
    niveau: 35, 
    nom: "Power Pivot", 
    categorie: "analyse", 
    prerequis: [30],
    concepts_cles: [
      "Modèle de données relationnel",
      "Gérer des millions de lignes",
      "Colonnes calculées vs mesures"
    ],
    erreurs_frequentes: [
      "Confondre colonne calculée et mesure",
      "Relations incorrectes entre tables",
      "Charger trop de colonnes inutiles"
    ],
    exercices_drill: ["modele_donnees", "power_pivot_base"]
  },

  // ═══════════════════════════════════════════════════════════════
  // NIVEAU EXPERT (36-45)
  // ═══════════════════════════════════════════════════════════════
  { 
    id: 36, 
    niveau: 36, 
    nom: "DAX basique", 
    categorie: "formule", 
    prerequis: [35],
    concepts_cles: [
      "Langage de Power Pivot / Power BI",
      "CALCULATE modifie le contexte",
      "Mesures vs colonnes calculées"
    ],
    erreurs_frequentes: [
      "Utiliser DAX comme Excel (syntaxe différente)",
      "Confondre contexte de ligne et de filtre",
      "Mesures dans colonnes calculées"
    ],
    exercices_drill: ["mesures_dax", "calculate_base"]
  },
  { 
    id: 37, 
    niveau: 37, 
    nom: "Relations de tables", 
    categorie: "analyse", 
    prerequis: [35],
    concepts_cles: [
      "1-N : une clé primaire, plusieurs clés étrangères",
      "Direction du filtre croisé",
      "Tables de dimension vs fait"
    ],
    erreurs_frequentes: [
      "Relations N-N sans table pont",
      "Direction de filtre incorrecte",
      "Clés avec doublons"
    ],
    exercices_drill: ["schema_relationnel", "modele_etoile"]
  },
  { 
    id: 38, 
    niveau: 38, 
    nom: "XLOOKUP", 
    categorie: "formule", 
    prerequis: [26],
    concepts_cles: [
      "Remplace RECHERCHEV + RECHERCHEH + INDEX/EQUIV",
      "Recherche dans n'importe quelle direction",
      "Gestion native des erreurs"
    ],
    erreurs_frequentes: [
      "Disponible uniquement Excel 365 / 2021+",
      "Oublier le paramètre [si_non_trouvé]",
      "Confondre les modes de correspondance"
    ],
    exercices_drill: ["xlookup_avance", "migration_recherchev"]
  },
  { 
    id: 39, 
    niveau: 39, 
    nom: "FILTER/SORT/UNIQUE", 
    categorie: "formule", 
    prerequis: [27],
    concepts_cles: [
      "Formules à déversement (spill)",
      "FILTER : extraire selon critères",
      "UNIQUE : supprimer doublons dynamiquement"
    ],
    erreurs_frequentes: [
      "Cellules adjacentes non vides bloquent le déversement",
      "Confondre FILTER et filtre manuel",
      "Oublier que ce sont des formules (pas des valeurs)"
    ],
    exercices_drill: ["filtres_dynamiques", "listes_uniques"]
  },
  { 
    id: 40, 
    niveau: 40, 
    nom: "LET", 
    categorie: "formule", 
    prerequis: [29],
    concepts_cles: [
      "Définir des variables dans une formule",
      "Évite les calculs répétés",
      "Améliore la lisibilité"
    ],
    erreurs_frequentes: [
      "Syntaxe : =LET(nom1;valeur1;nom2;valeur2;calcul)",
      "Variables non utilisées",
      "Formule trop complexe même avec LET"
    ],
    exercices_drill: ["formules_let", "optimisation_formules"]
  },
  { 
    id: 41, 
    niveau: 41, 
    nom: "LAMBDA", 
    categorie: "formule", 
    prerequis: [40],
    concepts_cles: [
      "Créer ses propres fonctions",
      "Stocker dans le Gestionnaire de noms",
      "Fonctions récursives possibles"
    ],
    erreurs_frequentes: [
      "Oublier de nommer la LAMBDA",
      "Récursion infinie",
      "Trop de paramètres = illisible"
    ],
    exercices_drill: ["fonctions_custom", "lambda_recursif"]
  },
  { 
    id: 42, 
    niveau: 42, 
    nom: "VBA avancé", 
    categorie: "automatisation", 
    prerequis: [34],
    concepts_cles: [
      "Objets : Workbook, Worksheet, Range",
      "Boucles et conditions",
      "Gestion des erreurs"
    ],
    erreurs_frequentes: [
      "Ne pas désactiver ScreenUpdating",
      "Variables non déclarées",
      "Pas de gestion d'erreurs"
    ],
    exercices_drill: ["boucles_vba", "gestion_erreurs_vba"]
  },
  { 
    id: 43, 
    niveau: 43, 
    nom: "UserForms VBA", 
    categorie: "automatisation", 
    prerequis: [42],
    concepts_cles: [
      "Interfaces utilisateur personnalisées",
      "Contrôles : TextBox, ComboBox, ListBox",
      "Événements : Click, Change, Initialize"
    ],
    erreurs_frequentes: [
      "Validation insuffisante des saisies",
      "UserForm non déchargé (Unload)",
      "Design peu ergonomique"
    ],
    exercices_drill: ["userform_saisie", "formulaire_recherche"]
  },
  { 
    id: 44, 
    niveau: 44, 
    nom: "API REST VBA", 
    categorie: "automatisation", 
    prerequis: [42],
    concepts_cles: [
      "XMLHTTP pour appels HTTP",
      "Parser JSON en VBA",
      "Authentification API"
    ],
    erreurs_frequentes: [
      "Références manquantes (Microsoft XML)",
      "JSON mal parsé",
      "Timeout non géré"
    ],
    exercices_drill: ["api_meteo", "api_finance"]
  },
  { 
    id: 45, 
    niveau: 45, 
    nom: "Power Query M", 
    categorie: "automatisation", 
    prerequis: [31],
    concepts_cles: [
      "Langage fonctionnel de Power Query",
      "each = fonction anonyme",
      "Types stricts"
    ],
    erreurs_frequentes: [
      "Syntaxe sensible à la casse",
      "Types non définis",
      "Fonctions non reconnues"
    ],
    exercices_drill: ["code_m_custom", "transformations_avancees"]
  },

  // ═══════════════════════════════════════════════════════════════
  // NIVEAU MAÎTRE (46-50)
  // ═══════════════════════════════════════════════════════════════
  { 
    id: 46, 
    niveau: 46, 
    nom: "DAX avancé", 
    categorie: "formule", 
    prerequis: [36],
    concepts_cles: [
      "Time Intelligence : SAMEPERIODLASTYEAR, etc.",
      "CALCULATETABLE pour tables virtuelles",
      "Variables avec VAR/RETURN"
    ],
    erreurs_frequentes: [
      "Table de dates incomplète",
      "Contexte de filtre non maîtrisé",
      "Mesures trop complexes"
    ],
    exercices_drill: ["time_intelligence", "dax_expert"]
  },
  { 
    id: 47, 
    niveau: 47, 
    nom: "Optimisation performance", 
    categorie: "analyse", 
    prerequis: [35, 46],
    concepts_cles: [
      "Réduire les colonnes calculées",
      "Cardinalité des relations",
      "DAX Studio pour analyser"
    ],
    erreurs_frequentes: [
      "Trop de colonnes inutiles",
      "Formules volatiles (INDIRECT, OFFSET)",
      "Modèle non optimisé"
    ],
    exercices_drill: ["optimisation_modele", "diagnostic_perf"]
  },
  { 
    id: 48, 
    niveau: 48, 
    nom: "Power BI Desktop", 
    categorie: "visualisation", 
    prerequis: [35, 46],
    concepts_cles: [
      "Rapports interactifs multi-pages",
      "Visuels personnalisés",
      "Publication et partage"
    ],
    erreurs_frequentes: [
      "Modèle non optimisé avant publication",
      "Trop de visuels par page",
      "Filtres mal configurés"
    ],
    exercices_drill: ["dashboard_powerbi", "rapport_complet"]
  },
  { 
    id: 49, 
    niveau: 49, 
    nom: "Python/R dans Excel", 
    categorie: "automatisation", 
    prerequis: [42],
    concepts_cles: [
      "=PY() pour Python dans Excel",
      "DataFrames pandas",
      "Visualisations avancées"
    ],
    erreurs_frequentes: [
      "Environnement cloud uniquement",
      "Limites de mémoire",
      "Syntaxe Python vs Excel"
    ],
    exercices_drill: ["python_excel", "analyse_pandas"]
  },
  { 
    id: 50, 
    niveau: 50, 
    nom: "Architecture solutions", 
    categorie: "architecture", 
    prerequis: [47, 48],
    concepts_cles: [
      "Conception de solutions complètes",
      "Documentation et maintenance",
      "Sécurité et gouvernance"
    ],
    erreurs_frequentes: [
      "Pas de documentation",
      "Solution non maintenable",
      "Sécurité négligée"
    ],
    exercices_drill: ["projet_complet", "documentation"]
  },

  // ═══════════════════════════════════════════════════════════════
  // NOUVELLES COMPÉTENCES (51-58) - Issues du TD Excel
  // ═══════════════════════════════════════════════════════════════
  { 
    id: 51, 
    niveau: 15, 
    nom: "Références mixtes", 
    categorie: "formule", 
    prerequis: [15],
    concepts_cles: [
      "$A1 = colonne figée, ligne libre",
      "A$1 = ligne figée, colonne libre",
      "Essentiel pour les tables à double entrée"
    ],
    erreurs_frequentes: [
      "Confondre $A1 et A$1",
      "Ne pas anticiper le sens de la recopie",
      "Tout figer par réflexe au lieu de réfléchir"
    ],
    exercices_drill: ["grille_tarifaire", "table_multiplication", "matrice_prix"]
  },
  { 
    id: 52, 
    niveau: 6, 
    nom: "Génération de séries", 
    categorie: "basique", 
    prerequis: [1],
    concepts_cles: [
      "Poignée de recopie détecte les séries",
      "Séries personnalisées dans Options",
      "SEQUENCE() pour séries dynamiques"
    ],
    erreurs_frequentes: [
      "Recopier au lieu d'incrémenter (sélectionner 2 cellules)",
      "Série non reconnue → copie simple",
      "Dates mal formatées = pas de série"
    ],
    exercices_drill: ["planning_mensuel", "series_dates", "numerotation"]
  },
  { 
    id: 53, 
    niveau: 19, 
    nom: "RECHERCHEV approchée", 
    categorie: "formule", 
    prerequis: [18],
    concepts_cles: [
      "4ème argument VRAI ou omis = approchée",
      "Table OBLIGATOIREMENT triée croissant",
      "Trouve la valeur ≤ à la recherchée"
    ],
    erreurs_frequentes: [
      "Table non triée = résultats FAUX sans erreur !",
      "Confondre VRAI (approché) et FAUX (exact)",
      "Valeur < minimum de la table → #N/A"
    ],
    exercices_drill: ["bareme_commissions", "tranches_imposition", "grille_anciennete"]
  },
  { 
    id: 54, 
    niveau: 19, 
    nom: "RECHERCHEH", 
    categorie: "formule", 
    prerequis: [18],
    concepts_cles: [
      "Comme RECHERCHEV mais en horizontal",
      "Cherche dans la 1ère LIGNE",
      "N° de ligne au lieu de colonne"
    ],
    erreurs_frequentes: [
      "Confondre ligne et colonne",
      "Utiliser quand RECHERCHEV suffirait",
      "Même problème de table non figée"
    ],
    exercices_drill: ["planning_horizontal", "grille_horaires"]
  },
  { 
    id: 55, 
    niveau: 28, 
    nom: "Fonctions BD (BDSOMME, BDNB)", 
    categorie: "formule", 
    prerequis: [13, 14],
    concepts_cles: [
      "Base de données + zone de critères",
      "Critères sur plusieurs lignes = OU",
      "Critères sur même ligne = ET"
    ],
    erreurs_frequentes: [
      "Zone critères mal formatée",
      "En-têtes différents de la source",
      "Critères calculés mal formulés"
    ],
    exercices_drill: ["bd_statistiques", "criteres_complexes"]
  },
  { 
    id: 56, 
    niveau: 27, 
    nom: "Références structurées", 
    categorie: "formule", 
    prerequis: [27],
    concepts_cles: [
      "[@Colonne] = cellule de la même ligne",
      "[Colonne] = colonne entière",
      "Tableau[#Totaux] = ligne des totaux"
    ],
    erreurs_frequentes: [
      "Mélanger avec références classiques",
      "Oublier les crochets",
      "Nom de colonne avec espaces"
    ],
    exercices_drill: ["tableaux_structures_avance", "formules_structurees"]
  },
  { 
    id: 57, 
    niveau: 22, 
    nom: "Filtres avancés", 
    categorie: "analyse", 
    prerequis: [8],
    concepts_cles: [
      "Zone de critères séparée",
      "Extraction vers autre emplacement",
      "Critères calculés possibles"
    ],
    erreurs_frequentes: [
      "Zone critères avec mauvais en-têtes",
      "Oublier de cocher 'Copier vers'",
      "Plage de destination trop petite"
    ],
    exercices_drill: ["extraction_avancee", "criteres_calcules"]
  },
  { 
    id: 58, 
    niveau: 7, 
    nom: "Collage spécial valeurs", 
    categorie: "basique", 
    prerequis: [6],
    concepts_cles: [
      "Ctrl+Alt+V puis V = coller valeurs",
      "Supprime les formules, garde les résultats",
      "Transposer = inverser lignes/colonnes"
    ],
    erreurs_frequentes: [
      "Coller formules au lieu de valeurs → #REF!",
      "Oublier que le format n'est pas copié",
      "Collage spécial sur cellules fusionnées"
    ],
    exercices_drill: ["collage_valeurs", "transposition"]
  }
];

/**
 * MAPPING NIVEAU LABEL → SCORE MOYEN
 */
export const NIVEAU_TO_SCORE = {
  "debutant": 5,
  "intermediaire": 18,
  "avance": 30
};

/**
 * MAPPING SCORE → NIVEAU LABEL
 */
export function getScoreToNiveau(score) {
  if (score <= 10) return "debutant";
  if (score <= 25) return "intermediaire";
  return "avance";
}

/**
 * Trouver une compétence par nom (flexible)
 */
export function findCompetence(nom) {
  const nomLower = nom.toLowerCase().trim();
  return COMPETENCES_EXCEL.find(c => 
    c.nom.toLowerCase().includes(nomLower) ||
    nomLower.includes(c.nom.toLowerCase())
  );
}

/**
 * Trouver une compétence par ID
 */
export function findCompetenceById(id) {
  return COMPETENCES_EXCEL.find(c => c.id === id);
}

/**
 * Obtenir toutes les compétences d'un niveau
 */
export function getCompetencesByNiveau(niveauLabel) {
  if (niveauLabel === "debutant") return COMPETENCES_EXCEL.filter(c => c.niveau <= 10);
  if (niveauLabel === "intermediaire") return COMPETENCES_EXCEL.filter(c => c.niveau > 10 && c.niveau <= 25);
  if (niveauLabel === "avance") return COMPETENCES_EXCEL.filter(c => c.niveau > 25);
  return [];
}

/**
 * Obtenir les erreurs fréquentes pour une compétence
 */
export function getErreursFrequentes(competenceId) {
  const comp = findCompetenceById(competenceId);
  return comp?.erreurs_frequentes || [];
}

/**
 * Obtenir les concepts clés pour une compétence
 */
export function getConceptsCles(competenceId) {
  const comp = findCompetenceById(competenceId);
  return comp?.concepts_cles || [];
}

/**
 * Obtenir les sous-compétences (si existantes)
 */
export function getSousCompetences(competenceId) {
  const comp = findCompetenceById(competenceId);
  return comp?.sous_competences || [];
}