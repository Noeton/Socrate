/**
 * PROGRESSIVE FEEDBACK SYSTEM - v1.0 (Phase 3 - T3.2)
 * 
 * Système de feedback intelligent qui s'adapte :
 * - Au nombre de tentatives (plus précis à chaque essai)
 * - Au type d'erreur détectée (fonction, plage, syntaxe...)
 * - Au profil de l'apprenant (débutant vs avancé)
 * - À la personnalité du manager dans l'exercice
 * 
 * PRINCIPES PÉDAGOGIQUES :
 * 1. Tentative 1 : Feedback VAGUE (direction générale)
 * 2. Tentative 2 : Feedback PRÉCIS (éléments spécifiques)
 * 3. Tentative 3+ : Feedback SOLUTION (presque la réponse)
 * 4. Adapter le ton selon la personnalité
 */

import { 
  FUNCTION_MAPPING_FR_TO_EN, 
  FUNCTION_MAPPING_EN_TO_FR,
  containsFunction 
} from '../../../shared/utils/formulaNormalizer.js';

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION DES ERREURS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Types d'erreurs détectables dans les formules
 */
export const ERROR_TYPES = {
  // Erreurs de fonction
  MISSING_FUNCTION: 'missing_function',
  WRONG_FUNCTION: 'wrong_function',
  FUNCTION_TYPO: 'function_typo',
  
  // Erreurs de syntaxe
  MISSING_EQUALS: 'missing_equals',
  UNBALANCED_PARENS: 'unbalanced_parens',
  WRONG_SEPARATOR: 'wrong_separator',
  MISSING_QUOTES: 'missing_quotes',
  
  // Erreurs de plage
  RANGE_TOO_SHORT: 'range_too_short',
  RANGE_TOO_LONG: 'range_too_long',
  WRONG_COLUMN: 'wrong_column',
  CIRCULAR_REFERENCE: 'circular_reference',
  
  // Erreurs de référence
  MISSING_ABSOLUTE: 'missing_absolute',
  UNNECESSARY_ABSOLUTE: 'unnecessary_absolute',
  WRONG_REFERENCE_TYPE: 'wrong_reference_type',
  
  // Erreurs de critère (SOMME.SI, NB.SI...)
  MISSING_CRITERIA_QUOTES: 'missing_criteria_quotes',
  WRONG_CRITERIA_ORDER: 'wrong_criteria_order',
  OPERATOR_OUTSIDE_QUOTES: 'operator_outside_quotes',
  
  // Erreurs de valeur
  WRONG_VALUE: 'wrong_value',
  CLOSE_VALUE: 'close_value',
  WRONG_TYPE: 'wrong_type',
  
  // Erreurs Excel
  EXCEL_ERROR: 'excel_error',
  NA_ERROR: 'na_error',
  REF_ERROR: 'ref_error',
  VALUE_ERROR: 'value_error',
  
  // Autre
  UNKNOWN: 'unknown',
  MISSING_FORMULA: 'missing_formula'
};

/**
 * Détecte le type d'erreur dans une formule
 * 
 * @param {Object} params
 * @param {string} params.userFormula - Formule soumise
 * @param {string} params.expectedFunction - Fonction attendue
 * @param {Array} params.expectedPatterns - Patterns attendus
 * @param {number} params.expectedValue - Valeur attendue
 * @param {number} params.userValue - Valeur obtenue
 * @param {Object} params.checkpoint - Checkpoint complet
 * @returns {Object} { errorType, details, severity }
 */
