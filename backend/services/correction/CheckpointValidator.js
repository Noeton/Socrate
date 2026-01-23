/**
 * CHECKPOINT VALIDATOR - v1.1 (Phase 1 - T1.3)
 * 
 * Valide les soumissions d'exercices contre les checkpoints définis.
 * Génère un score précis et des feedbacks personnalisés.
 * 
 * AMÉLIORATIONS v1.1 :
 * - Utilisation de formulaNormalizer pour comparaison flexible
 * - Support complet FR/EN pour toutes les fonctions
 * - Validation tolérante des références absolues/relatives
 */

import { detecterErreurs, getFeedbackErreur } from '@/shared/data/erreursFrequentes.js';
import { classifyReference, parseReferences } from '@/shared/utils/competenceDetector.js';
import { 
  normalizeFormula, 
  containsFunction, 
  validateFormulaPattern,
  FUNCTION_MAPPING_FR_TO_EN,
  FUNCTION_MAPPING_EN_TO_FR 
} from '@/shared/utils/formulaNormalizer.js';
import logger from '@/lib/logger';

/**
 * Valide tous les checkpoints d'un exercice
 * @param {Object} exercise - L'exercice avec ses checkpoints
 * @param {Object} userFormulas - {cellRef: formula} extraites du fichier
 * @param {Object} userValues - {cellRef: value} extraites du fichier
 * @param {Object} workbook - Le workbook ExcelJS pour accès multi-feuilles
 * @returns {Object} - Résultat complet de la validation
 */
export function validateAllCheckpoints(exercise, userFormulas, userValues, workbook = null) {
  const checkpoints = exercise.checkpoints || [];
  
  if (checkpoints.length === 0) {
    logger.warn('VALIDATOR', 'Aucun checkpoint défini, fallback mode');
    return {
      score: null,
      checkpointsTotal: 0,
      checkpointsPassed: 0,
      results: [],
      needsAIAnalysis: true
    };
  }
  
  const results = [];
  let totalPoints = 0;
  let earnedPoints = 0;
  
  for (const checkpoint of checkpoints) {
    const result = validateSingleCheckpoint(checkpoint, userFormulas, userValues, workbook);
    results.push(result);
    
    totalPoints += checkpoint.points || 0;
    if (result.passed) {
      earnedPoints += checkpoint.points || 0;
    }
  }
  
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10 * 10) / 10 : 0;
  
  logger.info('VALIDATOR', `Score: ${earnedPoints}/${totalPoints} points → ${score}/10`);
  
  return {
    score,
    totalPoints,
    earnedPoints,
    checkpointsTotal: checkpoints.length,
    checkpointsPassed: results.filter(r => r.passed).length,
    results,
    needsAIAnalysis: false
  };
}

/**
 * Valide un checkpoint individuel
 * @param {Object} checkpoint - Le checkpoint à valider
 * @param {Object} userFormulas - Formules de l'utilisateur
 * @param {Object} userValues - Valeurs de l'utilisateur
 * @param {Object} workbook - Workbook ExcelJS
 * @returns {Object} - Résultat de validation
 */
