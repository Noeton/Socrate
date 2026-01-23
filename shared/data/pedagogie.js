/**
 * DONNÉES PÉDAGOGIQUES SOCRATE - v5.0
 * 
 * 58 compétences Excel classées par niveau
 * Chaque compétence a inDevelopment: true si pas encore implémentée
 */

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

export const AVAILABILITY = {
  AVAILABLE: 'available',
  IN_DEVELOPMENT: 'in_development',
  EXCEL_REQUIRED: 'excel_required'  // Legacy, now all exercises require Excel
};

// ═══════════════════════════════════════════════════════════════
// MAPPING ID → CLÉ pour référence croisée
// ═══════════════════════════════════════════════════════════════

export const ID_TO_KEY = {
  1: 'SAISIE', 2: 'FORMATAGE', 3: 'SOMME', 4: 'MOYENNE', 5: 'MIN_MAX',
  6: 'COPIER_COLLER', 7: 'TRI', 8: 'FILTRES', 9: 'SI', 10: 'MFC',
  11: 'NB_SI', 12: 'NB_SI_ENS', 13: 'SOMME_SI', 14: 'SOMME_SI_ENS',
  15: 'REFERENCES_ABSOLUES', 16: 'SI_IMBRIQUES', 17: 'TCD', 18: 'RECHERCHEV',
  19: 'CONCATENER', 20: 'TEXTE_EXTRACTION', 21: 'DATES', 22: 'VALIDATION',
  23: 'SOMMEPROD', 24: 'MFC_AVANCEE', 25: 'GRAPHIQUES', 26: 'INDEX_EQUIV',
  27: 'TABLEAUX_STRUCTURES', 28: 'DECALER', 29: 'MATRICIELLES', 30: 'POWER_QUERY',
  31: 'POWER_QUERY_ETL', 32: 'GRAPHIQUES_COMBINES', 33: 'GRAPHIQUES_DYNAMIQUES',
  34: 'VBA_DEBUTANT', 35: 'POWER_PIVOT', 36: 'DAX_BASIQUE', 37: 'RELATIONS_TABLES',
  38: 'XLOOKUP', 39: 'FILTER_SORT_UNIQUE', 40: 'LET', 41: 'LAMBDA',
  42: 'VBA_AVANCE', 43: 'VBA_USERFORMS', 44: 'VBA_API', 45: 'POWER_QUERY_M',
  46: 'DAX_AVANCE', 47: 'OPTIMISATION', 48: 'POWER_BI', 49: 'PYTHON_R',
  50: 'ARCHITECTURE', 51: 'REFERENCES_MIXTES', 52: 'SERIES', 53: 'RECHERCHEV_APPROCHEE',
  54: 'RECHERCHEH', 55: 'FONCTIONS_BD', 56: 'REF_STRUCTUREES', 57: 'FILTRES_AVANCES',
  58: 'COLLAGE_SPECIAL'
};

export const KEY_TO_ID = Object.fromEntries(
  Object.entries(ID_TO_KEY).map(([id, key]) => [key, parseInt(id)])
);

// ═══════════════════════════════════════════════════════════════
// DONNÉES PÉDAGOGIQUES - 58 COMPÉTENCES
// ═══════════════════════════════════════════════════════════════