export function detectErrorType(params) {
  const { 
    userFormula, 
    expectedFunction, 
    expectedPatterns = [],
    expectedValue,
    userValue,
    checkpoint
  } = params;
  
  // Pas de formule du tout
  if (!userFormula || userFormula.trim() === '') {
    return {
      errorType: ERROR_TYPES.MISSING_FORMULA,
      details: { expected: expectedFunction },
      severity: 'high'
    };
  }
  
  const formula = userFormula.trim().toUpperCase();
  
  // Manque le =
  if (!formula.startsWith('=')) {
    return {
      errorType: ERROR_TYPES.MISSING_EQUALS,
      details: { formula: userFormula },
      severity: 'low'
    };
  }
  
  // Erreur Excel détectée
  if (formula.includes('#N/A') || formula.includes('#NA')) {
    return {
      errorType: ERROR_TYPES.NA_ERROR,
      details: { formula: userFormula },
      severity: 'medium'
    };
  }
  if (formula.includes('#REF!') || formula.includes('#REF')) {
    return {
      errorType: ERROR_TYPES.REF_ERROR,
      details: { formula: userFormula },
      severity: 'medium'
    };
  }
  if (formula.includes('#VALUE!') || formula.includes('#VALEUR')) {
    return {
      errorType: ERROR_TYPES.VALUE_ERROR,
      details: { formula: userFormula },
      severity: 'medium'
    };
  }
  
  // Parenthèses non équilibrées
  const openParens = (formula.match(/\(/g) || []).length;
  const closeParens = (formula.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return {
      errorType: ERROR_TYPES.UNBALANCED_PARENS,
      details: { open: openParens, close: closeParens },
      severity: 'medium'
    };
  }
  
  // Fonction manquante ou incorrecte
  if (expectedFunction) {
    const hasFn = containsFunction(formula, expectedFunction);
    if (!hasFn) {
      // Détecter si c'est une faute de frappe
      const detectedFunctions = extractFunctions(formula);
      const typo = findTypo(expectedFunction, detectedFunctions);
      
      if (typo) {
        return {
          errorType: ERROR_TYPES.FUNCTION_TYPO,
          details: { 
            expected: expectedFunction, 
            found: typo,
            suggestion: expectedFunction 
          },
          severity: 'low'
        };
      }
      
      // Mauvaise fonction utilisée
      if (detectedFunctions.length > 0) {
        return {
          errorType: ERROR_TYPES.WRONG_FUNCTION,
          details: { 
            expected: expectedFunction, 
            found: detectedFunctions[0] 
          },
          severity: 'medium'
        };
      }
      
      return {
        errorType: ERROR_TYPES.MISSING_FUNCTION,
        details: { expected: expectedFunction },
        severity: 'high'
      };
    }
  }
  
  // Vérifier les critères (pour SOMME.SI, NB.SI, etc.)
  if (['SOMME.SI', 'SUMIF', 'NB.SI', 'COUNTIF', 'MOYENNE.SI', 'AVERAGEIF'].some(
    fn => containsFunction(formula, fn)
  )) {
    // Guillemets manquants sur un critère texte
    const criteriaCheck = checkCriteriaQuotes(formula, checkpoint);
    if (criteriaCheck.error) {
      return criteriaCheck;
    }
    
    // Opérateur hors guillemets
    if (/[<>=!]\s*"/.test(formula) || /"\s*[<>=]/.test(formula)) {
      return {
        errorType: ERROR_TYPES.OPERATOR_OUTSIDE_QUOTES,
        details: { formula: userFormula },
        severity: 'medium'
      };
    }
  }
  
  // Vérifier les plages
  const rangeCheck = checkRanges(formula, checkpoint);
  if (rangeCheck.error) {
    return rangeCheck;
  }
  
  // Vérifier la valeur si on l'a
  if (expectedValue !== undefined && userValue !== undefined) {
    if (expectedValue !== userValue) {
      // Valeur proche ?
      if (typeof expectedValue === 'number' && typeof userValue === 'number') {
        const diff = Math.abs(expectedValue - userValue);
        const tolerance = Math.abs(expectedValue) * 0.05; // 5%
        
        if (diff <= tolerance) {
          return {
            errorType: ERROR_TYPES.CLOSE_VALUE,
            details: { 
              expected: expectedValue, 
              got: userValue, 
              diff: diff.toFixed(2) 
            },
            severity: 'low'
          };
        }
      }
      
      return {
        errorType: ERROR_TYPES.WRONG_VALUE,
        details: { expected: expectedValue, got: userValue },
        severity: 'high'
      };
    }
  }
  
  // Pas d'erreur spécifique détectée
  return {
    errorType: ERROR_TYPES.UNKNOWN,
    details: {},
    severity: 'medium'
  };
}

/**
 * Extrait les fonctions d'une formule
 */
function extractFunctions(formula) {
  const functions = [];
  const regex = /([A-Z][A-Z0-9._]+)\s*\(/g;
  let match;
  
  while ((match = regex.exec(formula)) !== null) {
    const fn = match[1];
    // Convertir en FR si EN
    const frName = FUNCTION_MAPPING_EN_TO_FR[fn] || fn;
    if (!functions.includes(frName)) {
      functions.push(frName);
    }
  }
  
  return functions;
}

/**
 * Détecte une faute de frappe dans le nom de fonction
 */
function findTypo(expected, found) {
  const expectedUpper = expected.toUpperCase();
  
  for (const fn of found) {
    const fnUpper = fn.toUpperCase();
    // Distance de Levenshtein simple
    if (levenshteinDistance(expectedUpper, fnUpper) <= 2) {
      return fn;
    }
  }
  
  return null;
}

/**
 * Distance de Levenshtein (édition)
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Vérifie les guillemets sur les critères
 */
function checkCriteriaQuotes(formula, checkpoint) {
  // Si le checkpoint a un critère texte attendu
  const expectedCriteria = checkpoint?.computation?.criteria;
  
  if (expectedCriteria && typeof expectedCriteria === 'string') {
    // Vérifier si le critère est entre guillemets dans la formule
    if (!formula.includes(`"${expectedCriteria.toUpperCase()}"`) && 
        !formula.includes(`"${expectedCriteria}"`)) {
      // Le critère n'est pas entre guillemets
      if (formula.toUpperCase().includes(expectedCriteria.toUpperCase())) {
        return {
          error: true,
          errorType: ERROR_TYPES.MISSING_CRITERIA_QUOTES,
          details: { criteria: expectedCriteria },
          severity: 'medium'
        };
      }
    }
  }
  
  return { error: false };
}

/**
 * Vérifie les plages de cellules
 */
function checkRanges(formula, checkpoint) {
  // Extraire les plages de la formule
  const rangePattern = /([A-Z]+)(\d+):([A-Z]+)(\d+)/gi;
  const ranges = [...formula.matchAll(rangePattern)];
  
  // Pas de plage trouvée alors qu'on en attend une
  if (ranges.length === 0 && checkpoint?.pattern?.some(p => p.includes(':'))) {
    return {
      error: true,
      errorType: ERROR_TYPES.WRONG_COLUMN,
      details: { message: 'Aucune plage de cellules détectée' },
      severity: 'medium'
    };
  }
  
  return { error: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATION DE FEEDBACK PROGRESSIF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Messages de feedback par type d'erreur et niveau de détail
 */
const FEEDBACK_MESSAGES = {
  [ERROR_TYPES.MISSING_FORMULA]: {
    vague: "Il manque une formule dans cette cellule.",
    precise: "Tu dois écrire une formule commençant par = dans la cellule {cellule}.",
    solution: "Écris une formule {fonction} pour calculer {description}."
  },
  
  [ERROR_TYPES.MISSING_EQUALS]: {
    vague: "Hmm, il manque quelque chose au début...",
    precise: "Une formule Excel doit toujours commencer par le signe =",
    solution: "Ajoute = au début de ta formule : ={formula}"
  },
  
  [ERROR_TYPES.UNBALANCED_PARENS]: {
    vague: "Vérifie la structure de ta formule.",
    precise: "Tu as {open} parenthèses ouvrantes et {close} fermantes - elles doivent être équilibrées.",
    solution: "Compte les parenthèses : chaque ( doit avoir son )."
  },
  
  [ERROR_TYPES.MISSING_FUNCTION]: {
    vague: "La fonction attendue n'est pas utilisée.",
    precise: "Tu dois utiliser la fonction {expected} pour ce calcul.",
    solution: "Utilise ={expected}(...) pour résoudre cet exercice."
  },
  
  [ERROR_TYPES.WRONG_FUNCTION]: {
    vague: "Ce n'est pas la bonne fonction pour ce calcul.",
    precise: "Tu utilises {found} mais il faut utiliser {expected}.",
    solution: "Remplace {found} par {expected}."
  },
  
  [ERROR_TYPES.FUNCTION_TYPO]: {
    vague: "Il y a une petite erreur dans le nom de la fonction.",
    precise: "Tu as écrit '{found}', tu voulais dire '{expected}' ?",
    solution: "Corrige '{found}' en '{expected}'."
  },
  
  [ERROR_TYPES.MISSING_CRITERIA_QUOTES]: {
    vague: "Vérifie la syntaxe de ton critère.",
    precise: "Le critère texte '{criteria}' doit être entre guillemets.",
    solution: 'Écris "{criteria}" avec les guillemets.'
  },
  
  [ERROR_TYPES.OPERATOR_OUTSIDE_QUOTES]: {
    vague: "La syntaxe du critère n'est pas correcte.",
    precise: "L'opérateur (>, <, =) doit être DANS les guillemets avec la valeur.",
    solution: 'Écris par exemple ">100" et non > "100".'
  },
  
  [ERROR_TYPES.WRONG_CRITERIA_ORDER]: {
    vague: "L'ordre des arguments n'est pas correct.",
    precise: "Dans {fonction}, vérifie l'ordre : {expected_order}.",
    solution: "L'ordre correct est : {correct_syntax}."
  },
  
  [ERROR_TYPES.RANGE_TOO_SHORT]: {
    vague: "Ta plage ne couvre pas toutes les données.",
    precise: "La plage s'arrête trop tôt - il y a des données après.",
    solution: "Étends ta plage jusqu'à la ligne {expected_end}."
  },
  
  [ERROR_TYPES.WRONG_COLUMN]: {
    vague: "Vérifie les colonnes utilisées dans ta formule.",
    precise: "Tu n'utilises pas la bonne colonne pour {purpose}.",
    solution: "Utilise la colonne {expected_column} pour {purpose}."
  },
  
  [ERROR_TYPES.CIRCULAR_REFERENCE]: {
    vague: "Attention, ta formule crée une boucle infinie !",
    precise: "La cellule de résultat est incluse dans la plage de calcul.",
    solution: "Exclue la cellule {cellule} de ta plage de données."
  },
  
  [ERROR_TYPES.MISSING_ABSOLUTE]: {
    vague: "Pense à figer certaines références pour la recopie.",
    precise: "La référence {ref} devrait être figée avec $.",
    solution: "Utilise {fixed_ref} pour pouvoir recopier la formule."
  },
  
  [ERROR_TYPES.NA_ERROR]: {
    vague: "Excel ne trouve pas la valeur cherchée.",
    precise: "#N/A signifie que la RECHERCHE n'a pas trouvé de correspondance.",
    solution: "Vérifie que la valeur cherchée existe bien dans la table de référence."
  },
  
  [ERROR_TYPES.REF_ERROR]: {
    vague: "Il y a un problème avec une référence de cellule.",
    precise: "#REF! indique qu'une cellule référencée n'existe pas ou a été supprimée.",
    solution: "Vérifie que toutes tes références pointent vers des cellules valides."
  },
  
  [ERROR_TYPES.VALUE_ERROR]: {
    vague: "Le type de données n'est pas compatible.",
    precise: "#VALEUR! signifie qu'Excel attendait un autre type de donnée.",
    solution: "Vérifie que tu compares/calcules des données du même type."
  },
  
  [ERROR_TYPES.WRONG_VALUE]: {
    vague: "Le résultat n'est pas celui attendu.",
    precise: "Tu obtiens {got} mais on attend {expected}.",
    solution: "Revérifie ta formule - le calcul donne {got} au lieu de {expected}."
  },
  
  [ERROR_TYPES.CLOSE_VALUE]: {
    vague: "Tu es très proche du bon résultat !",
    precise: "Tu obtiens {got}, c'est presque {expected} (écart de {diff}).",
    solution: "Vérifie les arrondis ou une petite erreur dans la plage."
  },
  
  [ERROR_TYPES.UNKNOWN]: {
    vague: "Quelque chose ne va pas dans ta formule.",
    precise: "Revérifie la syntaxe et les arguments de ta formule.",
    solution: "Compare avec l'exemple : {example}."
  }
};

/**
 * Sélectionne le feedback approprié selon la tentative et l'erreur
 * 
 * @param {Object} params
 * @param {string} params.errorType - Type d'erreur détecté
 * @param {Object} params.errorDetails - Détails de l'erreur
 * @param {number} params.attemptNumber - Numéro de tentative (1, 2, 3...)
 * @param {Array} params.checkpointIndices - Indices du checkpoint (vague, précis, solution)
 * @param {Object} params.checkpoint - Le checkpoint complet
 * @param {Object} params.manager - Info sur le manager (personnalité)
 * @returns {Object} { feedback, hint, severity }
 */
export function selectProgressiveFeedback(params) {
  const {
    errorType,
    errorDetails = {},
    attemptNumber = 1,
    checkpointIndices = [],
    checkpoint = {},
    manager = null
  } = params;
  
  // Déterminer le niveau de détail selon la tentative
  let detailLevel;
  if (attemptNumber === 1) {
    detailLevel = 'vague';
  } else if (attemptNumber === 2) {
    detailLevel = 'precise';
  } else {
    detailLevel = 'solution';
  }
  
  // Récupérer le template de message
  const messageTemplate = FEEDBACK_MESSAGES[errorType] || FEEDBACK_MESSAGES[ERROR_TYPES.UNKNOWN];
  let feedback = messageTemplate[detailLevel];
  
  // Substituer les variables dans le message
  feedback = substituteVariables(feedback, {
    ...errorDetails,
    cellule: checkpoint.cellule,
    fonction: checkpoint.fonction,
    description: checkpoint.description,
    example: checkpointIndices[2] || ''
  });
  
  // Sélectionner l'indice approprié
  let hint = null;
  if (checkpointIndices && checkpointIndices.length > 0) {
    const hintIndex = Math.min(attemptNumber - 1, checkpointIndices.length - 1);
    hint = checkpointIndices[hintIndex];
  }
  
  // Adapter le ton selon le manager
  if (manager?.personnalite) {
    feedback = adaptToneToManager(feedback, manager, attemptNumber);
  }
  
  // Déterminer la sévérité pour l'UI
  const severity = getSeverityFromError(errorType, errorDetails);
  
  return {
    feedback,
    hint,
    severity,
    errorType,
    detailLevel,
    attemptNumber
  };
}

/**
 * Substitue les variables {var} dans un template
 */
function substituteVariables(template, vars) {
  if (!template) return '';
  
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined && value !== null) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }
  
  // Nettoyer les variables non substituées
  result = result.replace(/\{[^}]+\}/g, '...');
  
  return result;
}

/**
 * Adapte le ton du feedback selon la personnalité du manager
 */
function adaptToneToManager(feedback, manager, attemptNumber) {
  const personality = manager.personnalite?.toLowerCase() || '';
  
  // Manager exigeant / pressé
  if (personality.includes('exigeant') || personality.includes('pressé')) {
    if (attemptNumber >= 3) {
      return `${feedback} Concentre-toi.`;
    }
    return feedback;
  }
  
  // Manager patient / pédagogue
  if (personality.includes('patient') || personality.includes('pédagogue')) {
    if (attemptNumber === 1) {
      return `Pas de souci, c'est normal. ${feedback}`;
    }
    return feedback;
  }
  
  // Manager encourageant
  if (personality.includes('encourage') || personality.includes('positif')) {
    if (attemptNumber === 1) {
      return `Tu y es presque ! ${feedback}`;
    }
    if (attemptNumber >= 3) {
      return `Allez, dernier effort ! ${feedback}`;
    }
  }
  
  return feedback;
}

/**
 * Détermine la sévérité pour l'affichage UI
 */
function getSeverityFromError(errorType, details) {
  const highSeverity = [
    ERROR_TYPES.MISSING_FORMULA,
    ERROR_TYPES.WRONG_VALUE,
    ERROR_TYPES.CIRCULAR_REFERENCE
  ];
  
  const lowSeverity = [
    ERROR_TYPES.MISSING_EQUALS,
    ERROR_TYPES.FUNCTION_TYPO,
    ERROR_TYPES.CLOSE_VALUE
  ];
  
  if (highSeverity.includes(errorType)) return 'error';
  if (lowSeverity.includes(errorType)) return 'warning';
  return 'info';
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSE GLOBALE DE LA SOUMISSION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyse une soumission complète et génère le feedback global
 * 
 * @param {Object} params
 * @param {Object} params.exercise - L'exercice
 * @param {Array} params.validationResults - Résultats par checkpoint
 * @param {number} params.attemptNumber - Numéro de tentative
 * @param {Object} params.userProfile - Profil de l'apprenant
 * @returns {Object} Analyse complète avec feedbacks
 */
export function analyzeSubmission(params) {
  const {
    exercise,
    validationResults,
    attemptNumber = 1,
    userProfile = {}
  } = params;
  
  const manager = exercise.contexte?.manager;
  const checkpoints = exercise.checkpoints || [];
  
  // Analyser chaque checkpoint échoué
  const feedbacks = [];
  let totalErrors = 0;
  let criticalErrors = 0;
  
  for (const result of validationResults) {
    if (result.passed) continue;
    
    totalErrors++;
    
    // Trouver le checkpoint correspondant
    const checkpoint = checkpoints.find(cp => cp.id === result.id) || {};
    
    // Détecter le type d'erreur
    const errorAnalysis = detectErrorType({
      userFormula: result.details?.userFormula,
      expectedFunction: checkpoint.fonction,
      expectedPatterns: checkpoint.pattern,
      expectedValue: checkpoint.expected_value,
      userValue: result.details?.userValue,
      checkpoint
    });
    
    if (errorAnalysis.severity === 'high') {
      criticalErrors++;
    }
    
    // Générer le feedback progressif
    const progressiveFeedback = selectProgressiveFeedback({
      errorType: errorAnalysis.errorType,
      errorDetails: errorAnalysis.details,
      attemptNumber,
      checkpointIndices: checkpoint.indices,
      checkpoint,
      manager
    });
    
    feedbacks.push({
      checkpointId: result.id,
      cellule: checkpoint.cellule,
      description: checkpoint.description,
      ...progressiveFeedback,
      errorAnalysis
    });
  }
  
  // Message global selon le score
  const passed = validationResults.filter(r => r.passed).length;
  const total = validationResults.length;
  const score = Math.round((passed / total) * 100);
  
  let globalMessage;
  if (score === 100) {
    globalMessage = manager?.feedbacks?.succes || '🎉 Parfait ! Tout est correct.';
  } else if (score >= 70) {
    globalMessage = manager?.feedbacks?.partiel || '👍 Bien, quelques ajustements à faire.';
  } else if (score >= 40) {
    globalMessage = `💪 Tu as ${passed}/${total} points. Continue !`;
  } else {
    globalMessage = manager?.feedbacks?.echec || '🌱 Pas de panique, on reprend étape par étape.';
  }
  
  // Conseil selon le pattern d'erreurs
  let advice = null;
  if (criticalErrors > 0 && attemptNumber >= 2) {
    advice = "Concentre-toi sur les erreurs marquées en rouge - elles sont prioritaires.";
  } else if (totalErrors > 3) {
    advice = "Commence par corriger la première erreur, puis passe aux suivantes.";
  }
  
  return {
    score,
    passed,
    total,
    globalMessage,
    advice,
    feedbacks,
    attemptNumber,
    criticalErrorsCount: criticalErrors,
    totalErrorsCount: totalErrors
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  ERROR_TYPES,
  FEEDBACK_MESSAGES,
  detectErrorType,
  selectProgressiveFeedback,
  analyzeSubmission
};