function validateSingleCheckpoint(checkpoint, userFormulas, userValues, workbook) {
  const result = {
    id: checkpoint.id,
    cellule: checkpoint.cellule,
    description: checkpoint.description,
    points: checkpoint.points || 0,
    passed: false,
    feedback: '',
    indice: null,
    details: {}
  };
  
  try {
    switch (checkpoint.type) {
      case 'formule':
        validateFormule(checkpoint, userFormulas, result);
        break;
        
      case 'valeur':
        validateValeur(checkpoint, userValues, result);
        break;
        
      case 'donnees':
        validateDonnees(checkpoint, userValues, result);
        break;
        
      case 'texte_contient':
        validateTexteContient(checkpoint, userValues, result);
        break;
        
      case 'graphique_present':
      case 'graphique_type':
      case 'graphique_titre':
      case 'graphique':
        // Les graphiques nécessitent une validation visuelle (screenshot)
        validateVisualCheckpoint(checkpoint, workbook, result, 'graphique');
        break;
        
      case 'format':
        // MFC et mise en forme nécessitent une validation visuelle
        validateVisualCheckpoint(checkpoint, workbook, result, 'format');
        break;
        
      case 'pivot_table':
        // TCD nécessitent une validation visuelle ou workbook
        validatePivotTableCheckpoint(checkpoint, workbook, result);
        break;
        
      default:
        // Vérifier si c'est un checkpoint visuel générique
        if (checkpoint.validation_type === 'visual' || checkpoint.requires_screenshot) {
          validateVisualCheckpoint(checkpoint, workbook, result, checkpoint.type);
        } else {
          result.feedback = `Type de checkpoint inconnu: ${checkpoint.type}`;
        }
    }
  } catch (error) {
    logger.error('VALIDATOR', `Erreur checkpoint ${checkpoint.id}`, { error: error.message });
    result.feedback = "Erreur lors de la validation";
    result.error = error.message;
  }
  
  // Ajouter l'indice approprié si échec
  if (!result.passed && checkpoint.indices && checkpoint.indices.length > 0) {
    result.indice = selectAppropriateHint(checkpoint.indices, result.details);
  }
  
  return result;
}

/**
 * Valide un checkpoint de type "formule"
 * AMÉLIORATION v1.1 : Validation flexible (références absolues, langues)
 */
function validateFormule(checkpoint, userFormulas, result) {
  const cellule = checkpoint.cellule.toUpperCase();
  const userFormula = userFormulas[cellule];
  
  // Vérifier si une formule existe
  if (!userFormula) {
    result.passed = false;
    result.feedback = `Aucune formule trouvée en ${cellule}`;
    result.details.missing = true;
    return;
  }
  
  // Normaliser la formule utilisateur pour comparaison
  const normalizedUserFormula = normalizeFormula(userFormula, {
    removeAbsolute: true,
    toUpperCase: true,
    targetLanguage: 'FR'
  });
  
  result.details.userFormula = userFormula;
  result.details.normalizedFormula = normalizedUserFormula;
  
  // Vérifier la fonction attendue (accepte FR et EN)
  if (checkpoint.fonction) {
    const fonctionExpected = checkpoint.fonction.toUpperCase();
    
    // Utiliser containsFunction qui vérifie FR et EN
    if (!containsFunction(userFormula, fonctionExpected)) {
      result.passed = false;
      result.feedback = `La fonction ${checkpoint.fonction} n'est pas utilisée en ${cellule}`;
      result.details.missingFunction = checkpoint.fonction;
      
      // Suggérer si une fonction similaire est utilisée
      const usedFunctions = extractUsedFunctions(userFormula);
      if (usedFunctions.length > 0) {
        result.details.functionsUsed = usedFunctions;
        result.feedback += `. Fonction(s) détectée(s) : ${usedFunctions.join(', ')}`;
      }
      return;
    }
  }
  
  // Vérifier le pattern (avec validation flexible)
  if (checkpoint.pattern) {
    const { matches, missingPatterns } = validateFormulaPattern(
      userFormula, 
      checkpoint.pattern,
      {
        ignoreAbsolute: true,  // $A$1 == A1
        ignoreLang: true,       // SOMME == SUM
        ignoreCase: true
      }
    );
    
    if (!matches) {
      result.passed = false;
      result.feedback = `Formule incomplète en ${cellule}. Éléments manquants : ${missingPatterns.join(', ')}`;
      result.details.missingPatterns = missingPatterns;
      return;
    }
  }
  
  // Vérifier les patterns alternatifs (OR)
  if (checkpoint.pattern_ou) {
    const anyMatch = checkpoint.pattern_ou.some(patternGroup => {
      const { matches } = validateFormulaPattern(userFormula, patternGroup, {
        ignoreAbsolute: true,
        ignoreLang: true,
        ignoreCase: true
      });
      return matches;
    });
    
    if (!anyMatch) {
      result.passed = false;
      result.feedback = `Formule en ${cellule} ne correspond à aucun pattern attendu`;
      result.details.noPatternMatch = true;
      return;
    }
  }
  
  // Validation avancée des références
  if (checkpoint.validation_avancee?.references) {
    const refValidation = validateReferences(userFormula, checkpoint.validation_avancee.references);
    
    if (!refValidation.valid) {
      result.passed = false;
      result.feedback = refValidation.feedback;
      result.details.referenceErrors = refValidation.errors;
      return;
    }
  }
  
  // Détecter les erreurs fréquentes
  const erreurs = detecterErreurs(userFormula);
  if (erreurs.length > 0) {
    const erreurCritique = erreurs.find(e => e.severite === 'critique');
    if (erreurCritique) {
      result.passed = false;
      result.feedback = erreurCritique.feedback;
      result.details.erreurDetectee = erreurCritique;
      return;
    }
  }
  
  // Tout est bon !
  result.passed = true;
  result.feedback = `✓ Formule correcte en ${cellule}`;
}

