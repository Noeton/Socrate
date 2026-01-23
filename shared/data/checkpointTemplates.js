/**
 * CHECKPOINT TEMPLATES - v1.0 (Phase 2 - T2.2)
 * 
 * Bibliothèque de templates de checkpoints validés par compétence.
 * Chaque compétence full_auto a 2-4 templates prêts à l'emploi.
 * 
 * OBJECTIF :
 * - Fournir à Claude des structures VALIDÉES plutôt que le laisser inventer
 * - Garantir que computation est toujours correct
 * - Adapter la difficulté selon la progression
 * 
 * UTILISATION :
 * 1. getTemplatesForCompetence(compId) → tous les templates
 * 2. getTemplatesForProgression(compId, exercicesReussis) → templates filtrés par niveau
 * 3. instantiateTemplate(template, context) → template avec variables substituées
 * 
 * VARIABLES SUPPORTÉES :
 * - {COL} : Lettre de colonne (A, B, C...)
 * - {COLUMN_NAME} : Nom de colonne (CA_HT, Région...)
 * - {START} : Ligne de début (généralement 2)
 * - {END} : Ligne de fin (rowCount + 1)
 * - {CRITERIA_VALUE} : Valeur de critère (Paris, 2024...)
 * - {RESULT_CELL} : Cellule de résultat (D102, E50...)
 */

// ═══════════════════════════════════════════════════════════════════════════
// DÉFINITION DES NIVEAUX DE PROGRESSION
// ═══════════════════════════════════════════════════════════════════════════

export const PROGRESSION_LEVELS = {
  discovery: { min: 0, max: 0, label: 'Découverte' },
  learning: { min: 1, max: 2, label: 'Apprentissage' },
  consolidation: { min: 3, max: 4, label: 'Consolidation' },
  mastery: { min: 5, max: 6, label: 'Maîtrise' },
  autonomy: { min: 7, max: Infinity, label: 'Autonomie' }
};

/**
 * Détermine le niveau de progression basé sur les exercices réussis
 */