export const PEDAGOGIE = {
  
  // ─────────────────────────────────────────────────────────────
  // NIVEAU DÉBUTANT (1-10)
  // ─────────────────────────────────────────────────────────────
  
  "SAISIE": {
    id: 1, nom: "Saisie de données", categorie: "Bases", niveau: "debutant",
    description: "Entrer du texte et des nombres dans les cellules Excel.",
    syntaxe: { formule: "Cliquer → Taper → Entrée", arguments: [] },
    exemples: [
      { formule: "Texte: Paris", description: "Tape directement" },
      { formule: "Nombre: 1234,56", description: "Virgule décimale" }
    ],
    erreursFrequentes: ["Point au lieu de virgule", "Oublier Entrée"],
    astuces: ["Tab = cellule suivante", "F2 = modifier"],
    raccourci: "F2"
  },

  "FORMATAGE": {
    id: 2, nom: "Formatage cellules", categorie: "Bases", niveau: "debutant",
    description: "Mettre en forme nombres, dates, couleurs, polices.",
    syntaxe: { formule: "Ctrl+1 ou clic droit → Format", arguments: [] },
    exemples: [
      { formule: "# ##0,00 €", description: "Format monétaire" },
      { formule: "JJ/MM/AAAA", description: "Format date" }
    ],
    astuces: ["Ctrl+1 = Format de cellule", "Le formatage ne change pas la valeur"]
  },

  "SOMME": {
    id: 3, nom: "SOMME", categorie: "Mathématiques", niveau: "debutant",
    description: "Additionne toutes les valeurs d'une plage de cellules.",
    syntaxe: {
      formule: "=SOMME(nombre1; [nombre2]; ...)",
      arguments: [
        { nom: "nombre1", obligatoire: true, description: "Premier nombre ou plage" },
        { nom: "nombre2", obligatoire: false, description: "Plages supplémentaires" }
      ]
    },
    exemples: [
      { formule: "=SOMME(A1:A10)", description: "Additionne A1 à A10" },
      { formule: "=SOMME(A1;B1;C1)", description: "Additionne 3 cellules" }
    ],
    erreursFrequentes: ["Oublier le =", "Virgule au lieu de ;"],
    astuces: ["Alt+= insère SOMME auto", "Ignore texte et vides"],
    raccourci: "Alt+="
  },

  "MOYENNE": {
    id: 4, nom: "MOYENNE", categorie: "Statistiques", niveau: "debutant",
    description: "Calcule la moyenne arithmétique d'une série de nombres.",
    syntaxe: {
      formule: "=MOYENNE(nombre1; [nombre2]; ...)",
      arguments: [
        { nom: "nombre1", obligatoire: true, description: "Premier nombre ou plage" }
      ]
    },
    exemples: [
      { formule: "=MOYENNE(B2:B10)", description: "Moyenne des notes" }
    ],
    erreursFrequentes: ["Les 0 sont comptés (pas les vides)"],
    astuces: ["MEDIANE = valeur centrale"]
  },

  "MIN_MAX": {
    id: 5, nom: "MIN / MAX", categorie: "Statistiques", niveau: "debutant",
    description: "MIN = plus petite valeur, MAX = plus grande.",
    syntaxe: { formule: "=MIN(plage) / =MAX(plage)", arguments: [] },
    exemples: [
      { formule: "=MAX(A:A)-MIN(A:A)", description: "Amplitude" }
    ],
    astuces: ["PETITE.VALEUR(plage;2) = 2ème plus petite"]
  },

  "COPIER_COLLER": {
    id: 6, nom: "Copier-Coller", categorie: "Bases", niveau: "debutant",
    description: "Dupliquer des cellules et recopier des formules.",
    syntaxe: { formule: "Ctrl+C → Ctrl+V", arguments: [] },
    exemples: [
      { formule: "Ctrl+D", description: "Recopie vers le bas" }
    ],
    erreursFrequentes: ["Références qui changent (utiliser $)"],
    astuces: ["Double-clic poignée = recopie auto"],
    raccourci: "Ctrl+C/V/D"
  },

  "TRI": {
    id: 7, nom: "Tri de données", categorie: "Manipulation", niveau: "debutant",
    description: "Organiser les données par ordre croissant ou décroissant.",
    syntaxe: { formule: "Données → Trier", arguments: [] },
    exemples: [
      { formule: "A→Z / Z→A", description: "Tri alphabétique" }
    ],
    astuces: ["TOUJOURS sélectionner toutes les colonnes liées"]
  },

  "FILTRES": {
    id: 8, nom: "Filtres", categorie: "Manipulation", niveau: "debutant",
    description: "Afficher uniquement certaines lignes selon des critères.",
    syntaxe: { formule: "Ctrl+Maj+L ou Données → Filtrer", arguments: [] },
    astuces: ["Ctrl+Maj+L = activer/désactiver filtres"],
    raccourci: "Ctrl+Maj+L"
  },

  "SI": {
    id: 9, nom: "SI", categorie: "Logique", niveau: "debutant",
    description: "Teste une condition et renvoie une valeur selon le résultat.",
    syntaxe: {
      formule: "=SI(test; valeur_si_vrai; valeur_si_faux)",
      arguments: [
        { nom: "test", obligatoire: true, description: "Condition (ex: A1>10)" },
        { nom: "valeur_si_vrai", obligatoire: true, description: "Si condition vraie" },
        { nom: "valeur_si_faux", obligatoire: true, description: "Si condition fausse" }
      ]
    },
    exemples: [
      { formule: '=SI(A1>=10;"Admis";"Refusé")', description: "Note >= 10 → Admis" }
    ],
    erreursFrequentes: ["Oublier guillemets autour du texte"],
    astuces: ["Opérateurs: =, <>, >, <, >=, <="]
  },

  "MFC": {
    id: 10, nom: "Mise en forme conditionnelle", categorie: "Formatage", niveau: "debutant",
    description: "Change automatiquement le format selon le contenu.",
    syntaxe: { formule: "Accueil → Mise en forme conditionnelle", arguments: [] },
    exemples: [
      { formule: "> 100 → Fond vert", description: "Surligner valeurs" }
    ],
    astuces: ["Gérer les règles pour voir l'ordre de priorité"]
  },

  // ─────────────────────────────────────────────────────────────
  // NIVEAU INTERMÉDIAIRE (11-25)
  // ─────────────────────────────────────────────────────────────

  "NB_SI": {
    id: 11, nom: "NB.SI", categorie: "Statistiques", niveau: "intermediaire",
    description: "Compte les cellules qui répondent à un critère.",
    syntaxe: {
      formule: "=NB.SI(plage; critère)",
      arguments: [
        { nom: "plage", obligatoire: true, description: "Plage à analyser" },
        { nom: "critère", obligatoire: true, description: "Critère de comptage" }
      ]
    },
    exemples: [
      { formule: '=NB.SI(A:A;"Paris")', description: "Compte les Paris" },
      { formule: '=NB.SI(B:B;">100")', description: "Compte les >100" }
    ],
    erreursFrequentes: ["Oublier guillemets: \">100\" pas >100"],
    astuces: ["* = plusieurs caractères, ? = un seul"]
  },

  "NB_SI_ENS": {
    id: 12, nom: "NB.SI.ENS", categorie: "Statistiques", niveau: "intermediaire",
    description: "Compte avec PLUSIEURS critères (ET logique).",
    syntaxe: {
      formule: "=NB.SI.ENS(plage1; critère1; plage2; critère2; ...)",
      arguments: [
        { nom: "plage1", obligatoire: true, description: "1ère plage" },
        { nom: "critère1", obligatoire: true, description: "1er critère" }
      ]
    },
    exemples: [
      { formule: '=NB.SI.ENS(A:A;"Paris";B:B;"Senior")', description: "Seniors à Paris" }
    ],
    erreursFrequentes: ["Ordre: plage, critère, plage, critère..."],
    astuces: ["Jusqu'à 127 paires plage/critère"]
  },

  "SOMME_SI": {
    id: 13, nom: "SOMME.SI", categorie: "Mathématiques", niveau: "intermediaire",
    description: "Additionne les cellules qui répondent à un critère.",
    syntaxe: {
      formule: "=SOMME.SI(plage_critère; critère; [plage_somme])",
      arguments: [
        { nom: "plage_critère", obligatoire: true, description: "Où chercher" },
        { nom: "critère", obligatoire: true, description: "Critère" },
        { nom: "plage_somme", obligatoire: false, description: "Plage à additionner" }
      ]
    },
    exemples: [
      { formule: '=SOMME.SI(A:A;"Paris";B:B)', description: "Ventes Paris" }
    ],
    erreursFrequentes: ["Inverser plage_critère et plage_somme"]
  },

  "SOMME_SI_ENS": {
    id: 14, nom: "SOMME.SI.ENS", categorie: "Mathématiques", niveau: "intermediaire",
    description: "Additionne selon PLUSIEURS critères. ATTENTION à l'ordre !",
    syntaxe: {
      formule: "=SOMME.SI.ENS(plage_somme; plage1; critère1; ...)",
      arguments: [
        { nom: "plage_somme", obligatoire: true, description: "EN PREMIER !" }
      ]
    },
    exemples: [
      { formule: '=SOMME.SI.ENS(C:C;A:A;"Paris";B:B;"T1")', description: "Ventes Paris T1" }
    ],
    erreursFrequentes: ["plage_somme EN PREMIER (≠ SOMME.SI !)"],
    astuces: ["⚠️ Piège classique en entretien !"]
  },

  "REFERENCES_ABSOLUES": {
    id: 15, nom: "Références absolues ($)", categorie: "Bases", niveau: "intermediaire",
    description: "Figer une référence pour qu'elle ne change pas en recopiant.",
    syntaxe: { formule: "$A$1 = figé, A1 = relatif", arguments: [] },
    exemples: [
      { formule: "=A1*$B$1", description: "$B$1 reste fixe" }
    ],
    erreursFrequentes: ["Oublier $ dans RECHERCHEV"],
    astuces: ["F4 ajoute/retire les $"],
    raccourci: "F4"
  },

  "SI_IMBRIQUES": {
    id: 16, nom: "SI imbriqués", categorie: "Logique", niveau: "intermediaire",
    description: "Enchaîner plusieurs conditions SI.",
    syntaxe: { formule: "=SI(test1; résultat1; SI(test2; ...))", arguments: [] },
    exemples: [
      { formule: '=SI(A1>=16;"TB";SI(A1>=14;"B";"R"))', description: "Mentions" }
    ],
    erreursFrequentes: ["Parenthèses manquantes", "Mauvais ordre des tests"],
    astuces: ["Max 7 niveaux recommandés"]
  },

  "TCD": {
    id: 17, nom: "Tableau Croisé Dynamique", categorie: "Analyse", niveau: "intermediaire",
    description: "Résume et analyse de grandes quantités de données.",
    syntaxe: { formule: "Insertion → Tableau croisé dynamique", arguments: [] },
    exemples: [
      { formule: "Lignes: Produit, Valeurs: Somme(Ventes)", description: "Total par produit" }
    ],
    astuces: ["Double-clic sur valeur = voir le détail"]
  },

  "RECHERCHEV": {
    id: 18, nom: "RECHERCHEV", categorie: "Recherche", niveau: "intermediaire",
    description: "Cherche dans la 1ère colonne et renvoie une valeur.",
    syntaxe: {
      formule: "=RECHERCHEV(cherché; table; no_col; FAUX)",
      arguments: [
        { nom: "cherché", obligatoire: true, description: "Valeur à trouver" },
        { nom: "table", obligatoire: true, description: "Tableau (clé en col 1)" },
        { nom: "no_col", obligatoire: true, description: "N° colonne résultat" },
        { nom: "FAUX", obligatoire: true, description: "Correspondance exacte" }
      ]
    },
    exemples: [
      { formule: '=RECHERCHEV(A2;$B$2:$D$100;3;FAUX)', description: "Prix produit" }
    ],
    erreursFrequentes: ["Oublier FAUX", "Clé pas en 1ère colonne", "Oublier $"],
    astuces: ["FAUX = exact, VRAI = approximatif"]
  },

  "CONCATENER": {
    id: 19, nom: "CONCATENER / &", categorie: "Texte", niveau: "intermediaire",
    description: "Assemble plusieurs textes en un seul.",
    syntaxe: { formule: '=A1&" "&B1', arguments: [] },
    exemples: [
      { formule: '=A1&" "&B1', description: "Prénom + Nom" }
    ],
    erreursFrequentes: ["Oublier les espaces", "Utiliser + au lieu de &"],
    astuces: ["& plus rapide que CONCATENER"]
  },

  "TEXTE_EXTRACTION": {
    id: 20, nom: "Fonctions texte", categorie: "Texte", niveau: "intermediaire",
    description: "GAUCHE, DROITE, STXT pour extraire du texte.",
    syntaxe: { formule: "=GAUCHE(texte;n) / =DROITE(texte;n)", arguments: [] },
    exemples: [
      { formule: '=GAUCHE(A1;3)', description: "3 premiers caractères" }
    ],
    erreursFrequentes: ["Position commence à 1 (pas 0)"],
    astuces: ["NBCAR = longueur totale"]
  },

  "DATES": {
    id: 21, nom: "Fonctions date", categorie: "Dates", niveau: "intermediaire",
    description: "AUJOURDHUI, ANNEE, MOIS, JOUR, DATEDIF.",
    syntaxe: { formule: "=AUJOURDHUI() / =DATEDIF(début;fin;\"Y\")", arguments: [] },
    exemples: [
      { formule: '=DATEDIF(A1;AUJOURDHUI();"Y")', description: "Âge en années" }
    ],
    astuces: ["Les dates sont des nombres depuis 1/1/1900"]
  },

  "VALIDATION": {
    id: 22, nom: "Validation de données", categorie: "Manipulation", niveau: "intermediaire",
    description: "Restreindre ce qui peut être saisi dans une cellule.",
    syntaxe: { formule: "Données → Validation des données", arguments: [] },
    exemples: [
      { formule: "Liste déroulante", description: "Choix parmi options" }
    ],
    astuces: ["Créer des listes déroulantes pour éviter erreurs"]
  },

  "SOMMEPROD": {
    id: 23, nom: "SOMMEPROD", categorie: "Mathématiques", niveau: "intermediaire",
    description: "Multiplie les plages puis additionne.",
    syntaxe: { formule: "=SOMMEPROD(plage1; plage2)", arguments: [] },
    exemples: [
      { formule: '=SOMMEPROD(A2:A10;B2:B10)', description: "Qté × Prix" }
    ],
    erreursFrequentes: ["Plages de tailles différentes"],
    astuces: ["Peut remplacer SOMME.SI.ENS"]
  },

  "MFC_AVANCEE": {
    id: 24, nom: "MFC avec formules", categorie: "Formatage", niveau: "intermediaire",
    description: "Mise en forme conditionnelle avec formules personnalisées.",
    syntaxe: { formule: "Nouvelle règle → Utiliser une formule", arguments: [] },
    exemples: [
      { formule: "=$A1>$B1", description: "Compare 2 colonnes" }
    ],
    astuces: ["La formule doit retourner VRAI/FAUX"]
  },

  "GRAPHIQUES": {
    id: 25, nom: "Graphiques", categorie: "Visualisation", niveau: "intermediaire",
    description: "Visualiser les données sous forme de graphiques.",
    syntaxe: { formule: "Sélectionner → Insertion → Graphique", arguments: [] },
    exemples: [
      { formule: "Histogramme", description: "Comparer valeurs" },
      { formule: "Courbe", description: "Évolution temps" }
    ],
    astuces: ["Alt+F1 = graphique rapide"],
    raccourci: "Alt+F1"
  },

  // ─────────────────────────────────────────────────────────────
  // NIVEAU AVANCÉ (26-37)
  // ─────────────────────────────────────────────────────────────

  "INDEX_EQUIV": {
    id: 26, nom: "INDEX + EQUIV", categorie: "Recherche", niveau: "avance",
    description: "EQUIV trouve la position, INDEX renvoie la valeur.",
    syntaxe: { formule: "=INDEX(résultat; EQUIV(cherché; recherche; 0))", arguments: [] },
    exemples: [
      { formule: '=INDEX(C:C;EQUIV(A2;B:B;0))', description: "Plus flexible que RECHERCHEV" }
    ],
    erreursFrequentes: ["Plages de tailles différentes", "Oublier le 0"],
    astuces: ["Peut chercher vers la gauche !"]
  },

  "TABLEAUX_STRUCTURES": {
    id: 27, nom: "Tableaux structurés", categorie: "Bases", niveau: "avance",
    description: "Convertir des plages en tableaux Excel (Ctrl+T).",
    syntaxe: { formule: "Sélectionner → Ctrl+T", arguments: [] },
    exemples: [
      { formule: "=SOMME(Tableau1[Ventes])", description: "Référence structurée" }
    ],
    astuces: ["Les formules s'étendent auto"],
    raccourci: "Ctrl+T"
  },

  "DECALER": {
    id: 28, nom: "DECALER", categorie: "Recherche", niveau: "avance",
    description: "Renvoie une référence décalée.",
    syntaxe: { formule: "=DECALER(réf; lignes; colonnes; [hauteur]; [largeur])", arguments: [] },
    exemples: [
      { formule: '=DECALER(A1;2;3)', description: "2 bas, 3 droite" }
    ],
    erreursFrequentes: ["Fonction volatile (recalcule tout)"],
    astuces: ["Parfait pour plages dynamiques"]
  },

  "MATRICIELLES": {
    id: 29, nom: "Formules matricielles", categorie: "Avancé", niveau: "avance",
    description: "Formules sur des plages entières.",
    syntaxe: { formule: "Ctrl+Maj+Entrée (anciennes versions)", arguments: [] },
    exemples: [
      { formule: '=SOMME((A:A="Paris")*(B:B))', description: "Somme conditionnelle" }
    ],
    astuces: ["Excel 365 gère auto les matrices"]
  },

  "POWER_QUERY": {
    id: 30, nom: "Power Query", categorie: "ETL", niveau: "avance",
    description: "Importer et transformer des données.",
    syntaxe: { formule: "Données → Obtenir des données", arguments: [] },
    astuces: ["Les étapes sont reproductibles"]
  },

  "POWER_QUERY_ETL": {
    id: 31, nom: "Power Query ETL", categorie: "ETL", niveau: "avance",
    description: "Transformations complexes : pivots, jointures.",
    syntaxe: { formule: "Langage M dans l'éditeur avancé", arguments: [] }
  },

  "GRAPHIQUES_COMBINES": {
    id: 32, nom: "Graphiques combinés", categorie: "Visualisation", niveau: "avance",
    description: "Combiner plusieurs types de graphiques.",
    syntaxe: { formule: "Graphique → Modifier type → Combiné", arguments: [] }
  },

  "GRAPHIQUES_DYNAMIQUES": {
    id: 33, nom: "Graphiques croisés dynamiques", categorie: "Visualisation", niveau: "avance",
    description: "Graphiques liés à des TCD.",
    syntaxe: { formule: "Insertion → Graphique croisé dynamique", arguments: [] }
  },

  "VBA_DEBUTANT": {
    id: 34, nom: "VBA Introduction", categorie: "Programmation", niveau: "avance",
    inDevelopment: true,
    description: "Automatiser Excel avec des macros VBA."
  },

  "POWER_PIVOT": {
    id: 35, nom: "Power Pivot", categorie: "BI", niveau: "avance",
    description: "Modèles de données et relations entre tables."
  },

  "DAX_BASIQUE": {
    id: 36, nom: "DAX bases", categorie: "BI", niveau: "avance",
    inDevelopment: true,
    description: "Formules DAX pour Power Pivot."
  },

  "RELATIONS_TABLES": {
    id: 37, nom: "Relations de tables", categorie: "BI", niveau: "avance",
    inDevelopment: true,
    description: "Créer des relations entre tables."
  },

  "XLOOKUP": {
    id: 38, nom: "RECHERCHEX", categorie: "Recherche", niveau: "avance",
    description: "RECHERCHEV moderne (Excel 365).",
    syntaxe: {
      formule: "=RECHERCHEX(cherché; plage_recherche; plage_résultat; [si_absent])",
      arguments: []
    },
    exemples: [
      { formule: '=RECHERCHEX(A2;Noms;Prix;"Non trouvé")', description: "Avec message erreur" }
    ],
    astuces: ["Peut chercher vers la gauche !", "Excel 365+ requis"]
  },

  "FILTER_SORT_UNIQUE": {
    id: 39, nom: "FILTER/SORT/UNIQUE", categorie: "Recherche", niveau: "avance",
    description: "Fonctions dynamiques Excel 365.",
    syntaxe: { formule: "=FILTER(tableau; condition)", arguments: [] },
    astuces: ["Excel 365+ requis", "Résultats débordants"]
  },

  // ─────────────────────────────────────────────────────────────
  // NIVEAU EXPERT (40-50)
  // ─────────────────────────────────────────────────────────────

  "LET": {
    id: 40, nom: "LET", categorie: "Avancé", niveau: "expert",
    inDevelopment: true,
    description: "Définir des variables dans une formule."
  },

  "LAMBDA": {
    id: 41, nom: "LAMBDA", categorie: "Avancé", niveau: "expert",
    inDevelopment: true,
    description: "Créer des fonctions personnalisées."
  },

  "VBA_AVANCE": {
    id: 42, nom: "VBA avancé", categorie: "Programmation", niveau: "expert",
    inDevelopment: true,
    description: "Programmation VBA avancée."
  },

  "VBA_USERFORMS": {
    id: 43, nom: "UserForms VBA", categorie: "Programmation", niveau: "expert",
    inDevelopment: true,
    description: "Créer des interfaces utilisateur en VBA."
  },

  "VBA_API": {
    id: 44, nom: "API REST VBA", categorie: "Programmation", niveau: "expert",
    inDevelopment: true,
    description: "Appeler des API externes depuis VBA."
  },

  "POWER_QUERY_M": {
    id: 45, nom: "Power Query M", categorie: "ETL", niveau: "expert",
    inDevelopment: true,
    description: "Langage M avancé pour Power Query."
  },

  "DAX_AVANCE": {
    id: 46, nom: "DAX avancé", categorie: "BI", niveau: "expert",
    inDevelopment: true,
    description: "Formules DAX complexes."
  },

  "OPTIMISATION": {
    id: 47, nom: "Optimisation performance", categorie: "Avancé", niveau: "expert",
    inDevelopment: true,
    description: "Optimiser les classeurs Excel lents."
  },

  "POWER_BI": {
    id: 48, nom: "Power BI Desktop", categorie: "BI", niveau: "expert",
    inDevelopment: true,
    description: "Créer des rapports Power BI."
  },

  "PYTHON_R": {
    id: 49, nom: "Python/R dans Excel", categorie: "Programmation", niveau: "expert",
    inDevelopment: true,
    description: "Utiliser Python ou R dans Excel."
  },

  "ARCHITECTURE": {
    id: 50, nom: "Architecture solutions", categorie: "Avancé", niveau: "expert",
    inDevelopment: true,
    description: "Concevoir des solutions Excel complexes."
  },

  // ─────────────────────────────────────────────────────────────
  // COMPÉTENCES COMPLÉMENTAIRES (51-58)
  // ─────────────────────────────────────────────────────────────

  "REFERENCES_MIXTES": {
    id: 51, nom: "Références mixtes", categorie: "Bases", niveau: "intermediaire",
    description: "Figer seulement la ligne OU la colonne.",
    syntaxe: { formule: "$A1 = colonne fixe, A$1 = ligne fixe", arguments: [] },
    exemples: [
      { formule: "=$A2*B$1", description: "Table de multiplication" }
    ],
    raccourci: "F4 (plusieurs fois)"
  },

  "SERIES": {
    id: 52, nom: "Séries automatiques", categorie: "Bases", niveau: "debutant",
    description: "Générer des suites de nombres, dates, textes.",
    syntaxe: { formule: "Entrer 2 valeurs → Tirer la poignée", arguments: [] },
    exemples: [
      { formule: "1, 2 → tire → 3, 4, 5...", description: "Suite nombres" }
    ]
  },

  "RECHERCHEV_APPROCHEE": {
    id: 53, nom: "RECHERCHEV approchée", categorie: "Recherche", niveau: "intermediaire",
    description: "RECHERCHEV pour les tranches (barèmes, remises).",
    syntaxe: { formule: "=RECHERCHEV(valeur; table_TRIÉE; no_col; VRAI)", arguments: [] },
    erreursFrequentes: ["Table NON triée (obligatoire !)"],
    astuces: ["Parfait pour impôts, remises, notes"]
  },

  "RECHERCHEH": {
    id: 54, nom: "RECHERCHEH", categorie: "Recherche", niveau: "intermediaire",
    description: "Comme RECHERCHEV mais horizontalement.",
    syntaxe: { formule: "=RECHERCHEH(valeur; table; no_ligne; FAUX)", arguments: [] },
    astuces: ["Pour tableaux avec mois en colonnes"]
  },

  "FONCTIONS_BD": {
    id: 55, nom: "Fonctions BD", categorie: "Avancé", niveau: "avance",
    description: "BDSOMME, BDNB, BDMOYENNE pour bases de données.",
    syntaxe: { formule: "=BDSOMME(base; champ; critères)", arguments: [] }
  },

  "REF_STRUCTUREES": {
    id: 56, nom: "Références structurées", categorie: "Bases", niveau: "avance",
    description: "Références dans les tableaux structurés.",
    syntaxe: { formule: "=Tableau1[@Colonne]", arguments: [] }
  },

  "FILTRES_AVANCES": {
    id: 57, nom: "Filtres avancés", categorie: "Manipulation", niveau: "avance",
    description: "Filtres avec critères complexes.",
    syntaxe: { formule: "Données → Avancé", arguments: [] }
  },

  "COLLAGE_SPECIAL": {
    id: 58, nom: "Collage spécial", categorie: "Bases", niveau: "debutant",
    description: "Coller uniquement valeurs, formats, ou formules.",
    syntaxe: { formule: "Ctrl+Alt+V", arguments: [] },
    exemples: [
      { formule: "Coller valeurs", description: "Supprime formules" },
      { formule: "Coller transposé", description: "Lignes ↔ Colonnes" }
    ],
    raccourci: "Ctrl+Alt+V"
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function getPedagogie(key) {
  const normalized = key?.toUpperCase()?.replace(/\./g, '_');
  return PEDAGOGIE[key] || PEDAGOGIE[normalized] || null;
}

export function getPedagogieById(id) {
  const key = ID_TO_KEY[id];
  return key ? PEDAGOGIE[key] : null;
}

export function getCompetencesByNiveau(niveau) {
  return Object.entries(PEDAGOGIE)
    .filter(([_, v]) => v.niveau === niveau && !v.inDevelopment)
    .map(([k, v]) => ({ key: k, ...v }));
}

export function getCategories() {
  const cats = new Set();
  Object.values(PEDAGOGIE)
    .filter(p => !p.inDevelopment)
    .forEach(p => cats.add(p.categorie));
  return Array.from(cats);
}

export function estFonctionnel(key) {
  const p = getPedagogie(key);
  return p && !p.inDevelopment;
}

// Compter les compétences
export function getStats() {
  const all = Object.values(PEDAGOGIE);
  const disponibles = all.filter(p => !p.inDevelopment);
  const enDev = all.filter(p => p.inDevelopment);
  
  return {
    total: all.length,
    disponibles: disponibles.length,
    enDeveloppement: enDev.length,
    parNiveau: {
      debutant: all.filter(p => p.niveau === 'debutant' && !p.inDevelopment).length,
      intermediaire: all.filter(p => p.niveau === 'intermediaire' && !p.inDevelopment).length,
      avance: all.filter(p => p.niveau === 'avance' && !p.inDevelopment).length,
      expert: all.filter(p => p.niveau === 'expert' && !p.inDevelopment).length
    }
  };
}

export default PEDAGOGIE;