/**
 * Extrait les fonctions utilisées dans une formule
 */
function extractUsedFunctions(formula) {
  const functions = [];
  const regex = /([A-Z][A-Z0-9._]*)\s*\(/gi;
  let match;
  
  while ((match = regex.exec(formula)) !== null) {
    const funcName = match[1].toUpperCase();
    // Convertir en FR pour uniformité
    const frName = FUNCTION_MAPPING_EN_TO_FR[funcName] || funcName;
    if (!functions.includes(frName)) {
      functions.push(frName);
    }
  }
  
  return functions;
}

/**
 * Valide un checkpoint de type "valeur"
 * AMÉLIORATION v1.1 : Tolérance intelligente pour les nombres
 */
function validateValeur(checkpoint, userValues, result) {
  const cellule = checkpoint.cellule.toUpperCase();
  const userValue = userValues[cellule];
  
  if (userValue === undefined || userValue === null) {
    result.passed = false;
    result.feedback = `Aucune valeur trouvée en ${cellule}`;
    result.details.missing = true;
    return;
  }
  
  result.details.userValue = userValue;
  
  // Valeur exacte attendue
  if (checkpoint.valeur_attendue !== undefined) {
    const expected = checkpoint.valeur_attendue;
    
    if (typeof expected === 'number') {
      const numValue = parseFloat(userValue);
      if (isNaN(numValue)) {
        result.passed = false;
        result.feedback = `La valeur en ${cellule} n'est pas un nombre`;
        return;
      }
      
      // Calcul de la tolérance intelligente
      // Priorité : checkpoint.tolerance > 0.01% de la valeur > 0.01 minimum
      let tolerance = checkpoint.tolerance;
      if (tolerance === undefined || tolerance === null) {
        // Tolérance par défaut : 0.01% de la valeur attendue, minimum 0.01
        tolerance = Math.max(Math.abs(expected) * 0.0001, 0.01);
      }
      
      // Arrondir les deux valeurs au même nombre de décimales pour éviter les problèmes de précision
      const decimals = getDecimalPlaces(expected);
      const roundedUser = roundToDecimals(numValue, Math.max(decimals, 2));
      const roundedExpected = roundToDecimals(expected, Math.max(decimals, 2));
      
      if (Math.abs(roundedUser - roundedExpected) <= tolerance) {
        result.passed = true;
        result.feedback = `✓ Valeur correcte en ${cellule}`;
      } else {
        result.passed = false;
        result.feedback = `Valeur incorrecte en ${cellule}. Attendu : ${formatNumberDisplay(expected)}, obtenu : ${formatNumberDisplay(numValue)}`;
        result.details.expected = expected;
        result.details.actual = numValue;
        result.details.tolerance = tolerance;
        result.details.difference = Math.abs(numValue - expected);
      }
    } else if (typeof expected === 'string') {
      // Comparaison de dates
      if (expected.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const userDate = normalizeDate(userValue);
        if (userDate === expected) {
          result.passed = true;
          result.feedback = `✓ Date correcte en ${cellule}`;
        } else {
          result.passed = false;
          result.feedback = `Date incorrecte en ${cellule}`;
        }
      } else {
        // Comparaison texte
        const userStr = String(userValue).trim().toLowerCase();
        const expectedStr = expected.trim().toLowerCase();
        
        if (userStr === expectedStr) {
          result.passed = true;
          result.feedback = `✓ Valeur correcte en ${cellule}`;
        } else {
          result.passed = false;
          result.feedback = `Valeur incorrecte en ${cellule}. Attendu : "${expected}"`;
        }
      }
    }
    return;
  }
  
  // Valeurs alternatives (OR)
  if (checkpoint.valeur_attendue_ou) {
    const alternatives = checkpoint.valeur_attendue_ou;
    const userStr = String(userValue).trim().toLowerCase();
    
    const match = alternatives.some(alt => {
      if (typeof alt === 'number') {
        return parseFloat(userValue) === alt;
      }
      return userStr === String(alt).trim().toLowerCase();
    });
    
    if (match) {
      result.passed = true;
      result.feedback = `✓ Valeur correcte en ${cellule}`;
    } else {
      result.passed = false;
      result.feedback = `Valeur incorrecte en ${cellule}`;
    }
    return;
  }
  
  // Si pas de valeur attendue spécifiée, juste vérifier la présence
  result.passed = true;
  result.feedback = `✓ Valeur présente en ${cellule}`;
}

/**
 * Valide un checkpoint de type "donnees" (plage de cellules)
 */
function validateDonnees(checkpoint, userValues, result) {
  const plage = checkpoint.cellule;
  
  // Parser la plage (ex: "F2:F5" ou "A1:B6")
  const rangeMatch = plage.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
  
  if (!rangeMatch) {
    // Cellule unique
    validateValeur(checkpoint, userValues, result);
    return;
  }
  
  const [, startCol, startRow, endCol, endRow] = rangeMatch;
  const values = [];
  
  // Extraire les valeurs de la plage
  for (let row = parseInt(startRow); row <= parseInt(endRow); row++) {
    for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
      const cellRef = `${String.fromCharCode(col)}${row}`;
      if (userValues[cellRef] !== undefined) {
        values.push(userValues[cellRef]);
      }
    }
  }
  
  result.details.extractedValues = values;
  
  // Vérifier les valeurs attendues
  if (checkpoint.valeurs_attendues) {
    const expected = checkpoint.valeurs_attendues;
    
    if (values.length !== expected.length) {
      result.passed = false;
      result.feedback = `Nombre de valeurs incorrect. Attendu : ${expected.length}, trouvé : ${values.length}`;
      return;
    }
    
    // Comparer les valeurs (avec tolérance pour les nombres)
    const tolerance = checkpoint.tolerance || 0.01;
    let allMatch = true;
    
    for (let i = 0; i < expected.length; i++) {
      if (typeof expected[i] === 'number') {
        if (Math.abs(parseFloat(values[i]) - expected[i]) > tolerance) {
          allMatch = false;
          break;
        }
      } else {
        if (String(values[i]).toLowerCase() !== String(expected[i]).toLowerCase()) {
          allMatch = false;
          break;
        }
      }
    }
    
    if (allMatch) {
      result.passed = true;
      result.feedback = `✓ Données correctes dans ${plage}`;
    } else {
      result.passed = false;
      result.feedback = `Données incorrectes dans ${plage}`;
    }
    return;
  }
  
  // Juste vérifier que des données existent
  if (values.length > 0) {
    result.passed = true;
    result.feedback = `✓ Données présentes dans ${plage}`;
  } else {
    result.passed = false;
    result.feedback = `Aucune donnée trouvée dans ${plage}`;
  }
}

