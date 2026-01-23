/**
 * CHECKPOINT VALIDATOR - v1.0
 * 
 * Valide les soumissions d'exercices contre les checkpoints définis.
 * Génère un score précis et des feedbacks personnalisés.
 */

import { detecterErreurs, getFeedbackErreur } from '@/shared/data/erreursFrequentes.js';
import { classifyReference, parseReferences } from '@/shared/utils/competenceDetector.js';
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
        // Les graphiques nécessitent une analyse spéciale ou AI
        result.passed = null; // Indéterminé
        result.feedback = "Vérification graphique non automatisée";
        result.needsManualCheck = true;
        break;
        
      default:
        result.feedback = `Type de checkpoint inconnu: ${checkpoint.type}`;
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
  
  const formulaUpper = userFormula.toUpperCase();
  result.details.userFormula = userFormula;
  
  // Vérifier la fonction attendue
  if (checkpoint.fonction) {
    const fonctionUpper = checkpoint.fonction.toUpperCase();
    const frenchName = fonctionUpper;
    const englishName = getFunctionEnglishName(fonctionUpper);
    
    if (!formulaUpper.includes(frenchName) && !formulaUpper.includes(englishName)) {
      result.passed = false;
      result.feedback = `La fonction ${checkpoint.fonction} n'est pas utilisée en ${cellule}`;
      result.details.missingFunction = checkpoint.fonction;
      return;
    }
  }
  
  // Vérifier le pattern (tous les éléments doivent être présents)
  if (checkpoint.pattern) {
    const patterns = Array.isArray(checkpoint.pattern) ? checkpoint.pattern : [checkpoint.pattern];
    const missingPatterns = [];
    
    for (const pattern of patterns) {
      const patternUpper = pattern.toUpperCase();
      if (!formulaUpper.includes(patternUpper)) {
        missingPatterns.push(pattern);
      }
    }
    
    if (missingPatterns.length > 0) {
      result.passed = false;
      result.feedback = `Formule incomplète en ${cellule}. Éléments manquants : ${missingPatterns.join(', ')}`;
      result.details.missingPatterns = missingPatterns;
      return;
    }
  }
  
  // Vérifier les patterns alternatifs (OR)
  if (checkpoint.pattern_ou) {
    const anyMatch = checkpoint.pattern_ou.some(patternGroup => {
      return patternGroup.every(pattern => 
        formulaUpper.includes(pattern.toUpperCase())
      );
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
 * Valide un checkpoint de type "valeur"
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
    const tolerance = checkpoint.tolerance || 0;
    
    if (typeof expected === 'number') {
      const numValue = parseFloat(userValue);
      if (isNaN(numValue)) {
        result.passed = false;
        result.feedback = `La valeur en ${cellule} n'est pas un nombre`;
        return;
      }
      
      if (Math.abs(numValue - expected) <= tolerance) {
        result.passed = true;
        result.feedback = `✓ Valeur correcte en ${cellule}`;
      } else {
        result.passed = false;
        result.feedback = `Valeur incorrecte en ${cellule}. Attendu : ${expected}, obtenu : ${numValue}`;
        result.details.expected = expected;
        result.details.actual = numValue;
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
 * Mapping fonction FR → EN
 */
function getFunctionEnglishName(frenchName) {
  const mapping = {
    'SOMME': 'SUM',
    'MOYENNE': 'AVERAGE',
    'NB.SI': 'COUNTIF',
    'NB.SI.ENS': 'COUNTIFS',
    'SOMME.SI': 'SUMIF',
    'SOMME.SI.ENS': 'SUMIFS',
    'RECHERCHEV': 'VLOOKUP',
    'RECHERCHEH': 'HLOOKUP',
    'SI': 'IF',
    'SIERREUR': 'IFERROR',
    'JOURSEM': 'WEEKDAY',
    'TEXTE': 'TEXT',
    'AUJOURDHUI': 'TODAY',
    'MOIS': 'MONTH',
    'ANNEE': 'YEAR',
    'INDEX': 'INDEX',
    'EQUIV': 'MATCH',
    'CONCATENER': 'CONCATENATE',
    'GAUCHE': 'LEFT',
    'DROITE': 'RIGHT'
  };
  
  return mapping[frenchName] || frenchName;
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

export default {
  validateAllCheckpoints,
  generateFeedbackReport
};