export function getProgressionLevel(exercicesReussis) {
  if (exercicesReussis === 0) return 'discovery';
  if (exercicesReussis <= 2) return 'learning';
  if (exercicesReussis <= 4) return 'consolidation';
  if (exercicesReussis <= 6) return 'mastery';
  return 'autonomy';
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES PAR COMPÉTENCE
// ═══════════════════════════════════════════════════════════════════════════

export const CHECKPOINT_TEMPLATES = {
  
  // ─────────────────────────────────────────────────────────────────────────
  // SOMME (id: 3)
  // ─────────────────────────────────────────────────────────────────────────
  3: [
    {
      template_id: 'somme_colonne_simple',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Calculer le total de {COLUMN_DESC}',
      fonction: 'SOMME',
      pattern_template: ['SOMME', '{COL}{START}:{COL}{END}'],
      computation_template: { 
        type: 'sum', 
        column: '{COLUMN_NAME}' 
      },
      indices_template: [
        'Tu dois additionner tous les {COLUMN_DESC}. Quelle fonction Excel fait ça ?',
        'Utilise la fonction SOMME sur la colonne {COL}, de la ligne {START} à {END}',
        '=SOMME({COL}{START}:{COL}{END})'
      ],
      erreurs_probables: [
        { type: 'plage_incomplete', message: 'Vérifie que ta plage inclut TOUTES les données' },
        { type: 'reference_circulaire', message: 'Attention à ne pas inclure la cellule de résultat dans la plage' }
      ],
      points_default: 25
    },
    {
      template_id: 'somme_multiple_colonnes',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Calculer le total combiné de {COLUMN_DESC} et {COLUMN_DESC_2}',
      fonction: 'SOMME',
      pattern_template: ['SOMME'],
      computation_template: { 
        type: 'sum', 
        column: '{COLUMN_NAME}' 
      },
      indices_template: [
        'Tu peux additionner plusieurs plages dans une seule SOMME',
        'SOMME peut prendre plusieurs arguments : =SOMME(plage1;plage2)',
        '=SOMME({COL}{START}:{COL}{END};{COL2}{START}:{COL2}{END})'
      ],
      erreurs_probables: [
        { type: 'somme_separee', message: 'Tu peux utiliser une seule formule SOMME avec plusieurs plages' }
      ],
      points_default: 30
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // MOYENNE (id: 4)
  // ─────────────────────────────────────────────────────────────────────────
  4: [
    {
      template_id: 'moyenne_simple',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Calculer la moyenne de {COLUMN_DESC}',
      fonction: 'MOYENNE',
      pattern_template: ['MOYENNE', '{COL}{START}:{COL}{END}'],
      computation_template: { 
        type: 'average', 
        column: '{COLUMN_NAME}' 
      },
      indices_template: [
        'Quelle fonction calcule la moyenne en Excel ?',
        'Utilise MOYENNE sur la colonne {COL}',
        '=MOYENNE({COL}{START}:{COL}{END})'
      ],
      erreurs_probables: [
        { type: 'somme_divise', message: 'Utilise directement MOYENNE, pas besoin de diviser manuellement' },
        { type: 'cellules_vides', message: 'MOYENNE ignore les cellules vides mais pas les 0' }
      ],
      points_default: 25
    },
    {
      template_id: 'moyenne_interpretation',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Calculer et interpréter la moyenne de {COLUMN_DESC}',
      fonction: 'MOYENNE',
      pattern_template: ['MOYENNE'],
      computation_template: { 
        type: 'average', 
        column: '{COLUMN_NAME}' 
      },
      indices_template: [
        'Calcule d\'abord la moyenne, puis compare-la aux valeurs min et max',
        'La moyenne te permettra de voir si la distribution est équilibrée',
        '=MOYENNE({COL}{START}:{COL}{END})'
      ],
      erreurs_probables: [
        { type: 'arrondi_affichage', message: 'L\'affichage peut être arrondi mais la valeur réelle est précise' }
      ],
      points_default: 20
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // MIN/MAX (id: 5)
  // ─────────────────────────────────────────────────────────────────────────
  5: [
    {
      template_id: 'min_simple',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Trouver la valeur minimale de {COLUMN_DESC}',
      fonction: 'MIN',
      pattern_template: ['MIN', '{COL}{START}:{COL}{END}'],
      computation_template: { 
        type: 'min', 
        column: '{COLUMN_NAME}' 
      },
      indices_template: [
        'Quelle fonction trouve la plus petite valeur ?',
        'Utilise MIN sur la colonne {COL}',
        '=MIN({COL}{START}:{COL}{END})'
      ],
      erreurs_probables: [
        { type: 'tri_manuel', message: 'Pas besoin de trier, MIN trouve directement le minimum' }
      ],
      points_default: 20
    },
    {
      template_id: 'max_simple',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Trouver la valeur maximale de {COLUMN_DESC}',
      fonction: 'MAX',
      pattern_template: ['MAX', '{COL}{START}:{COL}{END}'],
      computation_template: { 
        type: 'max', 
        column: '{COLUMN_NAME}' 
      },
      indices_template: [
        'Quelle fonction trouve la plus grande valeur ?',
        'Utilise MAX sur la colonne {COL}',
        '=MAX({COL}{START}:{COL}{END})'
      ],
      erreurs_probables: [
        { type: 'tri_manuel', message: 'Pas besoin de trier, MAX trouve directement le maximum' }
      ],
      points_default: 20
    },
    {
      template_id: 'amplitude_min_max',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Calculer l\'amplitude (écart entre max et min) de {COLUMN_DESC}',
      fonction: 'MAX',
      pattern_template: ['MAX', 'MIN'],
      computation_template: { 
        type: 'manual',
        expected_formula: '=MAX({COL}{START}:{COL}{END})-MIN({COL}{START}:{COL}{END})'
      },
      indices_template: [
        'L\'amplitude = valeur maximale - valeur minimale',
        'Tu peux combiner MAX et MIN dans une seule formule',
        '=MAX({COL}{START}:{COL}{END})-MIN({COL}{START}:{COL}{END})'
      ],
      erreurs_probables: [
        { type: 'ordre_soustraction', message: 'Attention : MAX - MIN, pas l\'inverse (pour avoir un résultat positif)' }
      ],
      points_default: 25
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // NB.SI (id: 11)
  // ─────────────────────────────────────────────────────────────────────────
  11: [
    {
      template_id: 'nbsi_texte_simple',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Compter le nombre de {CRITERIA_VALUE} dans {COLUMN_DESC}',
      fonction: 'NB.SI',
      pattern_template: ['NB.SI', '{COL}', '{CRITERIA_VALUE}'],
      computation_template: { 
        type: 'countif', 
        column: '{COLUMN_NAME}',
        criteria: '{CRITERIA_VALUE}'
      },
      indices_template: [
        'Quelle fonction compte les cellules selon un critère ?',
        'NB.SI prend 2 arguments : la plage et le critère entre guillemets',
        '=NB.SI({COL}{START}:{COL}{END};"{CRITERIA_VALUE}")'
      ],
      erreurs_probables: [
        { type: 'guillemets_manquants', message: 'Le critère texte doit être entre guillemets' },
        { type: 'casse', message: 'NB.SI n\'est pas sensible à la casse (Paris = PARIS)' }
      ],
      points_default: 25
    },
    {
      template_id: 'nbsi_operateur',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Compter les valeurs {OPERATOR} {THRESHOLD} dans {COLUMN_DESC}',
      fonction: 'NB.SI',
      pattern_template: ['NB.SI', '{OPERATOR}'],
      computation_template: { 
        type: 'countif', 
        column: '{COLUMN_NAME}',
        criteria: '{OPERATOR}{THRESHOLD}'
      },
      indices_template: [
        'Tu peux utiliser des opérateurs comme ">", "<", ">=", "<>" dans NB.SI',
        'L\'opérateur ET la valeur doivent être entre guillemets : ">100"',
        '=NB.SI({COL}{START}:{COL}{END};"{OPERATOR}{THRESHOLD}")'
      ],
      erreurs_probables: [
        { type: 'operateur_hors_guillemets', message: 'L\'opérateur doit être DANS les guillemets : ">100" et non > "100"' }
      ],
      points_default: 30
    },
    {
      template_id: 'nbsi_wildcard',
      progression_levels: ['mastery', 'autonomy'],
      type: 'formule',
      description_template: 'Compter les éléments commençant par "{PREFIX}" dans {COLUMN_DESC}',
      fonction: 'NB.SI',
      pattern_template: ['NB.SI', '*'],
      computation_template: { 
        type: 'manual',
        note: 'Wildcard non calculable automatiquement'
      },
      indices_template: [
        'Tu peux utiliser * comme joker pour "n\'importe quoi"',
        '"{PREFIX}*" cherche tout ce qui COMMENCE par {PREFIX}',
        '=NB.SI({COL}{START}:{COL}{END};"{PREFIX}*")'
      ],
      erreurs_probables: [
        { type: 'joker_oublie', message: 'N\'oublie pas * pour représenter "la suite"' }
      ],
      points_default: 25
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // NB.SI.ENS (id: 12)
  // ─────────────────────────────────────────────────────────────────────────
  12: [
    {
      template_id: 'nbsiens_deux_criteres',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Compter les lignes où {COLUMN_DESC} = "{CRITERIA_VALUE}" ET {COLUMN_DESC_2} = "{CRITERIA_VALUE_2}"',
      fonction: 'NB.SI.ENS',
      pattern_template: ['NB.SI.ENS'],
      computation_template: { 
        type: 'countifs', 
        criteria_list: [
          { column: '{COLUMN_NAME}', criteria: '{CRITERIA_VALUE}' },
          { column: '{COLUMN_NAME_2}', criteria: '{CRITERIA_VALUE_2}' }
        ]
      },
      indices_template: [
        'NB.SI.ENS permet d\'avoir plusieurs conditions (ET logique)',
        'Chaque paire plage/critère est séparée par ;',
        '=NB.SI.ENS({COL}{START}:{COL}{END};"{CRITERIA_VALUE}";{COL2}{START}:{COL2}{END};"{CRITERIA_VALUE_2}")'
      ],
      erreurs_probables: [
        { type: 'plages_differentes', message: 'Toutes les plages doivent avoir la même taille' },
        { type: 'confusion_nbsi', message: 'NB.SI.ENS pour plusieurs critères, NB.SI pour un seul' }
      ],
      points_default: 30
    },
    {
      template_id: 'nbsiens_trois_criteres',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Compter avec 3 critères : {COLUMN_DESC}, {COLUMN_DESC_2} et {COLUMN_DESC_3}',
      fonction: 'NB.SI.ENS',
      pattern_template: ['NB.SI.ENS'],
      computation_template: { 
        type: 'countifs', 
        criteria_list: [
          { column: '{COLUMN_NAME}', criteria: '{CRITERIA_VALUE}' },
          { column: '{COLUMN_NAME_2}', criteria: '{CRITERIA_VALUE_2}' },
          { column: '{COLUMN_NAME_3}', criteria: '{CRITERIA_VALUE_3}' }
        ]
      },
      indices_template: [
        'Tu peux ajouter autant de paires plage/critère que nécessaire',
        'Vérifie que les 3 plages ont exactement la même taille',
        '=NB.SI.ENS(plage1;critère1;plage2;critère2;plage3;critère3)'
      ],
      erreurs_probables: [
        { type: 'oubli_critere', message: 'As-tu bien inclus les 3 critères demandés ?' }
      ],
      points_default: 35
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // SOMME.SI (id: 13)
  // ─────────────────────────────────────────────────────────────────────────
  13: [
    {
      template_id: 'sommesi_texte',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Calculer la somme de {SUM_COLUMN_DESC} pour {CRITERIA_VALUE}',
      fonction: 'SOMME.SI',
      pattern_template: ['SOMME.SI', '{CRIT_COL}', '{SUM_COL}'],
      computation_template: { 
        type: 'sumif', 
        criteria_column: '{CRITERIA_COLUMN}',
        criteria: '{CRITERIA_VALUE}',
        sum_column: '{SUM_COLUMN}'
      },
      indices_template: [
        'SOMME.SI additionne les valeurs qui correspondent à un critère',
        'L\'ordre des arguments : plage_critère, critère, plage_somme',
        '=SOMME.SI({CRIT_COL}{START}:{CRIT_COL}{END};"{CRITERIA_VALUE}";{SUM_COL}{START}:{SUM_COL}{END})'
      ],
      erreurs_probables: [
        { type: 'ordre_arguments', message: 'Attention à l\'ordre : plage_critère PUIS critère PUIS plage_somme' },
        { type: 'guillemets_critere', message: 'Le critère texte doit être entre guillemets' }
      ],
      points_default: 30
    },
    {
      template_id: 'sommesi_operateur',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Calculer la somme de {SUM_COLUMN_DESC} où {COLUMN_DESC} {OPERATOR} {THRESHOLD}',
      fonction: 'SOMME.SI',
      pattern_template: ['SOMME.SI', '{OPERATOR}'],
      computation_template: { 
        type: 'sumif', 
        criteria_column: '{CRITERIA_COLUMN}',
        criteria: '{OPERATOR}{THRESHOLD}',
        sum_column: '{SUM_COLUMN}'
      },
      indices_template: [
        'Tu peux utiliser des opérateurs : ">", ">=", "<", "<=", "<>"',
        'L\'opérateur et la valeur sont dans les mêmes guillemets : ">1000"',
        '=SOMME.SI({CRIT_COL}{START}:{CRIT_COL}{END};"{OPERATOR}{THRESHOLD}";{SUM_COL}{START}:{SUM_COL}{END})'
      ],
      erreurs_probables: [
        { type: 'reference_cellule', message: 'Pour référencer une cellule : ">"&A1 (concaténation)' }
      ],
      points_default: 30
    },
    {
      template_id: 'sommesi_meme_plage',
      progression_levels: ['learning', 'consolidation'],
      type: 'formule',
      description_template: 'Sommer {COLUMN_DESC} où la valeur est {OPERATOR} {THRESHOLD}',
      fonction: 'SOMME.SI',
      pattern_template: ['SOMME.SI'],
      computation_template: { 
        type: 'sumif', 
        criteria_column: '{COLUMN_NAME}',
        criteria: '{OPERATOR}{THRESHOLD}',
        sum_column: '{COLUMN_NAME}'
      },
      indices_template: [
        'Quand plage_critère = plage_somme, le 3ème argument est optionnel',
        'Tu peux écrire =SOMME.SI(plage;critère) directement',
        '=SOMME.SI({COL}{START}:{COL}{END};"{OPERATOR}{THRESHOLD}")'
      ],
      erreurs_probables: [
        { type: 'argument_superflu', message: 'Le 3ème argument est optionnel si c\'est la même plage' }
      ],
      points_default: 25
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // SOMME.SI.ENS (id: 14)
  // ─────────────────────────────────────────────────────────────────────────
  14: [
    {
      template_id: 'sommesiens_deux_criteres',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Sommer {SUM_COLUMN_DESC} où {COLUMN_DESC} = "{CRITERIA_VALUE}" ET {COLUMN_DESC_2} = "{CRITERIA_VALUE_2}"',
      fonction: 'SOMME.SI.ENS',
      pattern_template: ['SOMME.SI.ENS'],
      computation_template: { 
        type: 'sumifs', 
        sum_column: '{SUM_COLUMN}',
        criteria_list: [
          { column: '{COLUMN_NAME}', criteria: '{CRITERIA_VALUE}' },
          { column: '{COLUMN_NAME_2}', criteria: '{CRITERIA_VALUE_2}' }
        ]
      },
      indices_template: [
        '⚠️ Dans SOMME.SI.ENS, la plage à sommer est EN PREMIER (contrairement à SOMME.SI)',
        'Ordre : plage_somme ; plage_critère1 ; critère1 ; plage_critère2 ; critère2',
        '=SOMME.SI.ENS({SUM_COL}{START}:{SUM_COL}{END};{COL}{START}:{COL}{END};"{CRITERIA_VALUE}";{COL2}{START}:{COL2}{END};"{CRITERIA_VALUE_2}")'
      ],
      erreurs_probables: [
        { type: 'ordre_arguments_inverse', message: '⚠️ SOMME.SI.ENS : plage_somme EN PREMIER (inverse de SOMME.SI)' },
        { type: 'plages_differentes', message: 'Toutes les plages doivent avoir exactement la même taille' }
      ],
      points_default: 35
    },
    {
      template_id: 'sommesiens_mixte',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Sommer avec un critère texte ET un critère numérique',
      fonction: 'SOMME.SI.ENS',
      pattern_template: ['SOMME.SI.ENS'],
      computation_template: { 
        type: 'sumifs', 
        sum_column: '{SUM_COLUMN}',
        criteria_list: [
          { column: '{COLUMN_NAME}', criteria: '{CRITERIA_VALUE}' },
          { column: '{COLUMN_NAME_2}', criteria: '{OPERATOR}{THRESHOLD}' }
        ]
      },
      indices_template: [
        'Tu peux mélanger critères texte et critères avec opérateurs',
        'Critère texte : "Paris" | Critère numérique : ">1000"',
        '=SOMME.SI.ENS({SUM_COL}:{SUM_COL};{COL}:{COL};"{CRITERIA_VALUE}";{COL2}:{COL2};"{OPERATOR}{THRESHOLD}")'
      ],
      erreurs_probables: [
        { type: 'guillemets_mixtes', message: 'Les deux types de critères nécessitent des guillemets' }
      ],
      points_default: 35
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // RECHERCHEV (id: 18)
  // ─────────────────────────────────────────────────────────────────────────
  18: [
    {
      template_id: 'recherchev_exacte',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Retrouver {RETURN_COLUMN_DESC} correspondant à "{SEARCH_VALUE}"',
      fonction: 'RECHERCHEV',
      pattern_template: ['RECHERCHEV', 'FAUX'],
      computation_template: { 
        type: 'lookup', 
        search_value: '{SEARCH_VALUE}',
        search_column: '{SEARCH_COLUMN}',
        return_column: '{RETURN_COLUMN}',
        approximate: false
      },
      indices_template: [
        'RECHERCHEV cherche une valeur dans la 1ère colonne et retourne une valeur de la même ligne',
        '4 arguments : valeur_cherchée ; table ; n°colonne ; FAUX (exact)',
        '=RECHERCHEV("{SEARCH_VALUE}";{TABLE_RANGE};{COL_INDEX};FAUX)'
      ],
      erreurs_probables: [
        { type: 'colonne_non_premiere', message: 'La valeur cherchée doit être dans la PREMIÈRE colonne de la table' },
        { type: 'vrai_au_lieu_faux', message: 'FAUX = correspondance exacte (ce que tu veux généralement)' },
        { type: 'index_colonne', message: 'L\'index de colonne commence à 1, pas à 0' }
      ],
      points_default: 35
    },
    {
      template_id: 'recherchev_reference',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'RECHERCHEV avec valeur cherchée dans une cellule',
      fonction: 'RECHERCHEV',
      pattern_template: ['RECHERCHEV', '$'],
      computation_template: { 
        type: 'lookup', 
        search_value: '{SEARCH_VALUE}',
        search_column: '{SEARCH_COLUMN}',
        return_column: '{RETURN_COLUMN}',
        approximate: false
      },
      indices_template: [
        'La valeur cherchée peut être une référence de cellule',
        'Fige la table avec $ pour pouvoir recopier la formule',
        '=RECHERCHEV({SEARCH_CELL};$A$1:$C$10;2;FAUX)'
      ],
      erreurs_probables: [
        { type: 'reference_non_figee', message: 'Fige la plage de la table avec $ pour la recopie' }
      ],
      points_default: 30
    },
    {
      template_id: 'recherchev_sierreur',
      progression_levels: ['mastery', 'autonomy'],
      type: 'formule',
      description_template: 'RECHERCHEV avec gestion d\'erreur #N/A',
      fonction: 'SIERREUR',
      pattern_template: ['SIERREUR', 'RECHERCHEV'],
      computation_template: { 
        type: 'manual',
        note: 'SIERREUR enveloppe RECHERCHEV'
      },
      indices_template: [
        'SIERREUR permet d\'afficher un message personnalisé si la valeur n\'est pas trouvée',
        '=SIERREUR(formule; valeur_si_erreur)',
        '=SIERREUR(RECHERCHEV(...); "Non trouvé")'
      ],
      erreurs_probables: [
        { type: 'ordre_arguments', message: 'D\'abord la formule, ensuite la valeur de remplacement' }
      ],
      points_default: 25
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // RECHERCHEV APPROCHÉE (id: 53)
  // ─────────────────────────────────────────────────────────────────────────
  53: [
    {
      template_id: 'recherchev_approchee',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Trouver la tranche correspondant à {SEARCH_VALUE} avec RECHERCHEV approchée',
      fonction: 'RECHERCHEV',
      pattern_template: ['RECHERCHEV', 'VRAI'],
      computation_template: { 
        type: 'lookup_approx', 
        search_value: '{SEARCH_VALUE}',
        search_column: '{SEARCH_COLUMN}',
        return_column: '{RETURN_COLUMN}'
      },
      indices_template: [
        'RECHERCHEV approchée (VRAI) trouve la valeur ≤ à la valeur cherchée',
        '⚠️ La première colonne de la table DOIT être triée par ordre croissant',
        '=RECHERCHEV({SEARCH_VALUE};{TABLE_RANGE};{COL_INDEX};VRAI)'
      ],
      erreurs_probables: [
        { type: 'table_non_triee', message: 'Pour VRAI, la première colonne DOIT être triée par ordre croissant' },
        { type: 'confusion_vrai_faux', message: 'VRAI = approché (tranches), FAUX = exact' }
      ],
      points_default: 35
    },
    {
      template_id: 'recherchev_bareme',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Appliquer un barème avec RECHERCHEV approchée',
      fonction: 'RECHERCHEV',
      pattern_template: ['RECHERCHEV'],
      computation_template: { 
        type: 'lookup_approx', 
        search_value: '{SEARCH_VALUE}',
        search_column: '{SEARCH_COLUMN}',
        return_column: '{RETURN_COLUMN}'
      },
      indices_template: [
        'Un barème a des seuils : 0-10 = F, 10-12 = E, 12-14 = D...',
        'La table de barème doit commencer par le seuil le plus bas (0)',
        '=RECHERCHEV(note;$A$1:$B$6;2;VRAI)'
      ],
      erreurs_probables: [
        { type: 'premier_seuil', message: 'Le premier seuil de la table doit être le plus petit possible (souvent 0)' }
      ],
      points_default: 30
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // INDEX+EQUIV (id: 24)
  // ─────────────────────────────────────────────────────────────────────────
  24: [
    {
      template_id: 'index_equiv_basique',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Retrouver {RETURN_COLUMN_DESC} avec INDEX+EQUIV',
      fonction: 'INDEX',
      pattern_template: ['INDEX', 'EQUIV'],
      computation_template: { 
        type: 'index_match', 
        search_value: '{SEARCH_VALUE}',
        search_column: '{SEARCH_COLUMN}',
        return_column: '{RETURN_COLUMN}'
      },
      indices_template: [
        'INDEX retourne une valeur à une position, EQUIV trouve cette position',
        'INDEX(plage_retour ; EQUIV(valeur_cherchée ; plage_recherche ; 0))',
        '=INDEX({RET_COL}{START}:{RET_COL}{END};EQUIV("{SEARCH_VALUE}";{SEARCH_COL}{START}:{SEARCH_COL}{END};0))'
      ],
      erreurs_probables: [
        { type: 'equiv_type', message: 'Le 3ème argument de EQUIV : 0 = exact, 1 = approché croissant, -1 = approché décroissant' },
        { type: 'plages_alignees', message: 'Les deux plages doivent avoir le même nombre de lignes' }
      ],
      points_default: 40
    },
    {
      template_id: 'index_equiv_inverse',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Recherche inverse avec INDEX+EQUIV (valeur à gauche)',
      fonction: 'INDEX',
      pattern_template: ['INDEX', 'EQUIV'],
      computation_template: { 
        type: 'index_match', 
        search_value: '{SEARCH_VALUE}',
        search_column: '{SEARCH_COLUMN}',
        return_column: '{RETURN_COLUMN}'
      },
      indices_template: [
        'Contrairement à RECHERCHEV, INDEX+EQUIV peut chercher à droite et retourner à gauche',
        'La colonne de recherche peut être n\'importe où dans la table',
        '=INDEX(colonne_retour;EQUIV(valeur;colonne_recherche;0))'
      ],
      erreurs_probables: [
        { type: 'limitation_recherchev', message: 'C\'est l\'avantage d\'INDEX+EQUIV : pas de contrainte sur la position des colonnes' }
      ],
      points_default: 35
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // SI SIMPLE (id: 9)
  // ─────────────────────────────────────────────────────────────────────────
  9: [
    {
      template_id: 'si_simple',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Afficher "{VALUE_TRUE}" si {COLUMN_DESC} {OPERATOR} {THRESHOLD}, sinon "{VALUE_FALSE}"',
      fonction: 'SI',
      pattern_template: ['SI'],
      computation_template: { 
        type: 'conditional', 
        column: '{COLUMN_NAME}',
        condition: '{OPERATOR}{THRESHOLD}',
        value_if_true: '{VALUE_TRUE}',
        value_if_false: '{VALUE_FALSE}'
      },
      indices_template: [
        'SI teste une condition et retourne une valeur différente selon le résultat',
        '=SI(condition ; valeur_si_vrai ; valeur_si_faux)',
        '=SI({CELL}{OPERATOR}{THRESHOLD};"{VALUE_TRUE}";"{VALUE_FALSE}")'
      ],
      erreurs_probables: [
        { type: 'guillemets_texte', message: 'Les valeurs texte doivent être entre guillemets' },
        { type: 'point_virgule', message: 'En français, utilise ; pour séparer les arguments (pas ,)' }
      ],
      points_default: 25
    },
    {
      template_id: 'si_calcul',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Calculer différemment selon une condition',
      fonction: 'SI',
      pattern_template: ['SI'],
      computation_template: { 
        type: 'manual',
        note: 'Calcul conditionnel avec formules'
      },
      indices_template: [
        'Les valeurs si_vrai et si_faux peuvent être des formules',
        'Ex: =SI(A1>100; A1*0.1; 0) applique 10% seulement si > 100',
        '=SI(condition; calcul_si_vrai; calcul_si_faux)'
      ],
      erreurs_probables: [
        { type: 'parentheses', message: 'Vérifie que les parenthèses sont bien fermées' }
      ],
      points_default: 30
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // SI IMBRIQUÉS (id: 16)
  // ─────────────────────────────────────────────────────────────────────────
  16: [
    {
      template_id: 'si_imbrique_deux_niveaux',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Classer en 3 catégories selon {COLUMN_DESC}',
      fonction: 'SI',
      pattern_template: ['SI', 'SI'],
      computation_template: { 
        type: 'manual',
        note: 'SI imbriqués à 2 niveaux'
      },
      indices_template: [
        'Pour 3 résultats possibles, il faut 2 SI (n-1 SI pour n résultats)',
        'Commence par le test le plus restrictif',
        '=SI(A1>=80;"Excellent";SI(A1>=50;"Moyen";"Faible"))'
      ],
      erreurs_probables: [
        { type: 'ordre_conditions', message: 'Teste d\'abord la condition la plus restrictive (la plus haute)' },
        { type: 'parentheses_oubliees', message: 'Chaque SI a besoin de sa parenthèse fermante' }
      ],
      points_default: 35
    },
    {
      template_id: 'si_imbrique_trois_niveaux',
      progression_levels: ['consolidation', 'mastery'],
      type: 'formule',
      description_template: 'Classer en 4 catégories avec SI imbriqués',
      fonction: 'SI',
      pattern_template: ['SI'],
      computation_template: { 
        type: 'manual',
        note: 'SI imbriqués à 3 niveaux'
      },
      indices_template: [
        'Pour 4 catégories : SI(test1 ; res1 ; SI(test2 ; res2 ; SI(test3 ; res3 ; res4)))',
        'Dessine un arbre de décision si tu te perds',
        '=SI(A1>=90;"A";SI(A1>=80;"B";SI(A1>=70;"C";"D")))'
      ],
      erreurs_probables: [
        { type: 'trop_imbrications', message: 'Au-delà de 3 niveaux, considère SI.CONDITIONS ou RECHERCHEV approchée' }
      ],
      points_default: 40
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // MOYENNE.SI (id: 21)
  // ─────────────────────────────────────────────────────────────────────────
  21: [
    {
      template_id: 'moyennesi_simple',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Calculer la moyenne de {AVG_COLUMN_DESC} pour {CRITERIA_VALUE}',
      fonction: 'MOYENNE.SI',
      pattern_template: ['MOYENNE.SI'],
      computation_template: { 
        type: 'averageif', 
        criteria_column: '{CRITERIA_COLUMN}',
        criteria: '{CRITERIA_VALUE}',
        average_column: '{AVERAGE_COLUMN}'
      },
      indices_template: [
        'MOYENNE.SI calcule la moyenne des cellules qui correspondent au critère',
        'Même syntaxe que SOMME.SI : plage_critère ; critère ; plage_moyenne',
        '=MOYENNE.SI({CRIT_COL}{START}:{CRIT_COL}{END};"{CRITERIA_VALUE}";{AVG_COL}{START}:{AVG_COL}{END})'
      ],
      erreurs_probables: [
        { type: 'confusion_sommesi', message: 'MOYENNE.SI calcule une moyenne, pas une somme' }
      ],
      points_default: 30
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // SOMMEPROD (id: 28)
  // ─────────────────────────────────────────────────────────────────────────
  28: [
    {
      template_id: 'sommeprod_simple',
      progression_levels: ['discovery', 'learning'],
      type: 'formule',
      description_template: 'Calculer le total pondéré avec SOMMEPROD',
      fonction: 'SOMMEPROD',
      pattern_template: ['SOMMEPROD'],
      computation_template: { 
        type: 'sumproduct', 
        columns: ['{COLUMN_NAME}', '{COLUMN_NAME_2}']
      },
      indices_template: [
        'SOMMEPROD multiplie les éléments correspondants de plusieurs plages puis additionne',
        'Utile pour : quantité × prix, heures × taux, etc.',
        '=SOMMEPROD({COL}{START}:{COL}{END};{COL2}{START}:{COL2}{END})'
      ],
      erreurs_probables: [
        { type: 'plages_differentes', message: 'Les plages doivent avoir exactement la même taille' },
        { type: 'multiplication_manuelle', message: 'Pas besoin de créer une colonne intermédiaire' }
      ],
      points_default: 35
    },
    {
      template_id: 'sommeprod_conditionnel',
      progression_levels: ['mastery', 'autonomy'],
      type: 'formule',
      description_template: 'SOMMEPROD avec condition (alternative à SOMME.SI.ENS)',
      fonction: 'SOMMEPROD',
      pattern_template: ['SOMMEPROD', '='],
      computation_template: { 
        type: 'manual',
        note: 'SOMMEPROD conditionnel avancé'
      },
      indices_template: [
        'SOMMEPROD peut inclure des conditions : (plage="critère")*plage_somme',
        'Les conditions retournent 1 (vrai) ou 0 (faux)',
        '=SOMMEPROD((A:A="Paris")*(B:B>100)*C:C)'
      ],
      erreurs_probables: [
        { type: 'syntaxe', message: 'Les conditions sont entre parenthèses et multipliées' }
      ],
      points_default: 40
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // MFC SIMPLE - Mise en Forme Conditionnelle (id: 10)
  // Type: semi_auto (nécessite validation visuelle)
  // ─────────────────────────────────────────────────────────────────────────
  10: [
    {
      template_id: 'mfc_color_scale_vert_rouge',
      progression_levels: ['discovery', 'learning'],
      type: 'format',
      subtype: 'mfc',
      description_template: 'Appliquer une échelle de couleurs sur la colonne {COLUMN_DESC} (vert = bas, rouge = haut)',
      expected: {
        mfc_type: 'color_scale',
        target_column: '{COL}',
        color_scale: {
          min_color: 'vert',
          max_color: 'rouge'
        }
      },
      indices_template: [
        'La mise en forme conditionnelle permet de visualiser les données avec des couleurs.',
        'Sélectionne la colonne {COL}, puis Accueil > Mise en forme conditionnelle > Échelles de couleurs.',
        'Choisis "Vert - Jaune - Rouge" : les petites valeurs seront vertes, les grandes rouges.'
      ],
      erreurs_probables: [
        { type: 'mauvaise_plage', message: 'Assure-toi de sélectionner uniquement les données, pas les en-têtes' },
        { type: 'echelle_inversee', message: 'Vérifie que vert = minimum et rouge = maximum' }
      ],
      points_default: 25
    },
    {
      template_id: 'mfc_databar_bleu',
      progression_levels: ['learning', 'consolidation'],
      type: 'format',
      subtype: 'mfc',
      description_template: 'Ajouter des barres de données bleues sur la colonne {COLUMN_DESC}',
      expected: {
        mfc_type: 'databar',
        target_column: '{COL}',
        databar: {
          color: 'bleu'
        }
      },
      indices_template: [
        'Les barres de données montrent la valeur relative de chaque cellule.',
        'Sélectionne {COL}{START}:{COL}{END}, Mise en forme conditionnelle > Barres de données.',
        'Choisis "Remplissage uni" en bleu pour une visualisation claire.'
      ],
      erreurs_probables: [
        { type: 'couleur_incorrecte', message: 'La consigne demandait des barres bleues' }
      ],
      points_default: 25
    },
    {
      template_id: 'mfc_highlight_superieur',
      progression_levels: ['discovery', 'learning'],
      type: 'format',
      subtype: 'mfc',
      description_template: 'Mettre en surbrillance verte les valeurs de {COLUMN_DESC} supérieures à {THRESHOLD}',
      expected: {
        mfc_type: 'cell_value',
        target_column: '{COL}',
        cell_value: {
          condition: '>=',
          threshold: '{THRESHOLD}',
          format: { background: 'vert' }
        }
      },
      indices_template: [
        'Tu dois mettre en évidence les cellules qui dépassent un certain seuil.',
        'Utilise : Mise en forme conditionnelle > Règles de mise en surbrillance > Supérieur à...',
        'Entre {THRESHOLD} comme valeur et choisis un remplissage vert.'
      ],
      erreurs_probables: [
        { type: 'mauvais_operateur', message: 'Vérifie que tu utilises "supérieur à" et pas "égal à"' },
        { type: 'couleur_incorrecte', message: 'La mise en forme devrait être verte' }
      ],
      points_default: 20
    },
    {
      template_id: 'mfc_iconset_fleches',
      progression_levels: ['consolidation', 'mastery'],
      type: 'format',
      subtype: 'mfc',
      description_template: 'Ajouter des icônes de flèches sur la colonne {COLUMN_DESC} pour indiquer la tendance',
      expected: {
        mfc_type: 'iconset',
        target_column: '{COL}',
        iconset: {
          type: 'arrows',
          count: 3
        }
      },
      indices_template: [
        'Les jeux d\'icônes permettent de visualiser rapidement les performances.',
        'Sélectionne les données, Mise en forme conditionnelle > Jeux d\'icônes > Flèches directionnelles.',
        'Par défaut : flèche verte haut (top 33%), orange droite (middle), rouge bas (bottom 33%).'
      ],
      erreurs_probables: [
        { type: 'mauvais_type', message: 'Utilise les flèches, pas les feux tricolores ou étoiles' }
      ],
      points_default: 30
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // MFC AVANCÉE (id: 25)
  // Type: semi_auto
  // ─────────────────────────────────────────────────────────────────────────
  25: [
    {
      template_id: 'mfc_top10',
      progression_levels: ['discovery', 'learning'],
      type: 'format',
      subtype: 'mfc',
      description_template: 'Mettre en évidence les 5 meilleures valeurs de {COLUMN_DESC}',
      expected: {
        mfc_type: 'top10',
        target_column: '{COL}',
        top10: {
          count: 5,
          type: 'top'
        }
      },
      indices_template: [
        'Excel peut automatiquement identifier les N premières valeurs.',
        'Mise en forme conditionnelle > Règles des valeurs plus/moins élevées > 10 valeurs les plus élevées.',
        'Change le "10" en "5" pour sélectionner les 5 meilleures.'
      ],
      erreurs_probables: [
        { type: 'mauvais_nombre', message: 'Tu dois mettre en évidence exactement 5 valeurs, pas 10' }
      ],
      points_default: 25
    },
    {
      template_id: 'mfc_above_average',
      progression_levels: ['learning', 'consolidation'],
      type: 'format',
      subtype: 'mfc',
      description_template: 'Mettre en surbrillance les valeurs de {COLUMN_DESC} supérieures à la moyenne',
      expected: {
        mfc_type: 'above_average',
        target_column: '{COL}'
      },
      indices_template: [
        'Excel peut comparer automatiquement chaque valeur à la moyenne.',
        'Mise en forme conditionnelle > Règles des valeurs plus/moins élevées > Au-dessus de la moyenne.',
        'Toutes les cellules au-dessus de la moyenne seront mises en forme.'
      ],
      erreurs_probables: [
        { type: 'calcul_manuel', message: 'Pas besoin de calculer la moyenne manuellement' }
      ],
      points_default: 25
    },
    {
      template_id: 'mfc_doublons',
      progression_levels: ['consolidation', 'mastery'],
      type: 'format',
      subtype: 'mfc',
      description_template: 'Identifier les doublons dans la colonne {CRITERIA_COLUMN}',
      expected: {
        mfc_type: 'unique_values',
        target_column: '{CRIT_COL}',
        unique_values: {
          highlight: 'duplicates'
        }
      },
      indices_template: [
        'La MFC peut identifier automatiquement les valeurs en double.',
        'Mise en forme conditionnelle > Règles de mise en surbrillance > Valeurs en double.',
        'Les doublons seront automatiquement mis en évidence.'
      ],
      erreurs_probables: [
        { type: 'confusion_unique', message: 'Tu dois trouver les doublons, pas les valeurs uniques' }
      ],
      points_default: 30
    },
    {
      template_id: 'mfc_formule_personnalisee',
      progression_levels: ['mastery', 'autonomy'],
      type: 'format',
      subtype: 'mfc',
      description_template: 'Créer une règle de mise en forme basée sur une formule pour colorer les lignes selon {CRITERIA_COLUMN}',
      expected: {
        mfc_type: 'formula',
        formula_pattern: '${CRIT_COL}2="{CRITERIA_VALUE}"'
      },
      indices_template: [
        'Les règles basées sur formule offrent un contrôle total sur la mise en forme.',
        'Mise en forme conditionnelle > Nouvelle règle > Utiliser une formule.',
        'La formule doit commencer par = et retourner VRAI/FAUX. Ex: =$A2="Paris"'
      ],
      erreurs_probables: [
        { type: 'reference_absolue', message: 'Utilise $ sur la colonne mais pas sur la ligne ($A2, pas $A$2)' },
        { type: 'egal_manquant', message: 'N\'oublie pas le = au début de la formule' }
      ],
      points_default: 35
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // GRAPHIQUES SIMPLES (id: 26)
  // Type: semi_auto (nécessite validation visuelle)
  // ─────────────────────────────────────────────────────────────────────────
  26: [
    {
      template_id: 'graph_histogram_simple',
      progression_levels: ['discovery', 'learning'],
      type: 'graphique',
      description_template: 'Créer un histogramme montrant {COLUMN_DESC} par {CRITERIA_COLUMN}',
      expected: {
        graph_type: 'histogramme',
        has_title: true,
        has_legend: false,
        data_series: 1
      },
      indices_template: [
        'Un histogramme (graphique en barres) est parfait pour comparer des valeurs par catégorie.',
        'Sélectionne tes données (colonnes {CRIT_COL} et {COL}), puis Insertion > Graphiques > Histogramme.',
        'Choisis "Histogramme groupé", puis ajoute un titre en cliquant sur le graphique > Éléments de graphique > Titre.'
      ],
      erreurs_probables: [
        { type: 'mauvaise_selection', message: 'Sélectionne les colonnes catégorie ET valeurs ensemble' },
        { type: 'titre_manquant', message: 'N\'oublie pas d\'ajouter un titre au graphique' },
        { type: 'mauvais_type', message: 'On demande un histogramme (barres verticales), pas un camembert' }
      ],
      points_default: 30
    },
    {
      template_id: 'graph_pie_repartition',
      progression_levels: ['learning', 'consolidation'],
      type: 'graphique',
      description_template: 'Créer un camembert montrant la répartition de {COLUMN_DESC} par {CRITERIA_COLUMN}',
      expected: {
        graph_type: 'camembert',
        has_title: true,
        has_legend: true
      },
      indices_template: [
        'Un graphique en secteurs (camembert) montre les proportions d\'un tout.',
        'Sélectionne les données, Insertion > Graphiques > Secteurs > Secteurs 2D.',
        'Ajoute un titre et vérifie que la légende est visible pour identifier chaque part.'
      ],
      erreurs_probables: [
        { type: 'trop_categories', message: 'Un camembert fonctionne mieux avec 3-7 catégories' },
        { type: 'legende_absente', message: 'Ajoute une légende pour identifier les parts' }
      ],
      points_default: 30
    },
    {
      template_id: 'graph_line_evolution',
      progression_levels: ['consolidation', 'mastery'],
      type: 'graphique',
      description_template: 'Créer un graphique en courbe montrant l\'évolution de {COLUMN_DESC}',
      expected: {
        graph_type: 'courbe',
        has_title: true,
        has_legend: true,
        axis_labels: {
          x: '{CRITERIA_COLUMN}',
          y: '{COLUMN_NAME}'
        }
      },
      indices_template: [
        'Un graphique en courbe montre l\'évolution dans le temps.',
        'Sélectionne les données, Insertion > Graphiques > Courbes > Courbes avec marqueurs.',
        'Ajoute un titre, une légende, et des titres d\'axes pour une lecture claire.'
      ],
      erreurs_probables: [
        { type: 'axes_non_labels', message: 'Ajoute des titres aux axes X et Y' },
        { type: 'echelle_inappropriee', message: 'Vérifie que l\'axe Y commence à une valeur adaptée' }
      ],
      points_default: 35
    },
    {
      template_id: 'graph_histogram_compare',
      progression_levels: ['mastery', 'autonomy'],
      type: 'graphique',
      description_template: 'Créer un histogramme groupé comparant {COLUMN_DESC} et {COLUMN_DESC_2} par {CRITERIA_COLUMN}',
      expected: {
        graph_type: 'histogramme',
        has_title: true,
        has_legend: true,
        data_series: 2
      },
      indices_template: [
        'Un histogramme groupé permet de comparer plusieurs séries de données.',
        'Sélectionne les 3 colonnes (catégorie + 2 séries), puis Insertion > Histogramme groupé.',
        'La légende différenciera les deux séries de données.'
      ],
      erreurs_probables: [
        { type: 'series_empilees', message: 'Choisis "groupé" et non "empilé" pour comparer côte à côte' },
        { type: 'couleurs_similaires', message: 'Utilise des couleurs bien distinctes pour chaque série' }
      ],
      points_default: 35
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // GRAPHIQUES COMBINÉS (id: 32)
  // Type: semi_auto
  // ─────────────────────────────────────────────────────────────────────────
  32: [
    {
      template_id: 'graph_combo_bar_line',
      progression_levels: ['discovery', 'learning'],
      type: 'graphique',
      description_template: 'Créer un graphique combiné avec barres pour {COLUMN_DESC} et courbe pour {COLUMN_DESC_2}',
      expected: {
        graph_type: 'mixte',
        has_title: true,
        has_legend: true,
        data_series: 2
      },
      indices_template: [
        'Un graphique combiné mélange plusieurs types (barres + courbe).',
        'Crée d\'abord un histogramme, puis sélectionne une série > Clic droit > Modifier le type de série.',
        'Change le type de la 2ème série en "Courbe" pour créer l\'effet combiné.'
      ],
      erreurs_probables: [
        { type: 'meme_type', message: 'Les deux séries doivent avoir des types différents (barres ET courbe)' },
        { type: 'axe_secondaire', message: 'Si les échelles sont très différentes, utilise un axe secondaire' }
      ],
      points_default: 40
    },
    {
      template_id: 'graph_combo_dual_axis',
      progression_levels: ['mastery', 'autonomy'],
      type: 'graphique',
      description_template: 'Créer un graphique à double axe Y pour comparer {COLUMN_DESC} (barres, axe gauche) et {COLUMN_DESC_2} (courbe, axe droit)',
      expected: {
        graph_type: 'mixte',
        has_title: true,
        has_legend: true,
        data_series: 2,
        dual_axis: true
      },
      indices_template: [
        'Un double axe Y permet de comparer des données d\'échelles très différentes.',
        'Après avoir créé le graphique combiné, sélectionne la courbe > Format > Axe secondaire.',
        'Tu verras deux échelles Y : gauche pour les barres, droite pour la courbe.'
      ],
      erreurs_probables: [
        { type: 'echelles_confondues', message: 'Vérifie que chaque série utilise le bon axe Y' },
        { type: 'lisibilite', message: 'Ajoute des titres d\'axes pour expliquer les deux échelles' }
      ],
      points_default: 45
    }
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // GRAPHIQUES DYNAMIQUES (id: 33)
  // Type: semi_auto
  // ─────────────────────────────────────────────────────────────────────────
  33: [
    {
      template_id: 'graph_dynamic_table',
      progression_levels: ['discovery', 'learning'],
      type: 'graphique',
      description_template: 'Créer un graphique basé sur un tableau structuré qui s\'adapte automatiquement',
      expected: {
        graph_type: 'histogramme',
        has_title: true,
        dynamic: true
      },
      indices_template: [
        'Un graphique basé sur un tableau Excel s\'adapte automatiquement quand on ajoute des données.',
        'Convertis d\'abord tes données en tableau : Sélection > Insertion > Tableau.',
        'Puis crée le graphique normalement. Il s\'actualisera automatiquement.'
      ],
      erreurs_probables: [
        { type: 'plage_fixe', message: 'Le graphique doit référencer le tableau, pas une plage fixe' }
      ],
      points_default: 35
    },
    {
      template_id: 'graph_dynamic_named_range',
      progression_levels: ['mastery', 'autonomy'],
      type: 'graphique',
      description_template: 'Créer un graphique utilisant une plage nommée dynamique',
      expected: {
        graph_type: 'courbe',
        has_title: true,
        dynamic: true,
        uses_named_range: true
      },
      indices_template: [
        'Une plage nommée dynamique utilise DECALER et NB pour s\'adapter.',
        'Formules > Gestionnaire de noms > Nouveau > Fait référence à : =DECALER(Feuil1!$A$2;0;0;NB(Feuil1!$A:$A)-1;1)',
        'Utilise ce nom dans la source de données du graphique.'
      ],
      erreurs_probables: [
        { type: 'formule_decaler', message: 'La formule DECALER doit calculer correctement le nombre de lignes' },
        { type: 'reference_invalide', message: 'Vérifie que le nom est correctement utilisé dans le graphique' }
      ],
      points_default: 45
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupère tous les templates pour une compétence
 * @param {number} compId - ID de la compétence
 * @returns {Array} Templates disponibles
 */
export function getTemplatesForCompetence(compId) {
  return CHECKPOINT_TEMPLATES[compId] || [];
}

/**
 * Récupère les templates adaptés au niveau de progression
 * @param {number} compId - ID de la compétence
 * @param {number} exercicesReussis - Nombre d'exercices réussis sur cette compétence
 * @returns {Array} Templates filtrés
 */
export function getTemplatesForProgression(compId, exercicesReussis) {
  const templates = getTemplatesForCompetence(compId);
  const level = getProgressionLevel(exercicesReussis);
  
  return templates.filter(t => 
    t.progression_levels.includes(level)
  );
}

/**
 * Instancie un template avec les valeurs du contexte
 * @param {Object} template - Template à instancier
 * @param {Object} context - Contexte avec les valeurs
 * @returns {Object} Checkpoint prêt à l'emploi
 */
export function instantiateTemplate(template, context) {
  const {
    stats,
    rowCount,
    targetCell,
    checkpointIndex
  } = context;
  
  const dataEndRow = rowCount + 1;
  
  // Sélectionner les colonnes selon le template
  const numericCols = stats.numericColumns || [];
  const textCols = stats.textColumns || [];
  
  // Colonne numérique principale
  const numCol = numericCols[0] || { name: 'Montant', letter: 'D' };
  const numCol2 = numericCols[1] || numCol;
  
  // Colonne texte principale  
  const textCol = textCols[0] || { name: 'Catégorie', letter: 'A' };
  const textCol2 = textCols[1] || textCol;
  
  // Valeur de critère
  const criteriaValue = textCol.mostCommon?.[0]?.value || 
                        textCol.uniqueValues?.[0] || 
                        'Valeur';
  const criteriaValue2 = textCol2.mostCommon?.[0]?.value || 
                         textCol2.uniqueValues?.[0] || 
                         'Autre';
  
  // Substitutions
  const substitutions = {
    '{COL}': numCol.letter,
    '{COL2}': numCol2.letter,
    '{COLUMN_NAME}': numCol.name,
    '{COLUMN_NAME_2}': numCol2.name,
    '{COLUMN_DESC}': numCol.name.toLowerCase(),
    '{COLUMN_DESC_2}': numCol2.name.toLowerCase(),
    '{START}': '2',
    '{END}': String(dataEndRow),
    '{CRIT_COL}': textCol.letter,
    '{SUM_COL}': numCol.letter,
    '{CRITERIA_COLUMN}': textCol.name,
    '{CRITERIA_VALUE}': criteriaValue,
    '{CRITERIA_VALUE_2}': criteriaValue2,
    '{SUM_COLUMN}': numCol.name,
    '{SUM_COLUMN_DESC}': numCol.name.toLowerCase(),
    '{SEARCH_COLUMN}': textCol.name,
    '{SEARCH_VALUE}': criteriaValue,
    '{RETURN_COLUMN}': numCol.name,
    '{RETURN_COLUMN_DESC}': numCol.name.toLowerCase(),
    '{AVERAGE_COLUMN}': numCol.name,
    '{AVG_COLUMN_DESC}': numCol.name.toLowerCase(),
    '{AVG_COL}': numCol.letter,
    '{SEARCH_COL}': textCol.letter,
    '{RET_COL}': numCol.letter,
    '{OPERATOR}': '>',
    '{THRESHOLD}': '100',
    '{VALUE_TRUE}': 'Oui',
    '{VALUE_FALSE}': 'Non',
    '{CELL}': targetCell || 'A2',
    '{TABLE_RANGE}': `${textCol.letter}2:${numCol2.letter}${dataEndRow}`,
    '{COL_INDEX}': '2'
  };
  
  // Fonction de substitution récursive
  const substitute = (value) => {
    if (typeof value === 'string') {
      let result = value;
      for (const [key, replacement] of Object.entries(substitutions)) {
        result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), replacement);
      }
      return result;
    }
    if (Array.isArray(value)) {
      return value.map(substitute);
    }
    if (typeof value === 'object' && value !== null) {
      const result = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = substitute(v);
      }
      return result;
    }
    return value;
  };
  
  // Construire le checkpoint
  const checkpoint = {
    id: `cp_${checkpointIndex || 1}`,
    cellule: targetCell || `D${dataEndRow + 2}`,
    type: template.type,
    description: substitute(template.description_template),
    competence_id: parseInt(Object.keys(CHECKPOINT_TEMPLATES).find(
      id => CHECKPOINT_TEMPLATES[id].includes(template)
    )),
    fonction: template.fonction,
    pattern: substitute(template.pattern_template),
    computation: substitute(template.computation_template),
    points: template.points_default,
    indices: substitute(template.indices_template),
    erreurs_probables: template.erreurs_probables || []
  };
  
  return checkpoint;
}

/**
 * Génère un ensemble de checkpoints à partir de templates
 * @param {number} compId - ID de la compétence
 * @param {Object} context - Contexte (stats, rowCount, etc.)
 * @param {number} count - Nombre de checkpoints souhaités
 * @returns {Array} Checkpoints générés
 */
export function generateCheckpointsFromTemplates(compId, context, count = 3) {
  const { exercicesReussis = 0 } = context;
  const templates = getTemplatesForProgression(compId, exercicesReussis);
  
  if (templates.length === 0) {
    console.warn(`Aucun template pour compétence ${compId} au niveau ${getProgressionLevel(exercicesReussis)}`);
    return [];
  }
  
  const checkpoints = [];
  const usedTemplates = new Set();
  
  for (let i = 0; i < count && i < templates.length; i++) {
    // Sélectionner un template non utilisé
    let template = templates.find(t => !usedTemplates.has(t.template_id));
    if (!template) {
      template = templates[i % templates.length]; // Réutiliser si nécessaire
    }
    usedTemplates.add(template.template_id);
    
    // Calculer la cellule cible
    const rowCount = context.rowCount || 50;
    const targetRow = rowCount + 3 + i;
    const targetCell = `D${targetRow}`;
    
    const checkpoint = instantiateTemplate(template, {
      ...context,
      targetCell,
      checkpointIndex: i + 1
    });
    
    checkpoints.push(checkpoint);
  }
  
  // Ajuster les points pour totaliser 100
  const totalPoints = checkpoints.reduce((sum, cp) => sum + cp.points, 0);
  if (totalPoints !== 100 && checkpoints.length > 0) {
    const factor = 100 / totalPoints;
    checkpoints.forEach(cp => {
      cp.points = Math.round(cp.points * factor);
    });
    // Ajuster le dernier pour exactement 100
    const currentTotal = checkpoints.reduce((sum, cp) => sum + cp.points, 0);
    checkpoints[checkpoints.length - 1].points += (100 - currentTotal);
  }
  
  return checkpoints;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  CHECKPOINT_TEMPLATES,
  PROGRESSION_LEVELS,
  getProgressionLevel,
  getTemplatesForCompetence,
  getTemplatesForProgression,
  instantiateTemplate,
  generateCheckpointsFromTemplates
};