/**
 * Valide un checkpoint de type "texte_contient"
 */
function validateTexteContient(checkpoint, userValues, result) {
  const cellule = checkpoint.cellule.toUpperCase();
  const userValue = userValues[cellule];
  
  if (!userValue) {
    result.passed = false;
    result.feedback = `Aucun texte trouvé en ${cellule}`;
    return;
  }
  
  const userText = String(userValue).toLowerCase();
  const keywords = checkpoint.contient || [];
  
  const found = keywords.some(kw => userText.includes(kw.toLowerCase()));
  
  if (found) {
    result.passed = true;
    result.feedback = `✓ Réponse pertinente en ${cellule}`;
  } else {
    result.passed = false;
    result.feedback = `Réponse en ${cellule} ne contient pas les éléments attendus`;
  }
}

/**
 * Valide les types de références dans une formule
 */
function validateReferences(formula, expectedRefs) {
  const errors = [];
  
  for (const [refPattern, config] of Object.entries(expectedRefs)) {
    const expectedType = config.expected_type;
    
    // Trouver cette référence dans la formule
    const refs = parseReferences(formula);
    const matchingRef = refs.find(r => 
      r.ref.toUpperCase().includes(refPattern.replace(/\$/g, '').toUpperCase())
    );
    
    if (matchingRef) {
      const actualType = matchingRef.type;
      
      if (actualType !== expectedType) {
        errors.push({
          ref: refPattern,
          expected: expectedType,
          actual: actualType,
          reason: config.reason || ''
        });
      }
    }
  }
  
  if (errors.length > 0) {
    const firstError = errors[0];
    let feedback = '';
    
    if (firstError.expected === 'absolute' && firstError.actual === 'relative') {
      feedback = `⚠️ La référence ${firstError.ref} devrait être figée avec $. ${firstError.reason}`;
    } else if (firstError.expected === 'mixed_col') {
      feedback = `⚠️ La référence devrait avoir la colonne figée ($A1). ${firstError.reason}`;
    } else if (firstError.expected === 'mixed_row') {
      feedback = `⚠️ La référence devrait avoir la ligne figée (A$1). ${firstError.reason}`;
    } else {
      feedback = `⚠️ Type de référence incorrect pour ${firstError.ref}. ${firstError.reason}`;
    }
    
    return { valid: false, errors, feedback };
  }
  
  return { valid: true, errors: [] };
}

