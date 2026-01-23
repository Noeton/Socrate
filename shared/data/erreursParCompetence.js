/**
 * RÉFÉRENTIEL DES ERREURS FRÉQUENTES PAR COMPÉTENCE
 * 
 * Utilisé pour enrichir automatiquement les exercices
 * et fournir un feedback pédagogique pertinent
 */

export const ERREURS_PAR_COMPETENCE = {
  
  // ═══════════════════════════════════════════════════════════════
  // FORMULES DE BASE
  // ═══════════════════════════════════════════════════════════════
  
  "SOMME": [
    {
      erreur: "Oublier le = au début de la formule",
      explication: "Sans le =, Excel interprète la saisie comme du texte",
      solution: "Toujours commencer par = : =SOMME(A1:A10)"
    },
    {
      erreur: "Inclure la cellule de résultat dans la plage",
      explication: "Cela crée une référence circulaire (la cellule se calcule elle-même)",
      solution: "La cellule contenant la formule ne doit jamais être dans la plage sommée"
    },
    {
      erreur: "Sélectionner une plage incorrecte",
      explication: "Les références de cellules ne correspondent pas aux données voulues",
      solution: "Vérifiez visuellement que la plage colorée correspond aux cellules souhaitées"
    },
    {
      erreur: "Utiliser des virgules au lieu de deux-points pour les plages",
      explication: "A1,A10 additionne seulement A1 et A10, pas les cellules entre",
      solution: "Utilisez A1:A10 pour une plage continue"
    }
  ],
  
  "MOYENNE": [
    {
      erreur: "Confondre cellule vide et cellule contenant 0",
      explication: "MOYENNE ignore les cellules vides mais compte les 0",
      solution: "Si 0 signifie 'pas de valeur', laissez la cellule vide plutôt que d'y mettre 0"
    },
    {
      erreur: "Inclure des cellules texte dans la plage",
      explication: "Les cellules texte sont ignorées, ce qui peut fausser le résultat",
      solution: "Vérifiez que votre plage ne contient que des nombres"
    },
    {
      erreur: "Croire que le format d'affichage est la vraie valeur",
      explication: "MOYENNE peut afficher 3.33 mais la valeur réelle est 3.333333...",
      solution: "Le format n'affecte que l'affichage, pas le calcul"
    }
  ],
  
  "MIN": [
    {
      erreur: "Confondre MIN et PETITE.VALEUR",
      explication: "MIN retourne le minimum, PETITE.VALEUR retourne le Nième plus petit",
      solution: "Pour le 2ème plus petit : =PETITE.VALEUR(plage;2)"
    },
    {
      erreur: "Oublier que les dates sont des nombres",
      explication: "MIN sur des dates retourne la date la plus ancienne (plus petit nombre)",
      solution: "C'est le comportement normal - MIN fonctionne sur les dates"
    }
  ],
  
  "MAX": [
    {
      erreur: "Confondre MAX et GRANDE.VALEUR",
      explication: "MAX retourne le maximum, GRANDE.VALEUR retourne le Nième plus grand",
      solution: "Pour le 2ème plus grand : =GRANDE.VALEUR(plage;2)"
    }
  ],
  
  // ═══════════════════════════════════════════════════════════════
  // FORMULES CONDITIONNELLES
  // ═══════════════════════════════════════════════════════════════
  
  "SI": [
    {
      erreur: "Oublier les guillemets autour du texte",
      explication: "Sans guillemets, Excel cherche une cellule nommée ainsi",
      solution: '=SI(A1>10;"Oui";"Non") - les textes entre guillemets'
    },
    {
      erreur: "Utiliser = au lieu de == (qui n'existe pas)",
      explication: "En Excel, = suffit pour tester l'égalité",
      solution: "=SI(A1=10;...) et non =SI(A1==10;...)"
    },
    {
      erreur: "Parenthèse fermante manquante",
      explication: "Chaque ( doit avoir son )",
      solution: "Comptez les parenthèses : =SI(A1>10;(B1+C1);0)"
    },
    {
      erreur: "Oublier le 3ème argument (valeur si faux)",
      explication: "Sans 3ème argument, SI retourne FAUX si la condition est fausse",
      solution: "Toujours spécifier les deux résultats : =SI(test;si_vrai;si_faux)"
    }
  ],
  
  "SI imbriqués": [
    {
      erreur: "Mauvais ordre des conditions",
      explication: "Les conditions sont testées dans l'ordre - la première vraie gagne",
      solution: "Testez du plus restrictif au moins restrictif : >90 avant >80 avant >70"
    },
    {
      erreur: "Perdre le fil des parenthèses",
      explication: "Avec plusieurs SI imbriqués, les parenthèses s'accumulent",
      solution: "Utilisez l'indentation ou SI.CONDITIONS (Excel 2019+)"
    },
    {
      erreur: "Oublier le cas 'sinon' final",
      explication: "Sans dernier else, certaines valeurs ne matchent aucune condition",
      solution: "Le dernier argument du dernier SI est le 'sinon' par défaut"
    }
  ],
  
  "NB.SI": [
    {
      erreur: "Oublier les guillemets autour du critère texte",
      explication: "Le critère texte doit être entre guillemets",
      solution: '=NB.SI(A:A;"Paris") et non =NB.SI(A:A;Paris)'
    },
    {
      erreur: "Confondre NB.SI et NB.SI.ENS",
      explication: "NB.SI = 1 critère, NB.SI.ENS = plusieurs critères",
      solution: "Pour plusieurs conditions, utilisez NB.SI.ENS"
    },
    {
      erreur: "Oublier les guillemets autour des opérateurs",
      explication: 'Les opérateurs doivent être dans le texte du critère',
      solution: '=NB.SI(A:A;">100") - le > est dans les guillemets'
    }
  ],
  
  "NB.SI.ENS": [
    {
      erreur: "Plages de tailles différentes",
      explication: "Toutes les plages doivent avoir exactement le même nombre de cellules",
      solution: "Vérifiez que A1:A100 et B1:B100 ont la même taille"
    },
    {
      erreur: "Inverser plage et critère",
      explication: "L'ordre est toujours : plage PUIS critère",
      solution: "=NB.SI.ENS(plage1;critère1;plage2;critère2)"
    },
    {
      erreur: "Croire que c'est un OU (c'est un ET)",
      explication: "NB.SI.ENS compte les lignes qui satisfont TOUS les critères",
      solution: "Pour un OU, additionnez plusieurs NB.SI"
    }
  ],
  
  "SOMME.SI": [
    {
      erreur: "Inverser plage_critère et plage_somme",
      explication: "L'ordre est : plage où chercher, critère, plage à sommer",
      solution: "=SOMME.SI(plage_critère;critère;plage_somme)"
    },
    {
      erreur: "Plages de tailles différentes",
      explication: "plage_critère et plage_somme doivent avoir la même taille",
      solution: "Si critère en A1:A100, somme doit être sur 100 cellules aussi"
    },
    {
      erreur: "Oublier les guillemets autour des opérateurs",
      explication: "Les critères avec opérateurs sont des textes",
      solution: '=SOMME.SI(A:A;">0";B:B) - le >0 entre guillemets'
    }
  ],
  
  "SOMME.SI.ENS": [
    {
      erreur: "Oublier que plage_somme est EN PREMIER",
      explication: "Contrairement à SOMME.SI, ici la plage à sommer vient d'abord",
      solution: "=SOMME.SI.ENS(plage_somme;plage1;critère1;plage2;critère2)"
    },
    {
      erreur: "Confondre avec SOMME.SI",
      explication: "L'ordre des arguments est inversé entre les deux fonctions",
      solution: "SOMME.SI.ENS : somme d'abord. SOMME.SI : somme à la fin"
    }
  ],
  
  "SIERREUR": [
    {
      erreur: "Masquer toutes les erreurs sans discrimination",
      explication: "SIERREUR cache TOUTES les erreurs, même les vraies",
      solution: "N'utilisez SIERREUR que si vous savez quelle erreur est attendue"
    },
    {
      erreur: "Mettre SIERREUR autour de cellules, pas de formules",
      explication: "SIERREUR teste si une FORMULE produit une erreur",
      solution: "=SIERREUR(RECHERCHEV(...);\"Non trouvé\")"
    }
  ],
  
  // ═══════════════════════════════════════════════════════════════
  // RECHERCHE
  // ═══════════════════════════════════════════════════════════════
  
  "RECHERCHEV": [
    {
      erreur: "Table non figée avec $ → #REF! à la recopie",
      explication: "La table de référence doit être en absolu pour la recopie",
      solution: "Utilisez $A$1:$D$10 (F4 pour basculer)"
    },
    {
      erreur: "N° de colonne trop grand → #REF!",
      explication: "Le numéro de colonne doit être ≤ au nombre de colonnes de la table",
      solution: "Comptez les colonnes de votre table depuis la gauche"
    },
    {
      erreur: "Valeur non trouvée → #N/A",
      explication: "La valeur cherchée n'existe pas exactement dans la 1ère colonne",
      solution: "Vérifiez l'orthographe et les espaces invisibles"
    },
    {
      erreur: "VRAI sur table non triée = résultats faux sans erreur !",
      explication: "La correspondance approchée (VRAI) nécessite une table triée",
      solution: "Utilisez FAUX pour une correspondance exacte, ou triez la table"
    },
    {
      erreur: "Chercher dans une colonne autre que la première",
      explication: "RECHERCHEV cherche TOUJOURS dans la 1ère colonne de la table",
      solution: "Réorganisez votre table ou utilisez INDEX+EQUIV"
    }
  ],
  
  "RECHERCHEH": [
    {
      erreur: "Confondre ligne et colonne",
      explication: "RECHERCHEH = Horizontal, cherche dans la 1ère LIGNE",
      solution: "Pour chercher dans une colonne, utilisez RECHERCHEV"
    },
    {
      erreur: "N° de ligne au lieu de colonne",
      explication: "Le 3ème argument est le numéro de LIGNE, pas de colonne",
      solution: "=RECHERCHEH(cherché;table;n°_ligne;FAUX)"
    }
  ],
  
  "INDEX": [
    {
      erreur: "Confondre l'ordre des arguments (ligne, colonne)",
      explication: "INDEX prend d'abord la ligne, puis la colonne",
      solution: "=INDEX(table;n°_ligne;n°_colonne)"
    },
    {
      erreur: "Indices hors limites",
      explication: "La ligne ou colonne demandée n'existe pas dans la plage",
      solution: "Vérifiez que vos indices sont dans les limites de la plage"
    }
  ],
  
  "EQUIV": [
    {
      erreur: "EQUIV renvoie une position, pas une valeur",
      explication: "EQUIV dit OÙ se trouve la valeur, pas CE QU'elle contient",
      solution: "Combinez avec INDEX pour obtenir une valeur"
    },
    {
      erreur: "Oublier le 0 pour correspondance exacte",
      explication: "Sans 3ème argument, EQUIV fait une correspondance approchée",
      solution: "=EQUIV(cherché;plage;0) pour exact"
    },
    {
      erreur: "Plage en 2D au lieu de 1D",
      explication: "EQUIV ne cherche que dans une ligne OU une colonne",
      solution: "Utilisez A1:A10 (colonne) ou A1:J1 (ligne), pas A1:J10"
    }
  ],
  
  "INDEX+EQUIV": [
    {
      erreur: "Mauvaise plage dans INDEX",
      explication: "La plage INDEX doit correspondre à ce que EQUIV va trouver",
      solution: "Si EQUIV cherche en colonne A, INDEX doit être sur la même hauteur"
    },
    {
      erreur: "Décalage d'une ligne entre les plages",
      explication: "Les plages de recherche et de résultat doivent être alignées",
      solution: "A2:A100 et B2:B100 (pas A1:A100 et B2:B100)"
    }
  ],
  
  // ═══════════════════════════════════════════════════════════════
  // TEXTE
  // ═══════════════════════════════════════════════════════════════
  
  "CONCATENER": [
    {
      erreur: "Oublier les espaces entre les éléments",
      explication: "CONCAT colle les textes sans séparateur",
      solution: 'A1&" "&B1 ou CONCAT(A1;" ";B1)'
    },
    {
      erreur: "Concaténer un nombre perd le format",
      explication: "Le nombre 1234.56 devient '1234.56' sans format monétaire",
      solution: "Utilisez TEXTE() pour formater : TEXTE(A1;\"# ##0 €\")"
    }
  ],
  
  "GAUCHE": [
    {
      erreur: "Oublier que les espaces comptent",
      explication: "' Paris' a un espace au début qui compte comme caractère",
      solution: "Utilisez SUPPRESPACE() d'abord si nécessaire"
    }
  ],
  
  "STXT": [
    {
      erreur: "Confondre position et longueur",
      explication: "STXT(texte;départ;longueur) - pas position de fin",
      solution: "=STXT(\"Bonjour\";1;3) → 'Bon' (3 caractères depuis position 1)"
    }
  ],
  
  // ═══════════════════════════════════════════════════════════════
  // DATES
  // ═══════════════════════════════════════════════════════════════
  
  "AUJOURDHUI": [
    {
      erreur: "Oublier que AUJOURDHUI change chaque jour",
      explication: "La fonction se recalcule à chaque ouverture du fichier",
      solution: "Pour figer une date, faites Coller valeurs après"
    }
  ],
  
  "DATEDIF": [
    {
      erreur: "Date de début après date de fin → #NOMBRE!",
      explication: "La 1ère date doit être antérieure à la 2ème",
      solution: "=DATEDIF(date_début;date_fin;\"Y\")"
    },
    {
      erreur: "Code d'unité invalide",
      explication: "Seuls Y, M, D, YM, YD, MD sont valides",
      solution: "Y=années, M=mois totaux, D=jours totaux"
    }
  ],
  
  // ═══════════════════════════════════════════════════════════════
  // RÉFÉRENCES
  // ═══════════════════════════════════════════════════════════════
  
  "Références absolues ($)": [
    {
      erreur: "Oublier de figer avant recopie",
      explication: "Sans $, les références se décalent à la recopie",
      solution: "F4 pour basculer entre A1, $A$1, A$1, $A1"
    },
    {
      erreur: "$ mal placé (avant lettre vs avant chiffre)",
      explication: "$A1 fige la colonne, A$1 fige la ligne",
      solution: "$A$1 = tout figé, $A1 = colonne figée, A$1 = ligne figée"
    },
    {
      erreur: "Tout figer quand mixte suffirait",
      explication: "Parfois on veut figer une seule dimension",
      solution: "Réfléchissez au sens de recopie avant de figer"
    }
  ],
  
  "Références mixtes": [
    {
      erreur: "Confondre $A1 et A$1",
      explication: "$A1 = colonne A fixe, A$1 = ligne 1 fixe",
      solution: "Le $ fige ce qui est APRÈS lui"
    },
    {
      erreur: "Ne pas anticiper le sens de la recopie",
      explication: "La référence dépend de comment vous allez recopier",
      solution: "Si recopie vers la droite : figez la colonne. Vers le bas : figez la ligne"
    }
  ],
  
  // ═══════════════════════════════════════════════════════════════
  // AVANCÉ
  // ═══════════════════════════════════════════════════════════════
  
  "SOMMEPROD": [
    {
      erreur: "Plages de tailles différentes",
      explication: "Toutes les plages doivent avoir exactement les mêmes dimensions",
      solution: "A1:A10 et B1:B10 OK, mais pas A1:A10 et B1:B5"
    },
    {
      erreur: "Oublier les parenthèses autour des conditions",
      explication: "Les conditions doivent être entre parenthèses pour le calcul",
      solution: "=SOMMEPROD((A:A=\"Paris\")*(B:B>100)*C:C)"
    }
  ],
  
  "DECALER": [
    {
      erreur: "Confondre le sens des décalages (+/-)",
      explication: "Positif = vers le bas/droite, Négatif = vers le haut/gauche",
      solution: "DECALER(A1;2;0) = 2 lignes plus bas, DECALER(A1;-1;0) = 1 ligne plus haut"
    },
    {
      erreur: "Plage résultante hors de la feuille",
      explication: "Si le décalage sort de la feuille, erreur #REF!",
      solution: "Vérifiez que la plage résultante existe"
    },
    {
      erreur: "Oublier que DECALER est volatile",
      explication: "DECALER se recalcule à chaque modification, ralentit le fichier",
      solution: "Préférez INDEX pour de meilleures performances"
    }
  ],
  
  "Formules matricielles": [
    {
      erreur: "Oublier Ctrl+Maj+Entrée (anciennes versions)",
      explication: "Avant Excel 365, les formules matricielles nécessitent CSE",
      solution: "Validez avec Ctrl+Maj+Entrée, pas juste Entrée"
    },
    {
      erreur: "Modifier une partie d'une formule matricielle",
      explication: "On ne peut pas modifier une seule cellule d'un résultat matriciel",
      solution: "Sélectionnez toute la plage résultat avant de modifier"
    }
  ],
  
  "Tableaux structurés": [
    {
      erreur: "Mélanger références classiques et structurées",
      explication: "Dans un tableau, préférez [@Colonne] à A2",
      solution: "Utilisez les références structurées de manière cohérente"
    },
    {
      erreur: "Oublier que le tableau s'étend automatiquement",
      explication: "Les nouvelles lignes sont automatiquement incluses",
      solution: "C'est un avantage ! Mais attention si vous ne le voulez pas"
    }
  ],
  
  // ═══════════════════════════════════════════════════════════════
  // VALIDATION & MFC (pour exercices futurs)
  // ═══════════════════════════════════════════════════════════════
  
  "Validation données": [
    {
      erreur: "Plage source de la liste non figée",
      explication: "Si la source bouge, la liste déroulante ne fonctionne plus",
      solution: "Utilisez une plage nommée ou des références absolues"
    },
    {
      erreur: "Oublier d'autoriser les cellules vides",
      explication: "Par défaut, la validation peut bloquer les cellules vides",
      solution: "Cochez 'Ignorer si vide' dans les paramètres"
    }
  ],
  
  "MFC simple": [
    {
      erreur: "Appliquer la MFC sur la mauvaise plage",
      explication: "La mise en forme s'applique à la plage sélectionnée au moment de la création",
      solution: "Sélectionnez d'abord la bonne plage, puis créez la règle"
    },
    {
      erreur: "Trop de règles = illisible",
      explication: "Plusieurs règles peuvent se chevaucher et créer de la confusion",
      solution: "Limitez-vous à 2-3 règles maximum par plage"
    }
  ],
  
  "MFC avancée": [
    {
      erreur: "Oublier de fixer la colonne, pas la ligne ($A1)",
      explication: "Pour appliquer ligne par ligne, fixez la colonne uniquement",
      solution: "=$A1>100 s'applique à chaque ligne indépendamment"
    },
    {
      erreur: "Formule qui s'applique à toute la plage au lieu de ligne par ligne",
      explication: "Une référence $A$1 s'applique à toutes les cellules de la même façon",
      solution: "Utilisez $A1 (colonne fixe, ligne variable)"
    }
  ]
};

/**
 * Obtenir les erreurs fréquentes pour une compétence
 * @param {string} competence - Nom de la compétence
 * @returns {Array} Liste des erreurs avec explications
 */
export function getErreursForCompetence(competence) {
  // Recherche exacte
  if (ERREURS_PAR_COMPETENCE[competence]) {
    return ERREURS_PAR_COMPETENCE[competence];
  }
  
  // Recherche flexible (insensible à la casse, partielle)
  const compUpper = competence.toUpperCase();
  for (const [key, value] of Object.entries(ERREURS_PAR_COMPETENCE)) {
    if (key.toUpperCase() === compUpper || 
        key.toUpperCase().includes(compUpper) ||
        compUpper.includes(key.toUpperCase())) {
      return value;
    }
  }
  
  return [];
}

/**
 * Obtenir toutes les compétences documentées
 * @returns {string[]} Liste des noms de compétences
 */
export function getDocumentedCompetences() {
  return Object.keys(ERREURS_PAR_COMPETENCE);
}

export default ERREURS_PAR_COMPETENCE;
