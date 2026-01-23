/**
 * MAPPING DES ERREURS FRÉQUENTES EXCEL
 * 
 * Structure :
 * - pattern : regex ou string pour détecter l'erreur
 * - type : catégorie d'erreur
 * - competences : compétences concernées (IDs)
 * - diagnostic : explication de l'erreur
 * - feedback : message pédagogique pour l'utilisateur
 * - correction : suggestion de correction
 * - severite : 'critique' | 'importante' | 'mineure'
 */

export const ERREURS_FORMULES = [
  // ═══════════════════════════════════════════════════════════════
  // ERREURS DE RÉFÉRENCES ($)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "ref_table_non_figee",
    pattern: /RECHERCHEV\([^;]+;[A-Z]+\d+:[A-Z]+\d+;/i,
    type: "reference_non_figee",
    competences: [15, 18, 51],
    diagnostic: "Table de recherche sans $ (références relatives)",
    feedback: "⚠️ Ta table de recherche n'est pas figée ! Quand tu vas recopier la formule, elle va se décaler et pointer vers les mauvaises cellules.",
    correction: "Ajoute des $ devant les lettres ET les chiffres de ta plage : $A$1:$D$10",
    severite: "critique"
  },
  {
    id: "ref_mixte_inversee_ligne",
    pattern: /\$[A-Z]+\d+(?!\$)/,
    type: "reference_mixte_incorrecte",
    competences: [15, 51],
    diagnostic: "$ sur la colonne mais pas sur la ligne (probable inversion)",
    feedback: "🤔 Tu as figé la colonne ($A) mais pas la ligne. Si tu recopies vers le bas, la ligne va changer. C'est bien ce que tu veux ?",
    correction: "Pour figer la ligne : A$1. Pour figer la colonne : $A1. Réfléchis au sens de ta recopie.",
    severite: "importante"
  },
  {
    id: "ref_mixte_inversee_col",
    pattern: /(?<!\$)[A-Z]+\$\d+/,
    type: "reference_mixte_incorrecte", 
    competences: [15, 51],
    diagnostic: "$ sur la ligne mais pas sur la colonne (probable inversion)",
    feedback: "🤔 Tu as figé la ligne ($1) mais pas la colonne. Si tu recopies vers la droite, la colonne va changer. C'est bien ce que tu veux ?",
    correction: "Pour figer la ligne : A$1. Pour figer la colonne : $A1. Réfléchis au sens de ta recopie.",
    severite: "importante"
  },
  {
    id: "tout_fige_inutile",
    pattern: /\$[A-Z]+\$\d+.*\$[A-Z]+\$\d+.*\$[A-Z]+\$\d+/,
    type: "sur_figeage",
    competences: [15, 51],
    diagnostic: "Beaucoup de références absolues, potentiellement inutile",
    feedback: "💡 Tu as figé beaucoup de références. C'est parfois nécessaire, mais souvent les références mixtes ($A1 ou A$1) suffisent et rendent la formule plus flexible.",
    correction: "Analyse : qu'est-ce qui doit vraiment rester fixe quand tu recopies ?",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS RECHERCHEV
  // ═══════════════════════════════════════════════════════════════
  {
    id: "recherchev_sans_faux",
    pattern: /RECHERCHEV\([^)]+;[^)]+;\d+\s*\)/i,
    type: "recherchev_mode_ambigu",
    competences: [18, 53],
    diagnostic: "RECHERCHEV sans 4ème argument (mode approché par défaut)",
    feedback: "⚠️ Tu n'as pas précisé le 4ème argument de RECHERCHEV. Par défaut, c'est une recherche APPROCHÉE (VRAI), ce qui nécessite une table triée !",
    correction: "Ajoute FAUX pour une recherche exacte : =RECHERCHEV(...;FAUX) ou vérifie que ta table est triée si tu veux une recherche approchée.",
    severite: "importante"
  },
  {
    id: "recherchev_col_trop_grande",
    pattern: /RECHERCHEV\([^;]+;[^;]+;(\d+)/i,
    type: "recherchev_index_invalide",
    competences: [18],
    diagnostic: "N° de colonne potentiellement trop grand",
    feedback: "🔍 Vérifie que le numéro de colonne ({col}) ne dépasse pas le nombre de colonnes de ta table.",
    correction: "Compte les colonnes de ta table : si elle va de A à D, tu as 4 colonnes max (1, 2, 3 ou 4).",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS SI
  // ═══════════════════════════════════════════════════════════════
  {
    id: "si_texte_sans_guillemets",
    pattern: /SI\([^;]+;[a-zA-Zéèêàùç]+[^"';)]/i,
    type: "syntaxe_si",
    competences: [9],
    diagnostic: "Texte probable sans guillemets dans SI",
    feedback: "❌ Il semble que tu aies écrit du texte sans guillemets. En Excel, le texte doit être entre guillemets : \"oui\" et pas oui.",
    correction: "=SI(A1>10;\"Bon\";\"Mauvais\")",
    severite: "critique"
  },
  {
    id: "si_parenthese_manquante",
    pattern: /SI\([^)]*SI\([^)]*\)[^)]*$/i,
    type: "syntaxe_parentheses",
    competences: [9, 16],
    diagnostic: "Parenthèse fermante probablement manquante (SI imbriqués)",
    feedback: "❌ Il te manque probablement une parenthèse fermante. Avec les SI imbriqués, chaque SI ouvert doit être fermé.",
    correction: "Compte tes parenthèses : autant de ( que de ). Astuce : Excel colore les paires.",
    severite: "critique"
  },
  {
    id: "si_imbrique_trop_profond",
    pattern: /SI\([^)]*SI\([^)]*SI\([^)]*SI\([^)]*SI\([^)]*SI\([^)]*SI\(/i,
    type: "complexite_excessive",
    competences: [16],
    diagnostic: "Plus de 7 SI imbriqués",
    feedback: "😅 Tu as beaucoup de SI imbriqués ! C'est difficile à lire et maintenir. Considère une alternative.",
    correction: "Utilise SI.CONDITIONS (Excel 2019+), CHOISIR, ou une table de correspondance avec RECHERCHEV.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS SOMME.SI / NB.SI
  // ═══════════════════════════════════════════════════════════════
  {
    id: "sommesi_plages_inversees",
    pattern: /SOMME\.SI\.ENS\([^;]+;\d+:[^;]+;/i,
    type: "ordre_arguments",
    competences: [14],
    diagnostic: "Possible inversion plage_somme et plage_critère dans SOMME.SI.ENS",
    feedback: "⚠️ Dans SOMME.SI.ENS, la plage à additionner est EN PREMIER, contrairement à SOMME.SI !",
    correction: "=SOMME.SI.ENS(plage_somme; plage_critère1; critère1; ...)",
    severite: "critique"
  },
  {
    id: "nbsi_critere_sans_guillemets",
    pattern: /NB\.SI\([^;]+;[<>=]+\d+\)/i,
    type: "syntaxe_critere",
    competences: [11],
    diagnostic: "Critère avec opérateur sans guillemets",
    feedback: "❌ Quand tu utilises un opérateur (<, >, =) dans le critère, il faut des guillemets autour !",
    correction: "=NB.SI(A:A;\">100\") et non =NB.SI(A:A;>100)",
    severite: "critique"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS EXCEL NATIVES (#)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "erreur_ref",
    pattern: /#REF!/,
    type: "erreur_excel",
    competences: [15, 18],
    diagnostic: "Référence invalide - cellule supprimée ou hors limites",
    feedback: "❌ #REF! signifie qu'une cellule référencée a été supprimée ou que ta formule pointe hors de la feuille.",
    correction: "Vérifie : 1) As-tu supprimé des lignes/colonnes ? 2) Ta formule recopiée pointe-t-elle trop loin ?",
    severite: "critique"
  },
  {
    id: "erreur_na",
    pattern: /#N\/A/,
    type: "erreur_excel",
    competences: [18],
    diagnostic: "Valeur non trouvée",
    feedback: "🔍 #N/A signifie que la valeur cherchée n'existe pas dans ta table.",
    correction: "Vérifie : 1) La valeur existe-t-elle vraiment ? 2) Y a-t-il des espaces invisibles ? 3) Les types correspondent-ils (texte vs nombre) ?",
    severite: "importante"
  },
  {
    id: "erreur_div0",
    pattern: /#DIV\/0!/,
    type: "erreur_excel",
    competences: [3],
    diagnostic: "Division par zéro",
    feedback: "❌ #DIV/0! = tu divises par zéro ou par une cellule vide.",
    correction: "Protège avec SI : =SI(B1=0;0;A1/B1) ou =SIERREUR(A1/B1;0)",
    severite: "importante"
  },
  {
    id: "erreur_valeur",
    pattern: /#VALEUR!/,
    type: "erreur_excel",
    competences: [3, 9],
    diagnostic: "Type de données incompatible",
    feedback: "❌ #VALEUR! = tu mélanges des types incompatibles (ex: additionner du texte).",
    correction: "Vérifie que toutes les cellules contiennent le bon type de données. Une cellule qui AFFICHE un nombre peut contenir du texte !",
    severite: "importante"
  },
  {
    id: "erreur_nom",
    pattern: /#NOM\?/,
    type: "erreur_excel",
    competences: [3],
    diagnostic: "Nom de fonction non reconnu",
    feedback: "❌ #NOM? = Excel ne reconnaît pas un nom. Soit la fonction est mal écrite, soit tu as oublié les guillemets autour d'un texte.",
    correction: "Vérifie l'orthographe de ta fonction. SOMME, pas SOME. Et les textes entre \"guillemets\".",
    severite: "critique"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS DE LOGIQUE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "reference_circulaire",
    pattern: null, // Détecté autrement (cellule = dans sa propre formule)
    type: "logique",
    competences: [3],
    diagnostic: "La formule fait référence à elle-même",
    feedback: "🔄 Référence circulaire ! Ta formule inclut la cellule où elle se trouve. C'est comme demander 'combien font A + ce résultat ?'",
    correction: "Vérifie ta plage : si tu es en E10, ta SOMME ne doit pas inclure E10.",
    severite: "critique"
  },
  {
    id: "comparaison_texte_nombre",
    pattern: /[<>=]+\s*"?\d+"?\s*$/,
    type: "logique",
    competences: [9, 11],
    diagnostic: "Comparaison potentielle texte/nombre",
    feedback: "⚠️ Attention à comparer des pommes avec des pommes ! Si ta cellule contient du texte qui ressemble à un nombre, la comparaison peut échouer.",
    correction: "Utilise CNUM() pour convertir du texte en nombre si nécessaire.",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS COPIER-COLLER / RECOPIE (Compétence 6)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "recopie_valeur_pas_formule",
    pattern: null, // Détecté par comparaison : cellule contient valeur mais devrait avoir formule
    type: "recopie",
    competences: [6],
    diagnostic: "Valeur copiée au lieu de la formule",
    feedback: "🔍 Ta cellule contient une valeur, pas une formule. Tu as peut-être copié le RÉSULTAT au lieu de la FORMULE.",
    correction: "Vérifie dans la barre de formule : si tu vois juste un nombre (pas de =), c'est une valeur. Re-crée la formule ou recopie avec la poignée.",
    severite: "importante"
  },
  {
    id: "recopie_formule_non_adaptee",
    pattern: null, // Détecté si plusieurs cellules contiennent la même formule exacte
    type: "recopie",
    competences: [6],
    diagnostic: "Formule identique dans plusieurs cellules (non adaptée)",
    feedback: "⚠️ Plusieurs cellules contiennent exactement la même formule. Normalement, les références devraient s'adapter (A2 → A3 → A4...).",
    correction: "Utilise la poignée de recopie (petit carré en bas à droite) au lieu de copier-coller le texte de la formule.",
    severite: "critique"
  },
  {
    id: "recopie_mauvaise_direction",
    pattern: null, // Détecté si références ne s'adaptent pas dans le bon sens
    type: "recopie",
    competences: [6, 15],
    diagnostic: "Formule recopiée dans la mauvaise direction",
    feedback: "🤔 Ta formule ne s'adapte pas comme attendu. Vérifie que tu recopies dans la bonne direction (vers le bas pour les lignes, vers la droite pour les colonnes).",
    correction: "Les références relatives s'adaptent selon la direction de recopie : vers le bas = lignes changent, vers la droite = colonnes changent.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS SÉRIES AUTOMATIQUES (Compétence 52)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "serie_non_reconnue",
    pattern: null, // Détecté si recopie ne génère pas d'incrément
    type: "serie",
    competences: [52],
    diagnostic: "Série non reconnue par Excel",
    feedback: "🔢 Excel n'a pas reconnu ta série. Il a simplement copié la valeur au lieu de l'incrémenter.",
    correction: "Pour une série personnalisée, sélectionne AU MOINS 2 cellules pour qu'Excel comprenne l'incrément. Ex: 10, 20 → 30, 40...",
    severite: "importante"
  },
  {
    id: "serie_increment_incorrect",
    pattern: null, // Détecté si incrément ne correspond pas à l'attendu
    type: "serie",
    competences: [52],
    diagnostic: "Incrément de série incorrect",
    feedback: "📊 L'incrément de ta série n'est pas celui attendu. Excel a peut-être mal interprété ton pattern.",
    correction: "Sélectionne 2 ou 3 cellules pour définir clairement l'incrément. Ex: 5, 10, 15 → incrément de 5.",
    severite: "mineure"
  },
  {
    id: "serie_date_format_incorrect",
    pattern: null, // Détecté si date mal formatée
    type: "serie",
    competences: [52, 21],
    diagnostic: "Format de date non reconnu pour la série",
    feedback: "📅 Excel n'a pas reconnu ta date. Vérifie le format : JJ/MM/AAAA en français.",
    correction: "Utilise un format de date standard (01/01/2025) et vérifie que la cellule est formatée en Date.",
    severite: "importante"
  },
  {
    id: "serie_ctrl_oublie",
    pattern: null, // Détecté si copie identique au lieu d'incrément
    type: "serie",
    competences: [52],
    diagnostic: "Recopie identique au lieu d'incrémentée (Ctrl maintenu ?)",
    feedback: "💡 Tu as obtenu une copie identique au lieu d'une série. As-tu maintenu Ctrl pendant le glissement ? Ctrl = copier sans incrémenter.",
    correction: "Pour incrémenter : glisse SANS Ctrl. Pour copier à l'identique : glisse AVEC Ctrl.",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS COLLAGE SPÉCIAL (Compétence 58)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "collage_formule_cassee",
    pattern: /#REF!/,
    type: "collage",
    competences: [58, 6],
    diagnostic: "Formule cassée après collage (#REF!)",
    feedback: "❌ #REF! signifie que ta formule fait référence à des cellules qui n'existent plus ou sont inaccessibles après le collage.",
    correction: "Utilise Collage spécial > Valeurs (Ctrl+Alt+V puis V) pour coller uniquement les résultats, sans les formules.",
    severite: "critique"
  },
  {
    id: "collage_formule_au_lieu_valeur",
    pattern: null, // Détecté si cellule contient = alors qu'on attendait valeur
    type: "collage",
    competences: [58],
    diagnostic: "Formule collée au lieu de valeur",
    feedback: "📋 Tu as collé une formule alors que tu voulais probablement juste la valeur. La formule risque de pointer vers les mauvaises cellules.",
    correction: "Utilise Collage spécial > Valeurs : Ctrl+Alt+V puis V, ou clic-droit > Collage spécial > Valeurs.",
    severite: "importante"
  },
  {
    id: "collage_transpose_dimensions",
    pattern: null, // Détecté si dimensions ne correspondent pas
    type: "collage",
    competences: [58],
    diagnostic: "Transposition écrasant des données",
    feedback: "⚠️ Attention ! La transposition va créer un tableau avec des dimensions inversées. Vérifie que tu as assez de place.",
    correction: "Un tableau 5 lignes × 3 colonnes devient 3 lignes × 5 colonnes après transposition. Assure-toi que la zone de destination est vide.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS MFC - MISE EN FORME CONDITIONNELLE (Compétence 10)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "mfc_plage_incorrecte",
    pattern: null, // Détecté si règle appliquée à mauvaise plage
    type: "mfc",
    competences: [10, 24],
    diagnostic: "Règle MFC appliquée à la mauvaise plage",
    feedback: "🎨 Ta règle de mise en forme conditionnelle s'applique à une plage qui ne correspond pas à tes données.",
    correction: "Sélectionne d'abord la bonne plage, PUIS applique la MFC. Tu peux aussi modifier la plage dans Gérer les règles.",
    severite: "importante"
  },
  {
    id: "mfc_regles_conflit",
    pattern: null, // Détecté si plusieurs règles s'appliquent
    type: "mfc",
    competences: [10, 24],
    diagnostic: "Règles MFC en conflit",
    feedback: "🔀 Plusieurs règles s'appliquent à la même cellule. Seule la première règle 'gagnante' sera visible.",
    correction: "Vérifie l'ordre des règles dans Accueil > Mise en forme conditionnelle > Gérer les règles. L'ordre compte !",
    severite: "mineure"
  },
  {
    id: "mfc_valeur_texte_nombre",
    pattern: null, // Détecté si comparaison texte/nombre dans règle
    type: "mfc",
    competences: [10],
    diagnostic: "Règle MFC comparant texte et nombre",
    feedback: "⚠️ Ta règle compare peut-être du texte avec un nombre. '10' (texte) ≠ 10 (nombre).",
    correction: "Vérifie que tes cellules contiennent bien des nombres (alignés à droite) et non du texte ressemblant à des nombres.",
    severite: "importante"
  },
  {
    id: "mfc_condition_jamais_vraie",
    pattern: null, // Détecté si aucune cellule ne remplit la condition
    type: "mfc",
    competences: [10],
    diagnostic: "Condition MFC jamais satisfaite",
    feedback: "🤷 Ta règle ne s'applique à aucune cellule. La condition est peut-être trop restrictive ou mal formulée.",
    correction: "Vérifie ta condition. Par exemple, 'Inférieur à 0' ne matchera rien si toutes tes valeurs sont positives.",
    severite: "mineure"
  },
  {
    id: "mfc_icones_valeurs_incorrectes",
    pattern: null, // Détecté si jeux d'icônes mal configurés
    type: "mfc",
    competences: [10, 24],
    diagnostic: "Jeux d'icônes MFC mal configurés",
    feedback: "🚦 Les seuils de tes icônes ne correspondent pas à tes données. Les icônes ne s'affichent pas comme prévu.",
    correction: "Dans Gérer les règles > Modifier, ajuste les seuils (ex: vert si > 66%, orange si > 33%, rouge sinon).",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS SI IMBRIQUÉS (Compétence 16) - Phase 2
  // ═══════════════════════════════════════════════════════════════
  {
    id: "si_imbrique_ordre_conditions",
    pattern: /SI\([^;]+>=?\s*10[^;]*;[^;]+;SI\([^;]+>=?\s*1[2-6]/i,
    type: "si_imbrique",
    competences: [16],
    diagnostic: "Ordre des conditions inversé dans SI imbriqués",
    feedback: "⚠️ Tu testes >=10 avant >=12, >=14, etc. Tout le monde va tomber dans le premier cas ! Teste du plus grand au plus petit.",
    correction: "Ordre correct : >=16, puis >=14, puis >=12, puis >=10. Le plus restrictif d'abord.",
    severite: "critique"
  },
  {
    id: "si_imbrique_parentheses_manquantes",
    pattern: /SI\([^)]+SI\([^)]+\)[^)]*$/,
    type: "si_imbrique",
    competences: [16],
    diagnostic: "Parenthèses mal fermées dans SI imbriqués",
    feedback: "❌ Il manque des parenthèses à la fin de ta formule. Avec 4 SI imbriqués, tu dois avoir 4 parenthèses fermantes.",
    correction: "Compte tes SI : autant de ( que de ). Astuce : ferme chaque SI avant d'en ouvrir un nouveau.",
    severite: "critique"
  },
  {
    id: "si_imbrique_sup_vs_supegal",
    pattern: /SI\([^;]+>\s*\d+[^=]/,
    type: "si_imbrique",
    competences: [16, 9],
    diagnostic: "Utilisation de > au lieu de >= (cas limite exclu)",
    feedback: "🤔 Tu utilises > (strictement supérieur) au lieu de >= (supérieur ou égal). Un élève à exactement 16 n'aura pas Très Bien !",
    correction: "Pour inclure la valeur limite, utilise >= au lieu de >.",
    severite: "importante"
  },
  {
    id: "si_imbrique_trop_profond",
    pattern: /SI\([^)]*SI\([^)]*SI\([^)]*SI\([^)]*SI\([^)]*SI\(/,
    type: "si_imbrique",
    competences: [16],
    diagnostic: "Trop de SI imbriqués (>5 niveaux)",
    feedback: "💡 Ta formule a plus de 5 niveaux de SI. C'est difficile à lire et maintenir.",
    correction: "Pour beaucoup de cas, utilise plutôt RECHERCHEV avec une table de correspondance, ou la fonction SWITCH (Excel 365).",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS NB.SI.ENS (Compétence 12) - Phase 2
  // ═══════════════════════════════════════════════════════════════
  {
    id: "nbsi_ens_plages_tailles_diff",
    pattern: null, // Détecté par analyse des plages
    type: "nbsi_ens",
    competences: [12, 14],
    diagnostic: "Plages de tailles différentes dans NB.SI.ENS",
    feedback: "❌ Tes plages n'ont pas la même taille ! NB.SI.ENS nécessite que toutes les plages aient exactement le même nombre de lignes.",
    correction: "Vérifie : A2:A100 et B2:B100 ont 99 lignes. A2:A100 et B2:B50 = erreur.",
    severite: "critique"
  },
  {
    id: "nbsi_ens_critere_sans_guillemets",
    pattern: /NB\.SI\.ENS\([^)]*;[A-Za-z]+[^";)]/,
    type: "nbsi_ens",
    competences: [12],
    diagnostic: "Critère texte sans guillemets",
    feedback: "⚠️ Ton critère texte n'est pas entre guillemets. Excel pense que c'est une référence de cellule.",
    correction: "Les critères texte doivent être entre guillemets : \"Nord\", \"CDI\", etc.",
    severite: "importante"
  },
  {
    id: "nbsi_ens_ou_vs_et",
    pattern: null, // Détecté par contexte
    type: "nbsi_ens",
    competences: [12],
    diagnostic: "Confusion ET/OU dans NB.SI.ENS",
    feedback: "💡 NB.SI.ENS fait un ET logique (tous les critères doivent être vrais). Pour un OU, additionne plusieurs NB.SI.",
    correction: "OU : =NB.SI(plage;critère1)+NB.SI(plage;critère2). ET : =NB.SI.ENS(plage1;critère1;plage2;critère2)",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS SOMME.SI.ENS (Compétence 14) - Phase 2
  // ═══════════════════════════════════════════════════════════════
  {
    id: "sommesi_ens_ordre_arguments",
    pattern: /SOMME\.SI\.ENS\([^;]+;[^;]+;[^;]+\)/,
    type: "sommesi_ens",
    competences: [14],
    diagnostic: "Ordre des arguments potentiellement incorrect dans SOMME.SI.ENS",
    feedback: "⚠️ Dans SOMME.SI.ENS, la plage à additionner vient EN PREMIER, puis les paires plage/critère. C'est l'inverse de SOMME.SI !",
    correction: "SOMME.SI.ENS(plage_somme; plage_critère1; critère1; plage_critère2; critère2)",
    severite: "critique"
  },
  {
    id: "sommesi_ens_confusion_sommesi",
    pattern: /SOMME\.SI\([^)]*;[^)]*;[^)]*;[^)]*\)/,
    type: "sommesi_ens",
    competences: [14, 13],
    diagnostic: "SOMME.SI utilisé avec trop d'arguments (confusion avec SOMME.SI.ENS)",
    feedback: "🔄 Tu as mis trop d'arguments dans SOMME.SI. Pour plusieurs critères, utilise SOMME.SI.ENS.",
    correction: "SOMME.SI = 3 arguments max. SOMME.SI.ENS = plage_somme + paires plage/critère illimitées.",
    severite: "importante"
  },
  {
    id: "sommesi_ens_plage_somme_texte",
    pattern: null, // Détecté si plage somme contient du texte
    type: "sommesi_ens",
    competences: [14],
    diagnostic: "Plage somme contenant du texte",
    feedback: "⚠️ Ta plage à additionner semble contenir du texte. SOMME.SI.ENS ignore les textes mais ça peut fausser ton résultat.",
    correction: "Vérifie que ta plage_somme (premier argument) contient bien des nombres.",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS SIERREUR - Phase 2
  // ═══════════════════════════════════════════════════════════════
  {
    id: "sierreur_masque_toutes_erreurs",
    pattern: /SIERREUR\([^)]+\)/i,
    type: "sierreur",
    competences: [9],
    diagnostic: "SIERREUR masque toutes les erreurs",
    feedback: "💡 SIERREUR capture TOUTES les erreurs (#N/A, #DIV/0!, #REF!, etc.). C'est parfois trop large et peut masquer de vrais problèmes.",
    correction: "Pour plus de contrôle, utilise SI.NON.DISP (spécifique #N/A) ou SIERREUR.TYPE.",
    severite: "mineure"
  },
  {
    id: "sierreur_syntaxe_inversee",
    pattern: null, // Détecté si arguments inversés
    type: "sierreur",
    competences: [9],
    diagnostic: "Arguments SIERREUR potentiellement inversés",
    feedback: "⚠️ Vérifie l'ordre : =SIERREUR(formule_à_tester; valeur_si_erreur). La formule vient EN PREMIER.",
    correction: "=SIERREUR(RECHERCHEV(...);\"Non trouvé\") - pas l'inverse !",
    severite: "importante"
  },
  {
    id: "sierreur_valeur_defaut_inappropriee",
    pattern: /SIERREUR\([^;]+;\s*0\s*\)/i,
    type: "sierreur",
    competences: [9],
    diagnostic: "Valeur par défaut = 0 (peut fausser les calculs)",
    feedback: "🤔 Tu utilises 0 comme valeur par défaut. Attention : dans une SOMME ou MOYENNE, ce 0 sera comptabilisé !",
    correction: "Utilise \"\" (vide) ou \"N/A\" si tu ne veux pas affecter les calculs ultérieurs.",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS RECHERCHEH (Compétence 54) - Phase 3
  // ═══════════════════════════════════════════════════════════════
  {
    id: "rechercheh_confusion_ligne_colonne",
    pattern: /RECHERCHEH\([^)]+\)/i,
    type: "rechercheh",
    competences: [54],
    diagnostic: "Confusion n° de ligne vs n° de colonne dans RECHERCHEH",
    feedback: "⚠️ Dans RECHERCHEH, le 3ème argument est le n° de LIGNE (pas de colonne). Compte depuis le haut de ta table.",
    correction: "RECHERCHEH cherche dans la 1ère LIGNE et renvoie une valeur de la même COLONNE mais d'une LIGNE différente.",
    severite: "importante"
  },
  {
    id: "rechercheh_table_mal_selectionnee",
    pattern: null,
    type: "rechercheh",
    competences: [54],
    diagnostic: "Table RECHERCHEH ne commence pas par la ligne de recherche",
    feedback: "❌ Ta table doit commencer par la ligne où tu cherches (généralement la ligne 1 avec les en-têtes).",
    correction: "Inclus la ligne d'en-têtes dans ta sélection de table.",
    severite: "critique"
  },
  {
    id: "rechercheh_vs_recherchev",
    pattern: null,
    type: "rechercheh",
    competences: [54, 18],
    diagnostic: "RECHERCHEH utilisé sur une table verticale (ou inversement)",
    feedback: "🔄 RECHERCHEH est pour les tables horizontales (jours/mois en colonnes). Pour une liste verticale, utilise RECHERCHEV.",
    correction: "V = Vertical (recherche en colonne A). H = Horizontal (recherche en ligne 1).",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS VALIDATION DONNÉES (Compétence 22) - Phase 3
  // ═══════════════════════════════════════════════════════════════
  {
    id: "validation_liste_source_invalide",
    pattern: null,
    type: "validation",
    competences: [22],
    diagnostic: "Source de liste déroulante invalide",
    feedback: "❌ La source de ta liste déroulante est invalide. Vérifie la plage ou la syntaxe (valeurs séparées par ;).",
    correction: "Source valide : =$E$2:$E$10 (plage) ou Oui;Non;Peut-être (valeurs directes séparées par ;).",
    severite: "critique"
  },
  {
    id: "validation_message_absent",
    pattern: null,
    type: "validation",
    competences: [22],
    diagnostic: "Validation sans message d'erreur personnalisé",
    feedback: "💡 Ta validation fonctionne mais n'a pas de message d'erreur clair. L'utilisateur ne saura pas pourquoi sa saisie est refusée.",
    correction: "Dans Validation > Alerte d'erreur, ajoute un message explicatif (ex: 'La quantité doit être entre 1 et 100').",
    severite: "mineure"
  },
  {
    id: "validation_plage_non_absolue",
    pattern: null,
    type: "validation",
    competences: [22],
    diagnostic: "Source de liste avec références relatives",
    feedback: "⚠️ Ta source de liste utilise des références relatives. Si tu copies la cellule, la liste va se décaler.",
    correction: "Utilise des références absolues : =$E$2:$E$10 (avec les $).",
    severite: "importante"
  },
  {
    id: "validation_date_aujourdhui_figee",
    pattern: null,
    type: "validation",
    competences: [22, 21],
    diagnostic: "Date fixe au lieu de AUJOURDHUI() dans la validation",
    feedback: "📅 Tu as mis une date fixe dans ta validation. Demain, elle sera obsolète !",
    correction: "Utilise =AUJOURDHUI() pour que la validation s'adapte automatiquement.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS RECHERCHEV APPROCHÉE (Compétence 53) - Phase 3
  // ═══════════════════════════════════════════════════════════════
  {
    id: "recherchev_approchee_non_triee",
    pattern: null,
    type: "recherchev_approchee",
    competences: [53],
    diagnostic: "Table de barème non triée (RECHERCHEV approchée)",
    feedback: "⚠️ CRITIQUE : ta table de barème n'est pas triée par ordre croissant ! RECHERCHEV approchée ne fonctionnera pas correctement.",
    correction: "Trie ta table par ordre CROISSANT sur la 1ère colonne. C'est OBLIGATOIRE pour le mode approché.",
    severite: "critique"
  },
  {
    id: "recherchev_approchee_sans_vrai",
    pattern: /RECHERCHEV\([^)]+;[^)]+;\d+\s*\)/i,
    type: "recherchev_approchee",
    competences: [53, 18],
    diagnostic: "RECHERCHEV sans 4ème argument (approché par défaut)",
    feedback: "💡 Tu n'as pas précisé VRAI ou FAUX. Par défaut c'est VRAI (approché), ce qui nécessite une table triée.",
    correction: "Ajoute FAUX pour exact ou VRAI pour approché : =RECHERCHEV(...;FAUX) ou =RECHERCHEV(...;VRAI)",
    severite: "importante"
  },
  {
    id: "recherchev_approchee_debut_1",
    pattern: null,
    type: "recherchev_approchee",
    competences: [53],
    diagnostic: "Table de barème commençant à 1 au lieu de 0",
    feedback: "❌ Ta table de barème commence à 1. Les valeurs < 1 renverront #N/A !",
    correction: "La 1ère ligne du barème doit commencer à 0 (ou la valeur minimale possible).",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS FONCTIONS DATE (Compétence 21) - Phase 3
  // ═══════════════════════════════════════════════════════════════
  {
    id: "datedif_ordre_dates",
    pattern: /DATEDIF\s*\(\s*AUJOURDHUI/i,
    type: "date",
    competences: [21],
    diagnostic: "DATEDIF avec dates dans le mauvais ordre",
    feedback: "❌ Dans DATEDIF, la date de DÉBUT doit venir AVANT la date de FIN. Sinon tu obtiens une erreur.",
    correction: "=DATEDIF(date_début; date_fin; unité) - pas l'inverse !",
    severite: "critique"
  },
  {
    id: "datedif_unite_invalide",
    pattern: /DATEDIF\([^)]+;\s*"[^YMDymd]/i,
    type: "date",
    competences: [21],
    diagnostic: "Unité DATEDIF invalide",
    feedback: "⚠️ L'unité DATEDIF doit être : \"Y\" (années), \"M\" (mois), \"D\" (jours), \"YM\", \"MD\", ou \"YD\".",
    correction: "Unités valides : Y, M, D, YM (mois après années), MD (jours après mois), YD (jours après années).",
    severite: "importante"
  },
  {
    id: "date_format_texte",
    pattern: null,
    type: "date",
    competences: [21],
    diagnostic: "Date stockée comme texte",
    feedback: "📅 Ta date semble être du texte, pas une vraie date Excel. Les calculs de durée ne fonctionneront pas.",
    correction: "Convertis en date : CNUM(date) ou reformate la cellule en Date. Une vraie date est alignée à droite.",
    severite: "importante"
  },
  {
    id: "aujourdhui_parentheses",
    pattern: /AUJOURDHUI[^(]/,
    type: "date",
    competences: [21],
    diagnostic: "AUJOURDHUI sans parenthèses",
    feedback: "❌ AUJOURDHUI est une fonction, elle nécessite des parenthèses même vides : AUJOURDHUI()",
    correction: "=AUJOURDHUI() - avec les parenthèses !",
    severite: "critique"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS INDEX+EQUIV (Compétence 26) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "index_equiv_plages_incoherentes",
    pattern: null,
    type: "index_equiv",
    competences: [26],
    diagnostic: "Plages INDEX et EQUIV de tailles incohérentes",
    feedback: "❌ Les plages utilisées dans INDEX et EQUIV n'ont pas les mêmes dimensions. Le résultat sera incorrect ou #REF!",
    correction: "Si INDEX a 10 lignes et 5 colonnes, les EQUIV doivent chercher dans des plages de 10 et 5 éléments respectivement.",
    severite: "critique"
  },
  {
    id: "equiv_sans_zero",
    pattern: /EQUIV\([^)]+;\s*[^;)]+\s*\)/i,
    type: "index_equiv",
    competences: [26],
    diagnostic: "EQUIV sans le 3ème argument (mode de correspondance)",
    feedback: "⚠️ EQUIV sans 3ème argument utilise le mode approché par défaut (comme RECHERCHEV). Ajoute 0 pour une correspondance exacte.",
    correction: "=EQUIV(valeur;plage;0) pour une correspondance exacte. 0 est presque toujours ce que tu veux.",
    severite: "importante"
  },
  {
    id: "index_plage_decalee",
    pattern: null,
    type: "index_equiv",
    competences: [26],
    diagnostic: "Plage INDEX décalée par rapport aux EQUIV",
    feedback: "🔢 Ta plage INDEX semble décalée. Si EQUIV exclut les en-têtes, INDEX doit aussi les exclure.",
    correction: "INDEX et EQUIV doivent être alignés : si EQUIV commence en A2, INDEX doit correspondre.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS RECHERCHEX (Compétence 38) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "recherchex_version_excel",
    pattern: /RECHERCHEX|XLOOKUP/i,
    type: "recherchex",
    competences: [38],
    diagnostic: "RECHERCHEX nécessite Excel 365 ou Excel 2021",
    feedback: "📅 RECHERCHEX n'existe que dans Excel 365/2021. Si tu vois #NOM?, ta version d'Excel est trop ancienne.",
    correction: "Utilise INDEX+EQUIV comme alternative compatible avec toutes les versions.",
    severite: "info"
  },
  {
    id: "recherchex_plages_inversees",
    pattern: null,
    type: "recherchex",
    competences: [38],
    diagnostic: "Plages de recherche et de résultat inversées",
    feedback: "🔄 Dans RECHERCHEX, l'ordre est : où chercher, PUIS quoi renvoyer. Vérifie que tes plages sont dans le bon ordre.",
    correction: "=RECHERCHEX(valeur; plage_où_chercher; plage_à_renvoyer)",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS FORMULES MATRICIELLES (Compétences 29, 39) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "matricielle_debordement",
    pattern: null,
    type: "matricielle",
    competences: [29, 39],
    diagnostic: "Erreur #DÉBORDEMENT! (#SPILL!)",
    feedback: "🚫 Les cellules où ta formule matricielle doit s'étendre contiennent déjà des données. Excel ne peut pas 'déborder'.",
    correction: "Supprime le contenu des cellules adjacentes pour permettre à la formule de s'étendre.",
    severite: "critique"
  },
  {
    id: "filter_critere_et",
    pattern: /FILTER\([^)]*ET\s*\(/i,
    type: "matricielle",
    competences: [39],
    diagnostic: "Utilisation de ET() au lieu de * dans FILTER",
    feedback: "❌ Dans FILTER, n'utilise pas ET() pour combiner des critères. Utilise la multiplication : (cond1)*(cond2)",
    correction: "=FILTER(données;(col1=\"A\")*(col2>100)) - pas ET(col1=\"A\";col2>100)",
    severite: "critique"
  },
  {
    id: "filter_condition_invalide",
    pattern: null,
    type: "matricielle",
    competences: [39],
    diagnostic: "Condition FILTER ne renvoie pas un tableau booléen",
    feedback: "⚠️ La condition de FILTER doit renvoyer VRAI/FAUX pour chaque ligne. Vérifie que tu compares bien une colonne entière.",
    correction: "=FILTER(A:F;C:C=\"Paris\") - compare toute la colonne C, pas une seule cellule.",
    severite: "importante"
  },
  {
    id: "unique_doublons_attendus",
    pattern: null,
    type: "matricielle",
    competences: [39],
    diagnostic: "UNIQUE renvoie plus de valeurs qu'attendu",
    feedback: "🔍 UNIQUE considère les espaces et la casse. 'Paris', 'PARIS' et 'Paris ' sont 3 valeurs différentes !",
    correction: "Nettoie tes données avec SUPPRESPACE et MAJUSCULE/MINUSCULE avant UNIQUE.",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS NB.SI (Compétence 11) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "nbsi_sans_guillemets",
    pattern: /NB\.SI\s*\([^;]+;\s*[A-Za-z]+\s*\)/i,
    type: "nbsi",
    competences: [11],
    diagnostic: "Critère texte NB.SI sans guillemets",
    feedback: "❌ Le critère texte doit être entre guillemets : \"Mariage\" et non Mariage",
    correction: "=NB.SI(C:C;\"Mariage\") - avec les guillemets !",
    severite: "critique"
  },
  {
    id: "nbsi_operateur_sans_guillemets",
    pattern: /NB\.SI\s*\([^;]+;\s*[><]=?\s*\d/i,
    type: "nbsi",
    competences: [11],
    diagnostic: "Opérateur NB.SI sans guillemets",
    feedback: "❌ L'opérateur et la valeur doivent être entre guillemets : \">20000\" et non >20000",
    correction: "=NB.SI(F:F;\">20000\") - l'opérateur est DANS les guillemets !",
    severite: "critique"
  },
  {
    id: "nbsi_plusieurs_criteres",
    pattern: /NB\.SI\s*\([^)]+;[^)]+;[^)]+;/i,
    type: "nbsi",
    competences: [11, 12],
    diagnostic: "NB.SI avec plusieurs critères",
    feedback: "⚠️ NB.SI accepte UN seul critère. Pour plusieurs critères, utilise NB.SI.ENS.",
    correction: "=NB.SI.ENS(plage1;crit1;plage2;crit2) pour compter avec plusieurs conditions.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS FONCTIONS TEXTE (Compétences 19, 20) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "stxt_position_zero",
    pattern: /STXT\s*\([^;]+;\s*0\s*;/i,
    type: "texte",
    competences: [20],
    diagnostic: "STXT avec position 0",
    feedback: "❌ Dans Excel, les positions de caractères commencent à 1, pas 0.",
    correction: "=STXT(texte;1;5) pour les 5 premiers caractères.",
    severite: "critique"
  },
  {
    id: "gauche_cherche_sans_moins_un",
    pattern: /GAUCHE\s*\([^;]+;\s*CHERCHE\s*\([^)]+\)\s*\)/i,
    type: "texte",
    competences: [20],
    diagnostic: "GAUCHE+CHERCHE sans -1",
    feedback: "⚠️ GAUCHE(texte;CHERCHE(\" \";texte)) inclut l'espace ! Ajoute -1 pour l'exclure.",
    correction: "=GAUCHE(texte;CHERCHE(\" \";texte)-1) pour exclure le séparateur.",
    severite: "importante"
  },
  {
    id: "concat_nombre_non_converti",
    pattern: null,
    type: "texte",
    competences: [19],
    diagnostic: "Concaténation avec nombre non formaté",
    feedback: "💡 Les nombres concaténés perdent leur format. 1234.5 devient '1234.5' au lieu de '1 234,50 €'.",
    correction: "Utilise TEXTE(nombre;\"# ##0,00 €\") pour garder le format avant de concaténer.",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS SOMMEPROD (Compétence 23) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "sommeprod_sans_parentheses",
    pattern: /SOMMEPROD\s*\(\s*[A-Z]+\d*:[A-Z]+\d*\s*=\s*"/i,
    type: "sommeprod",
    competences: [23],
    diagnostic: "Condition SOMMEPROD sans parenthèses",
    feedback: "❌ Chaque condition dans SOMMEPROD doit être entre parenthèses.",
    correction: "=SOMMEPROD((C:C=\"IDF\")*(F:F)) et non =SOMMEPROD(C:C=\"IDF\"*F:F)",
    severite: "critique"
  },
  {
    id: "sommeprod_plages_differentes",
    pattern: null,
    type: "sommeprod",
    competences: [23],
    diagnostic: "Plages SOMMEPROD de tailles différentes",
    feedback: "❌ Toutes les plages dans SOMMEPROD doivent avoir exactement la même taille.",
    correction: "Si une plage va de 2 à 100, toutes doivent aller de 2 à 100. Erreur #VALEUR! sinon.",
    severite: "critique"
  },
  {
    id: "sommeprod_et_au_lieu_de_mult",
    pattern: /SOMMEPROD\s*\([^)]*ET\s*\(/i,
    type: "sommeprod",
    competences: [23],
    diagnostic: "Utilisation de ET() au lieu de * dans SOMMEPROD",
    feedback: "❌ Dans SOMMEPROD, utilise * pour combiner les conditions, pas ET().",
    correction: "=SOMMEPROD((cond1)*(cond2)*(plage)) et non =SOMMEPROD(ET(cond1;cond2)*plage)",
    severite: "critique"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS MIN/MAX (Compétence 5) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "min_max_avec_texte",
    pattern: null,
    type: "statistique",
    competences: [5],
    diagnostic: "MIN/MAX ignore le texte mais peut créer de la confusion",
    feedback: "💡 MIN et MAX ignorent les cellules contenant du texte. Si tu obtiens un résultat inattendu, vérifie qu'il n'y a pas de texte dans ta plage.",
    correction: "Assure-toi que ta plage ne contient que des nombres. Utilise CNUM() si nécessaire.",
    severite: "mineure"
  },
  {
    id: "min_max_cellule_vide",
    pattern: null,
    type: "statistique",
    competences: [5],
    diagnostic: "MIN renvoie 0 si la plage contient des cellules vides formatées",
    feedback: "⚠️ MIN peut renvoyer 0 si certaines cellules semblent vides mais contiennent en fait une chaîne vide ou un espace.",
    correction: "Vérifie avec NBVAL et NB que tu as le même nombre de cellules.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS RÉFÉRENCES ABSOLUES/MIXTES (Compétences 15, 51) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "reference_oubli_dollar",
    pattern: null,
    type: "reference",
    competences: [15],
    diagnostic: "Référence qui aurait dû être absolue",
    feedback: "❌ Ta référence se décale quand tu recopies, alors qu'elle devrait rester fixe. Il manque des $.",
    correction: "Utilise $A$1 pour figer complètement. Appuie sur F4 pour ajouter les $.",
    severite: "critique"
  },
  {
    id: "reference_trop_de_dollars",
    pattern: /\$[A-Z]+\$\d+.*\$[A-Z]+\$\d+/,
    type: "reference",
    competences: [15],
    diagnostic: "Trop de références absolues - la formule ne s'adapte pas",
    feedback: "⚠️ Tu as mis $ partout. Ta formule ne s'adapte plus du tout quand tu la recopies.",
    correction: "Réfléchis : qu'est-ce qui doit rester fixe (mettre $) et qu'est-ce qui doit bouger (pas de $) ?",
    severite: "importante"
  },
  {
    id: "reference_mixte_inversee",
    pattern: null,
    type: "reference",
    competences: [51],
    diagnostic: "Référence mixte avec $ au mauvais endroit",
    feedback: "🔄 Tu as mis le $ du mauvais côté. $A1 fige la COLONNE. A$1 fige la LIGNE.",
    correction: "$A1 = colonne A toujours. A$1 = ligne 1 toujours. Choisis selon ce qui doit rester fixe.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS DECALER (Compétence 28) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "decaler_sans_dimensions",
    pattern: /DECALER\s*\([^,;]+[,;]\s*\d+\s*[,;]\s*\d+\s*\)/i,
    type: "decaler",
    competences: [28],
    diagnostic: "DECALER sans hauteur/largeur renvoie une seule cellule",
    feedback: "⚠️ DECALER sans les arguments 4 et 5 (hauteur, largeur) renvoie UNE seule cellule, pas une plage.",
    correction: "=DECALER(A1;0;0;10;1) crée une plage de 10 lignes × 1 colonne. Ajoute ces arguments !",
    severite: "importante"
  },
  {
    id: "decaler_decalage_un_en_trop",
    pattern: null,
    type: "decaler",
    competences: [28],
    diagnostic: "Décalage de 1 en trop ou en moins",
    feedback: "🔢 Attention au décalage ! DECALER(A1;1;0) donne A2, pas 'A1 + 1 ligne de données'.",
    correction: "Pour partir de A2 avec une plage de N lignes : DECALER(A1;1;0;N;1) ou DECALER(A2;0;0;N;1).",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS TRI ET FILTRES (Compétences 7, 8) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "tri_sans_etendre",
    pattern: null,
    type: "tri",
    competences: [7],
    diagnostic: "Tri appliqué sans étendre la sélection",
    feedback: "❌ DANGER : tu as trié une seule colonne sans les autres ! Les données sont maintenant mélangées (un CA avec le mauvais produit).",
    correction: "Toujours cliquer 'Étendre la sélection' ou trier depuis une seule cellule pour qu'Excel sélectionne tout.",
    severite: "critique"
  },
  {
    id: "filtre_oublie_actif",
    pattern: null,
    type: "filtre",
    competences: [8],
    diagnostic: "Filtre actif oublié",
    feedback: "👁️ Attention : un filtre est actif ! Tu ne vois pas toutes tes données. Regarde les icônes d'entonnoir dans les en-têtes.",
    correction: "Données > Effacer pour supprimer tous les filtres, ou vérifie chaque colonne.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS TCD (Compétence 17) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "tcd_source_mal_structuree",
    pattern: null,
    type: "tcd",
    competences: [17],
    diagnostic: "Données sources mal structurées pour TCD",
    feedback: "⚠️ Tes données ne sont pas bien structurées pour un TCD. Règles : 1 ligne = 1 enregistrement, pas de cellules fusionnées, pas de lignes vides.",
    correction: "Restructure tes données : une colonne par champ, une ligne par transaction.",
    severite: "critique"
  },
  {
    id: "tcd_pas_actualise",
    pattern: null,
    type: "tcd",
    competences: [17],
    diagnostic: "TCD non actualisé après modification des données",
    feedback: "🔄 Ton TCD n'affiche pas les dernières données ! Les TCD ne se mettent pas à jour automatiquement.",
    correction: "Clic droit sur le TCD > Actualiser, ou onglet Analyse > Actualiser.",
    severite: "importante"
  },
  {
    id: "tcd_comptage_au_lieu_somme",
    pattern: null,
    type: "tcd",
    competences: [17],
    diagnostic: "TCD affiche un comptage au lieu d'une somme",
    feedback: "🔢 Ton TCD compte les lignes au lieu de sommer les valeurs ! C'est le comportement par défaut pour le texte.",
    correction: "Clic droit sur les valeurs > Synthétiser les valeurs par > Somme.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS GRAPHIQUES (Compétence 25) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "graphique_camembert_trop_categories",
    pattern: null,
    type: "graphique",
    competences: [25],
    diagnostic: "Graphique en secteurs avec trop de catégories",
    feedback: "🥧 Ton camembert a trop de parts ! Au-delà de 5-7 catégories, c'est illisible.",
    correction: "Regroupe les petites catégories en 'Autres', ou utilise un histogramme à la place.",
    severite: "importante"
  },
  {
    id: "graphique_courbe_non_chrono",
    pattern: null,
    type: "graphique",
    competences: [25],
    diagnostic: "Courbe utilisée pour des données non chronologiques",
    feedback: "📈 Une courbe suggère une évolution dans le temps. Si tes données ne sont pas chronologiques, utilise un histogramme.",
    correction: "Courbe = évolution temporelle. Histogramme = comparaison de catégories.",
    severite: "mineure"
  },
  {
    id: "graphique_sans_titre",
    pattern: null,
    type: "graphique",
    competences: [25],
    diagnostic: "Graphique sans titre",
    feedback: "📊 Ton graphique n'a pas de titre ! Le lecteur ne sait pas ce qu'il regarde.",
    correction: "Clique sur 'Titre du graphique' et remplace par un titre explicite.",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS TABLEAUX STRUCTURÉS (Compétences 27, 56) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "tableau_structure_pas_converti",
    pattern: null,
    type: "tableau_structure",
    competences: [27],
    diagnostic: "Données non converties en tableau structuré",
    feedback: "💡 Tes données ne sont pas en tableau structuré. Tu perds les avantages : auto-extension, références lisibles, formatage automatique.",
    correction: "Sélectionne une cellule > Ctrl+T pour convertir en tableau structuré.",
    severite: "mineure"
  },
  {
    id: "reference_structuree_syntaxe",
    pattern: /\[@[^\]]+\]/,
    type: "tableau_structure",
    competences: [56],
    diagnostic: "Erreur de syntaxe dans une référence structurée",
    feedback: "⚠️ La syntaxe de ta référence structurée semble incorrecte.",
    correction: "[@Colonne] pour la ligne actuelle, Table[Colonne] pour toute la colonne. Vérifie le nom exact de la colonne.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS SAISIE ET NAVIGATION (Compétence 1) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "saisie_oubli_entree",
    pattern: null,
    type: "saisie",
    competences: [1],
    diagnostic: "Saisie non validée",
    feedback: "⚠️ Tu as tapé du texte mais pas validé avec Entrée ou Tab. La saisie n'est pas enregistrée.",
    correction: "Appuie sur Entrée (vers le bas) ou Tab (vers la droite) pour valider la saisie.",
    severite: "importante"
  },
  {
    id: "saisie_f2_vs_direct",
    pattern: null,
    type: "saisie",
    competences: [1],
    diagnostic: "Confusion entre modification et remplacement",
    feedback: "💡 Taper directement REMPLACE tout le contenu. F2 permet de MODIFIER le contenu existant.",
    correction: "Utilise F2 si tu veux corriger une partie, tape directement si tu veux remplacer.",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS FORMATAGE (Compétence 2) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "formatage_diese_colonne",
    pattern: null,
    type: "formatage",
    competences: [2],
    diagnostic: "Colonne trop étroite (affiche ###)",
    feedback: "👀 Ta cellule affiche ### ? C'est que la colonne est trop étroite pour afficher le nombre.",
    correction: "Double-clic entre les en-têtes de colonnes pour ajuster automatiquement la largeur.",
    severite: "mineure"
  },
  {
    id: "formatage_date_texte",
    pattern: null,
    type: "formatage",
    competences: [2],
    diagnostic: "Date stockée comme texte",
    feedback: "📅 Ta date est alignée à gauche ? Elle est stockée comme texte, pas comme vraie date.",
    correction: "Sélectionne > Données > Convertir, ou multiplie par 1, ou utilise DATEVAL().",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS SOMME (Compétence 3) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "somme_oubli_egal",
    pattern: /^SOMME\(/i,
    type: "formule",
    competences: [3],
    diagnostic: "Formule sans le signe = au début",
    feedback: "❌ Ta formule s'affiche comme du texte ! Tu as oublié le = au début.",
    correction: "Toute formule commence par =. Écris =SOMME(...) pas SOMME(...).",
    severite: "critique"
  },
  {
    id: "somme_virgule_vs_pointvirgule",
    pattern: /SOMME\([^)]*,[^)]*\)/i,
    type: "formule",
    competences: [3],
    diagnostic: "Virgule au lieu de point-virgule",
    feedback: "⚠️ En français, le séparateur d'arguments est ; (point-virgule), pas , (virgule).",
    correction: "=SOMME(A1;B1;C1) et non =SOMME(A1,B1,C1).",
    severite: "critique"
  },
  {
    id: "somme_entete_inclus",
    pattern: null,
    type: "formule",
    competences: [3],
    diagnostic: "En-tête inclus dans la plage SOMME",
    feedback: "⚠️ Tu as peut-être inclus l'en-tête dans ta somme. Si l'en-tête est du texte, il sera ignoré, mais c'est une mauvaise pratique.",
    correction: "=SOMME(B2:B10) pas =SOMME(B1:B10) si B1 est l'en-tête.",
    severite: "mineure"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS MFC AVANCÉE (Compétence 24) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "mfc_formule_ref_absolue",
    pattern: null,
    type: "mfc",
    competences: [24],
    diagnostic: "Référence absolue dans formule MFC",
    feedback: "🔒 Ta règle MFC avec formule ne s'applique qu'à une cellule ? Tu as probablement utilisé $A$1 au lieu de $A1.",
    correction: "Dans les formules MFC, utilise $A1 (colonne fixe, ligne relative) pour que la règle s'adapte à chaque ligne.",
    severite: "importante"
  },
  {
    id: "mfc_regles_contradictoires",
    pattern: null,
    type: "mfc",
    competences: [24],
    diagnostic: "Règles MFC qui se contredisent",
    feedback: "🎨 Tes couleurs MFC sont bizarres ? Tu as peut-être plusieurs règles qui s'appliquent à la même cellule.",
    correction: "Gérer les règles > vérifie l'ordre de priorité. Utilise 'Arrêter si vrai' pour éviter les cumuls.",
    severite: "importante"
  },

  // ═══════════════════════════════════════════════════════════════
  // ERREURS POWER QUERY (Compétence 30) - Phase 4
  // ═══════════════════════════════════════════════════════════════
  {
    id: "pq_oubli_actualiser",
    pattern: null,
    type: "power_query",
    competences: [30],
    diagnostic: "Données Power Query non actualisées",
    feedback: "🔄 Tes données Power Query ne reflètent pas les dernières modifications ? N'oublie pas d'actualiser !",
    correction: "Données > Actualiser tout, ou clic droit sur le tableau > Actualiser.",
    severite: "importante"
  },
  {
    id: "pq_type_non_change",
    pattern: null,
    type: "power_query",
    competences: [30],
    diagnostic: "Type de données non changé dans Power Query",
    feedback: "📊 Tes calculs donnent des résultats bizarres ? Vérifie que les types de données sont corrects (nombre, date, texte).",
    correction: "Dans Power Query, clique sur l'icône du type dans l'en-tête et choisis le bon type.",
    severite: "importante"
  }
];

/**
 * MAPPING ERREUR → COMPÉTENCE PRIORITAIRE
 */
export const ERREUR_TO_COMPETENCE = {
  // Références
  "reference_non_figee": 15,
  "reference_mixte_incorrecte": 51,
  // RECHERCHEV
  "recherchev_mode_ambigu": 18,
  "recherchev_index_invalide": 18,
  // Syntaxe
  "syntaxe_si": 9,
  "syntaxe_parentheses": 16,
  "ordre_arguments": 14,
  "syntaxe_critere": 11,
  "erreur_excel": 3,
  "logique": 3,
  // Copier-coller / Recopie (Phase 1)
  "recopie_valeur_pas_formule": 6,
  "recopie_formule_non_adaptee": 6,
  "recopie_mauvaise_direction": 6,
  // Séries (Phase 1)
  "serie_non_reconnue": 52,
  "serie_increment_incorrect": 52,
  "serie_date_format_incorrect": 52,
  "serie_ctrl_oublie": 52,
  // Collage spécial (Phase 1)
  "collage_formule_cassee": 58,
  "collage_formule_au_lieu_valeur": 58,
  "collage_transpose_dimensions": 58,
  // MFC (Phase 1)
  "mfc_plage_incorrecte": 10,
  "mfc_regles_conflit": 10,
  "mfc_valeur_texte_nombre": 10,
  "mfc_condition_jamais_vraie": 10,
  "mfc_icones_valeurs_incorrectes": 10,
  // SI imbriqués (Phase 2)
  "si_imbrique_ordre_conditions": 16,
  "si_imbrique_parentheses_manquantes": 16,
  "si_imbrique_sup_vs_supegal": 16,
  "si_imbrique_trop_profond": 16,
  // NB.SI.ENS (Phase 2)
  "nbsi_ens_plages_tailles_diff": 12,
  "nbsi_ens_critere_sans_guillemets": 12,
  "nbsi_ens_ou_vs_et": 12,
  // SOMME.SI.ENS (Phase 2)
  "sommesi_ens_ordre_arguments": 14,
  "sommesi_ens_confusion_sommesi": 14,
  "sommesi_ens_plage_somme_texte": 14,
  // SIERREUR (Phase 2)
  "sierreur_masque_toutes_erreurs": 9,
  "sierreur_syntaxe_inversee": 9,
  "sierreur_valeur_defaut_inappropriee": 9,
  // RECHERCHEH (Phase 3)
  "rechercheh_confusion_ligne_colonne": 54,
  "rechercheh_table_mal_selectionnee": 54,
  // Validation données (Phase 3)
  "validation_liste_source_invalide": 22,
  "validation_message_absent": 22,
  // RECHERCHEV approchée (Phase 3)
  "recherchev_approchee_non_triee": 53,
  "recherchev_approchee_sans_vrai": 53,
  "recherchev_approchee_debut_1": 53,
  // Fonctions date (Phase 3)
  "datedif_ordre_dates": 21,
  "datedif_unite_invalide": 21,
  "date_format_texte": 21,
  // INDEX+EQUIV (Phase 4)
  "index_equiv_plages_incoherentes": 26,
  "equiv_sans_zero": 26,
  "index_plage_decalee": 26,
  // RECHERCHEX (Phase 4)
  "recherchex_version_excel": 38,
  "recherchex_plages_inversees": 38,
  // Formules matricielles (Phase 4)
  "matricielle_debordement": 29,
  "filter_critere_et": 39,
  "filter_condition_invalide": 39,
  // NB.SI (Phase 4)
  "nbsi_sans_guillemets": 11,
  "nbsi_operateur_sans_guillemets": 11,
  "nbsi_plusieurs_criteres": 11,
  // Fonctions texte (Phase 4)
  "stxt_position_zero": 20,
  "gauche_cherche_sans_moins_un": 20,
  "concat_nombre_non_converti": 19,
  // SOMMEPROD (Phase 4)
  "sommeprod_sans_parentheses": 23,
  "sommeprod_plages_differentes": 23,
  "sommeprod_et_au_lieu_de_mult": 23,
  // MIN/MAX (Phase 4)
  "min_max_avec_texte": 5,
  // Références absolues/mixtes (Phase 4)
  "reference_oubli_dollar": 15,
  "reference_trop_de_dollars": 15,
  "reference_mixte_inversee": 51,
  // DECALER (Phase 4)
  "decaler_sans_dimensions": 28,
  "decaler_decalage_un_en_trop": 28,
  // Tri et Filtres (Phase 4)
  "tri_sans_etendre": 7,
  "filtre_oublie_actif": 8,
  // TCD (Phase 4)
  "tcd_source_mal_structuree": 17,
  "tcd_pas_actualise": 17,
  "tcd_comptage_au_lieu_somme": 17,
  // Graphiques (Phase 4)
  "graphique_camembert_trop_categories": 25,
  "graphique_courbe_non_chrono": 25,
  "graphique_sans_titre": 25,
  // Tableaux structurés (Phase 4)
  "tableau_structure_pas_converti": 27,
  "reference_structuree_syntaxe": 56,
  // Saisie et navigation (Phase 4)
  "saisie_oubli_entree": 1,
  "saisie_f2_vs_direct": 1,
  // Formatage (Phase 4)
  "formatage_diese_colonne": 2,
  "formatage_date_texte": 2,
  // SOMME (Phase 4)
  "somme_oubli_egal": 3,
  "somme_virgule_vs_pointvirgule": 3,
  "somme_entete_inclus": 3,
  // MFC avancée (Phase 4)
  "mfc_formule_ref_absolue": 24,
  "mfc_regles_contradictoires": 24,
  // Power Query (Phase 4)
  "pq_oubli_actualiser": 30,
  "pq_type_non_change": 30
};

/**
 * Trouve les erreurs dans une formule
 * @param {string} formula - La formule à analyser
 * @returns {Array} - Liste des erreurs détectées
 */
export function detecterErreurs(formula) {
  if (!formula) return [];
  
  const erreursDetectees = [];
  
  for (const erreur of ERREURS_FORMULES) {
    if (erreur.pattern && erreur.pattern.test(formula)) {
      erreursDetectees.push({
        ...erreur,
        formule: formula
      });
    }
  }
  
  return erreursDetectees;
}

/**
 * Obtient le feedback pour une erreur donnée
 * @param {string} erreurId - ID de l'erreur
 * @returns {Object|null} - Objet avec feedback, correction, severite
 */
export function getFeedbackErreur(erreurId) {
  const erreur = ERREURS_FORMULES.find(e => e.id === erreurId);
  if (!erreur) return null;
  
  return {
    feedback: erreur.feedback,
    correction: erreur.correction,
    severite: erreur.severite,
    competences: erreur.competences
  };
}

/**
 * Obtient toutes les erreurs liées à une compétence
 * @param {number} competenceId - ID de la compétence
 * @returns {Array} - Liste des erreurs fréquentes pour cette compétence
 */
export function getErreursParCompetence(competenceId) {
  return ERREURS_FORMULES.filter(e => 
    e.competences.includes(competenceId)
  );
}

/**
 * Classifie la sévérité globale d'un ensemble d'erreurs
 * @param {Array} erreurs - Liste d'erreurs détectées
 * @returns {string} - 'critique' | 'importante' | 'mineure' | 'aucune'
 */
export function classifierSeverite(erreurs) {
  if (!erreurs || erreurs.length === 0) return 'aucune';
  
  if (erreurs.some(e => e.severite === 'critique')) return 'critique';
  if (erreurs.some(e => e.severite === 'importante')) return 'importante';
  return 'mineure';
}

export default {
  ERREURS_FORMULES,
  ERREUR_TO_COMPETENCE,
  detecterErreurs,
  getFeedbackErreur,
  getErreursParCompetence,
  classifierSeverite
};