/**
 * Sélectionne l'indice approprié selon le niveau de difficulté
 */
function selectAppropriateHint(indices, details) {
  if (!indices || indices.length === 0) return null;
  
  // Si formule manquante → premier indice (basique)
  if (details.missing) {
    return indices[0];
  }
  
  // Si fonction manquante → deuxième indice
  if (details.missingFunction) {
    return indices[Math.min(1, indices.length - 1)];
  }
  
  // Si erreur de référence → dernier indice (solution)
  if (details.referenceErrors) {
    return indices[indices.length - 1];
  }
  
  // Par défaut, indice intermédiaire
  return indices[Math.min(1, indices.length - 1)];
}

/**
 * Normalise une date pour comparaison
 */
function normalizeDate(value) {
  if (!value) return null;
  
  // Si c'est déjà un objet Date ou un numéro Excel
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  // Si c'est un numéro (date Excel)
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  // Si c'est une string
  if (typeof value === 'string') {
    // Format DD/MM/YYYY
    const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    // Format YYYY-MM-DD
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Obtient le nombre de décimales d'un nombre
 */
function getDecimalPlaces(num) {
  if (!Number.isFinite(num)) return 0;
  const str = String(num);
  const decimalIndex = str.indexOf('.');
  return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
}

/**
 * Arrondit à un nombre de décimales
 */
function roundToDecimals(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Formate un nombre pour affichage
 */
function formatNumberDisplay(num) {
  if (!Number.isFinite(num)) return String(num);
  
  // Arrondir à 2 décimales max pour l'affichage
  const rounded = roundToDecimals(num, 2);
  return rounded.toLocaleString('fr-FR');
}

/**
 * Mapping fonction FR → EN (utilise le module centralisé)
 * @deprecated Utiliser directement FUNCTION_MAPPING_FR_TO_EN du module formulaNormalizer
 */
function getFunctionEnglishName(frenchName) {
  return FUNCTION_MAPPING_FR_TO_EN[frenchName] || frenchName;
}

/**
 * Génère un rapport de feedback complet
 */
export function generateFeedbackReport(validationResult, exercise) {
  const { results, score, checkpointsPassed, checkpointsTotal } = validationResult;
  
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => r.passed === false);
  const undetermined = results.filter(r => r.passed === null);
  
  let feedback = '';
  
  // Score global
  if (score >= 8) {
    feedback += `🎉 Excellent travail ! Score : ${score}/10\n\n`;
  } else if (score >= 6) {
    feedback += `👍 Bon travail ! Score : ${score}/10\n\n`;
  } else if (score >= 4) {
    feedback += `💪 Tu progresses ! Score : ${score}/10\n\n`;
  } else {
    feedback += `🌱 Continue à t'entraîner ! Score : ${score}/10\n\n`;
  }
  
  // Résumé
  feedback += `**Checkpoints : ${checkpointsPassed}/${checkpointsTotal} validés**\n\n`;
  
  // Points réussis
  if (passed.length > 0) {
    feedback += `✅ **Ce qui est bien :**\n`;
    for (const r of passed.slice(0, 3)) {
      feedback += `- ${r.description}\n`;
    }
    feedback += '\n';
  }
  
  // Points à améliorer
  if (failed.length > 0) {
    feedback += `❌ **À corriger :**\n`;
    for (const r of failed) {
      feedback += `- ${r.description}: ${r.feedback}\n`;
      if (r.indice) {
        feedback += `  💡 Indice : ${r.indice}\n`;
      }
    }
    feedback += '\n';
  }
  
  // Conseil pédagogique de l'exercice
  if (exercise.conseil_pedagogique && score < 7) {
    feedback += `📚 **Conseil :** ${exercise.conseil_pedagogique}\n`;
  }
  
  return feedback;
}

/**
 * Valide un checkpoint visuel (graphique, MFC, etc.)
 * Ces checkpoints nécessitent soit un screenshot, soit une validation partielle via workbook
 * 
 * TODO [LIMITE] : La validation visuelle complète nécessite :
 *   1. Un screenshot uploadé par l'utilisateur (frontend non implémenté)
 *   2. L'appel à VisualValidationService avec Claude Vision API
 *   3. Actuellement : validation partielle via workbook (présence uniquement, pas le contenu)
 *   Voir tâche T3.3.6 dans ROADMAP pour implémenter l'upload screenshot
 */
function validateVisualCheckpoint(checkpoint, workbook, result, checkpointType) {
  result.details.checkpointType = checkpointType;
  result.details.subtype = checkpoint.subtype || null;
  result.details.expected = checkpoint.expected || {};
  
  // Si pas de workbook, on ne peut pas valider automatiquement
  if (!workbook) {
    result.passed = null; // Indéterminé
    result.feedback = `Vérification ${checkpointType} nécessite une validation visuelle`;
    result.needsVisualValidation = true;
    result.needsManualCheck = true;
    return;
  }
  
  // Tentative de validation partielle via workbook
  try {
    const worksheet = workbook.getWorksheet(1);
    
    if (checkpointType === 'graphique') {
      // Vérifier si des graphiques existent dans le workbook
      // Note: ExcelJS a un support limité pour les graphiques
      const hasDrawings = worksheet.drawings && worksheet.drawings.length > 0;
      
      if (checkpoint.expected?.type) {
        // On ne peut pas vérifier le type exact, mais on peut vérifier la présence
        result.passed = null;
        result.feedback = hasDrawings 
          ? "Graphique détecté. Vérification du type requiert validation visuelle."
          : "Aucun graphique détecté dans le fichier.";
        result.needsVisualValidation = true;
        result.details.hasDrawings = hasDrawings;
      } else {
        result.passed = hasDrawings;
        result.feedback = hasDrawings ? "Graphique présent" : "Graphique manquant";
      }
    } 
    else if (checkpointType === 'format') {
      // MFC : vérification partielle via conditionalFormattings
      const cfRules = worksheet.conditionalFormattings || [];
      const hasCF = cfRules.length > 0 || hasConditionalFormattingInRange(worksheet, checkpoint.expected?.range);
      
      result.passed = null; // Ne peut pas valider le détail sans screenshot
      result.feedback = hasCF 
        ? "Mise en forme conditionnelle détectée. Vérification visuelle recommandée."
        : "Aucune mise en forme conditionnelle détectée.";
      result.needsVisualValidation = true;
      result.details.hasCF = hasCF;
    }
    else {
      result.passed = null;
      result.feedback = `Vérification ${checkpointType} nécessite une validation visuelle`;
      result.needsVisualValidation = true;
    }
  } catch (error) {
    logger.warn('VALIDATOR', `Erreur validation visuelle: ${error.message}`);
    result.passed = null;
    result.feedback = `Vérification ${checkpointType} nécessite une validation visuelle`;
    result.needsVisualValidation = true;
  }
  
  result.needsManualCheck = result.passed === null;
}

/**
 * Vérifie si une plage a de la mise en forme conditionnelle
 */
function hasConditionalFormattingInRange(worksheet, range) {
  if (!range || !worksheet) return false;
  
  try {
    // ExcelJS stocke les CF différemment selon les versions
    // Tentative de détection basique
    const cfRules = worksheet.conditionalFormattings;
    if (Array.isArray(cfRules)) {
      return cfRules.some(rule => {
        const ruleRange = rule.ref || rule.sqref || '';
        return ruleRange.includes(range) || range.includes(ruleRange);
      });
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Valide un checkpoint TCD (Tableau Croisé Dynamique)
 * Les TCD sont stockés dans le workbook mais difficiles à analyser en détail
 * 
 * TODO [LIMITE] : Validation TCD très basique actuellement :
 *   1. ExcelJS ne parse pas complètement les TCD (pas d'accès aux champs lignes/colonnes/valeurs)
 *   2. Détection uniquement via nom de feuille ("pivot", "tcd", "croisé")
 *   3. Pour validation complète : nécessite screenshot + Claude Vision
 *   4. Alternative : utiliser une lib spécialisée TCD ou parser le XML du xlsx
 */
function validatePivotTableCheckpoint(checkpoint, workbook, result) {
  result.details.expected = checkpoint.expected || {};
  
  if (!workbook) {
    result.passed = null;
    result.feedback = "Vérification TCD nécessite le fichier Excel";
    result.needsVisualValidation = true;
    result.needsManualCheck = true;
    return;
  }
  
  try {
    // Chercher des indices de TCD dans le workbook
    let pivotFound = false;
    let pivotDetails = {};
    
    workbook.eachSheet((worksheet, sheetId) => {
      // Vérifier le nom de la feuille (souvent les TCD sont sur une feuille séparée)
      const sheetName = worksheet.name.toLowerCase();
      if (sheetName.includes('pivot') || sheetName.includes('tcd') || sheetName.includes('croisé')) {
        pivotFound = true;
        pivotDetails.sheetName = worksheet.name;
      }
      
      // Vérifier si la feuille a des propriétés TCD (limité dans ExcelJS)
      // ExcelJS ne parse pas complètement les TCD, mais on peut détecter leur présence
      if (worksheet.tables && worksheet.tables.length > 0) {
        pivotDetails.hasTables = true;
      }
    });
    
    // Vérification basique de structure si expected contient des row_fields ou value_fields
    if (checkpoint.expected?.row_fields || checkpoint.expected?.value_fields) {
      result.passed = null;
      result.feedback = pivotFound 
        ? "TCD détecté. Vérification de la structure requiert validation visuelle."
        : "Aucun TCD clairement identifié. Vérifiez que le TCD existe.";
      result.needsVisualValidation = true;
    } else if (checkpoint.expected?.pivot_exists) {
      result.passed = pivotFound;
      result.feedback = pivotFound ? "TCD présent" : "TCD non trouvé";
    } else {
      result.passed = null;
      result.feedback = "Vérification TCD nécessite validation visuelle";
      result.needsVisualValidation = true;
    }
    
    result.details.pivotFound = pivotFound;
    result.details.pivotDetails = pivotDetails;
    
  } catch (error) {
    logger.warn('VALIDATOR', `Erreur validation TCD: ${error.message}`);
    result.passed = null;
    result.feedback = "Vérification TCD nécessite validation visuelle";
    result.needsVisualValidation = true;
  }
  
  result.needsManualCheck = result.passed === null;
}

export default {
  validateAllCheckpoints,
  generateFeedbackReport
};