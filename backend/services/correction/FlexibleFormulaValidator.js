/**
 * FLEXIBLE FORMULA VALIDATOR - v1.0 (Phase 3 - T3.1)
 * 
 * Valide les formules de manière flexible pour accepter :
 * - Différentes syntaxes équivalentes (FR/EN, ;/,)
 * - Variations de plages (A2:A100 vs A2:A101)
 * - Références absolues/relatives quand non critiques
 * - Espaces et formatage différent
 * 
 * PRINCIPES :
 * 1. Normaliser AVANT de comparer
 * 2. Accepter les équivalences fonctionnelles
 * 3. Valider d'abord par le RÉSULTAT, puis par la FORME
 */

import { 
  normalizeFormula, 
  FUNCTION_MAPPING_FR_TO_EN,
  FUNCTION_MAPPING_EN_TO_FR,
  containsFunction 
} from '../../../shared/utils/formulaNormalizer.js';

// ═══════════════════════════════════════════════════════════════════════════
// ÉQUIVALENCES DE FONCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fonctions considérées comme équivalentes
 * (différentes façons d'obtenir le même résultat)
 */
const FUNCTION_EQUIVALENCES = {
  // Somme conditionnelle
  'SOMME.SI': ['SUMIF'],
  'SUMIF': ['SOMME.SI'],
  
  // Somme conditionnelle multiple
  'SOMME.SI.ENS': ['SUMIFS'],
  'SUMIFS': ['SOMME.SI.ENS'],
  
  // Comptage conditionnel
  'NB.SI': ['COUNTIF'],
  'COUNTIF': ['NB.SI'],
  
  // Comptage conditionnel multiple
  'NB.SI.ENS': ['COUNTIFS'],
  'COUNTIFS': ['NB.SI.ENS'],
  
  // Moyenne conditionnelle
  'MOYENNE.SI': ['AVERAGEIF'],
  'AVERAGEIF': ['MOYENNE.SI'],
  
  // Recherche
  'RECHERCHEV': ['VLOOKUP'],
  'VLOOKUP': ['RECHERCHEV'],
  
  'RECHERCHEH': ['HLOOKUP'],
  'HLOOKUP': ['RECHERCHEH'],
  
  // Index/Match vs XLOOKUP
  'RECHERCHEX': ['XLOOKUP'],
  'XLOOKUP': ['RECHERCHEX'],
  
  // SI
  'SI': ['IF'],
  'IF': ['SI'],
  
  // Agrégations
  'SOMME': ['SUM'],
  'SUM': ['SOMME'],
  
  'MOYENNE': ['AVERAGE'],
  'AVERAGE': ['MOYENNE'],
  
  'NB': ['COUNT'],
  'COUNT': ['NB'],
  
  'NBVAL': ['COUNTA'],
  'COUNTA': ['NBVAL'],
  
  'MIN': ['MIN'],
  'MAX': ['MAX'],
  
  // Produit
  'SOMMEPROD': ['SUMPRODUCT'],
  'SUMPRODUCT': ['SOMMEPROD'],
  
  // Index/Equiv
  'INDEX': ['INDEX'],
  'EQUIV': ['MATCH'],
  'MATCH': ['EQUIV']
};

/**
 * Patterns de formules alternatives acceptables
 * Certaines formules peuvent être écrites de plusieurs façons
 */
const ALTERNATIVE_PATTERNS = {
  // SOMME.SI peut avoir l'ordre critère/plage inversé dans certains cas
  'SOMME.SI': [
    /SOMME\.SI\s*\(\s*([^;,]+)\s*[;,]\s*("[^"]*"|[^;,]+)\s*[;,]\s*([^)]+)\)/i,
    /SUMIF\s*\(\s*([^;,]+)\s*[;,]\s*("[^"]*"|[^;,]+)\s*[;,]\s*([^)]+)\)/i
  ],
  
  // NB.SI - le critère peut être avec ou sans guillemets pour les nombres
  'NB.SI': [
    /NB\.SI\s*\(\s*([^;,]+)\s*[;,]\s*("[^"]*"|[^;,)]+)\s*\)/i,
    /COUNTIF\s*\(\s*([^;,]+)\s*[;,]\s*("[^"]*"|[^;,)]+)\s*\)/i
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export class FlexibleFormulaValidator {
  
  constructor(options = {}) {
    this.options = {
      // Tolérance sur les plages (nombre de lignes de différence acceptée)
      rangeTolerance: options.rangeTolerance ?? 5,
      
      // Accepter les références absolues/relatives comme équivalentes
      ignoreAbsoluteRelative: options.ignoreAbsoluteRelative ?? true,
      
      // Tolérance numérique (pour les arrondis)
      numericTolerance: options.numericTolerance ?? 0.01,
      
      // Ignorer la casse
      ignoreCase: options.ignoreCase ?? true,
      
      // Accepter FR/EN comme équivalents
      acceptBothLanguages: options.acceptBothLanguages ?? true,
      
      // Mode strict (désactive les tolérances)
      strictMode: options.strictMode ?? false
    };
  }
  
  /**
   * Valide une formule utilisateur contre une formule attendue
   * 
   * @param {Object} params
   * @param {string} params.userFormula - Formule soumise par l'utilisateur
   * @param {string} params.expectedFormula - Formule attendue (optionnel)
   * @param {Array} params.expectedPatterns - Patterns acceptés (ex: ['SOMME', 'D2:D100'])
   * @param {string} params.expectedFunction - Fonction attendue
   * @param {number} params.expectedValue - Valeur attendue
   * @param {number} params.userValue - Valeur calculée
   * @param {Object} params.checkpoint - Checkpoint complet
   * @returns {Object} { valid, reasons, details }
   */
  validate(params) {
    const {
      userFormula,
      expectedFormula,
      expectedPatterns = [],
      expectedFunction,
      expectedValue,
      userValue,
      checkpoint = {}
    } = params;
    
    const results = {
      valid: false,
      checks: [],
      reasons: [],
      score: 0,
      maxScore: 0
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // CHECK 1: Valeur numérique (le plus important)
    // ─────────────────────────────────────────────────────────────────────────
    if (expectedValue !== undefined && userValue !== undefined) {
      results.maxScore += 50;
      const valueCheck = this.checkValue(userValue, expectedValue);
      results.checks.push({
        name: 'value',
        ...valueCheck,
        weight: 50
      });
      
      if (valueCheck.passed) {
        results.score += 50;
      } else {
        results.reasons.push(valueCheck.reason);
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // CHECK 2: Fonction utilisée
    // ─────────────────────────────────────────────────────────────────────────
    if (expectedFunction && userFormula) {
      results.maxScore += 30;
      const functionCheck = this.checkFunction(userFormula, expectedFunction);
      results.checks.push({
        name: 'function',
        ...functionCheck,
        weight: 30
      });
      
      if (functionCheck.passed) {
        results.score += 30;
      } else {
        results.reasons.push(functionCheck.reason);
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // CHECK 3: Pattern de la formule
    // ─────────────────────────────────────────────────────────────────────────
    if (expectedPatterns.length > 0 && userFormula) {
      results.maxScore += 20;
      const patternCheck = this.checkPatterns(userFormula, expectedPatterns, checkpoint);
      results.checks.push({
        name: 'pattern',
        ...patternCheck,
        weight: 20
      });
      
      if (patternCheck.passed) {
        results.score += 20;
      } else {
        results.reasons.push(patternCheck.reason);
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // CHECK 4: Comparaison directe de formule (si fournie)
    // ─────────────────────────────────────────────────────────────────────────
    if (expectedFormula && userFormula) {
      const directCheck = this.checkFormulaEquivalence(userFormula, expectedFormula);
      results.checks.push({
        name: 'formula_match',
        ...directCheck,
        weight: 0 // Bonus, pas obligatoire
      });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Décision finale
    // ─────────────────────────────────────────────────────────────────────────
    
    // En mode strict, tous les checks doivent passer
    if (this.options.strictMode) {
      results.valid = results.checks.every(c => c.passed);
    } else {
      // En mode normal : valeur correcte OU (fonction + pattern corrects)
      const valueOk = results.checks.find(c => c.name === 'value')?.passed;
      const functionOk = results.checks.find(c => c.name === 'function')?.passed;
      const patternOk = results.checks.find(c => c.name === 'pattern')?.passed ?? true;
      
      results.valid = valueOk || (functionOk && patternOk);
    }
    
    // Score en pourcentage
    results.scorePercent = results.maxScore > 0 
      ? Math.round((results.score / results.maxScore) * 100) 
      : 0;
    
    return results;
  }
  
  /**
   * Vérifie si la valeur est correcte
   */
  checkValue(userValue, expectedValue) {
    // Valeurs identiques
    if (userValue === expectedValue) {
      return { passed: true, reason: null };
    }
    
    // Comparaison numérique avec tolérance
    if (typeof userValue === 'number' && typeof expectedValue === 'number') {
      const diff = Math.abs(userValue - expectedValue);
      const relativeDiff = expectedValue !== 0 
        ? diff / Math.abs(expectedValue) 
        : diff;
      
      if (diff <= this.options.numericTolerance || relativeDiff <= 0.001) {
        return { 
          passed: true, 
          reason: null,
          note: `Tolérance appliquée (diff: ${diff.toFixed(4)})`
        };
      }
      
      return {
        passed: false,
        reason: `Valeur incorrecte: ${userValue} au lieu de ${expectedValue}`,
        diff: diff,
        relativeDiff: relativeDiff
      };
    }
    
    // Comparaison de strings (ignorer casse et espaces)
    if (typeof userValue === 'string' && typeof expectedValue === 'string') {
      const normalizedUser = userValue.trim().toLowerCase();
      const normalizedExpected = expectedValue.trim().toLowerCase();
      
      if (normalizedUser === normalizedExpected) {
        return { passed: true, reason: null };
      }
    }
    
    return {
      passed: false,
      reason: `Valeur incorrecte: ${userValue} au lieu de ${expectedValue}`
    };
  }
  
  /**
   * Vérifie si la bonne fonction est utilisée
   */
  checkFunction(userFormula, expectedFunction) {
    const formula = userFormula.toUpperCase();
    const expected = expectedFunction.toUpperCase();
    
    // Vérification directe
    if (containsFunction(formula, expected)) {
      return { passed: true, reason: null, found: expected };
    }
    
    // Vérifier les équivalences (FR/EN)
    if (this.options.acceptBothLanguages) {
      const equivalents = FUNCTION_EQUIVALENCES[expected] || [];
      for (const equiv of equivalents) {
        if (containsFunction(formula, equiv)) {
          return { 
            passed: true, 
            reason: null, 
            found: equiv,
            note: `Équivalent accepté: ${equiv}`
          };
        }
      }
      
      // Vérifier aussi la traduction directe
      const frEquiv = FUNCTION_MAPPING_EN_TO_FR[expected];
      const enEquiv = FUNCTION_MAPPING_FR_TO_EN[expected];
      
      if (frEquiv && containsFunction(formula, frEquiv)) {
        return { passed: true, reason: null, found: frEquiv };
      }
      if (enEquiv && containsFunction(formula, enEquiv)) {
        return { passed: true, reason: null, found: enEquiv };
      }
    }
    
    // Extraire la fonction utilisée pour le message d'erreur
    const usedFunction = this.extractMainFunction(formula);
    
    return {
      passed: false,
      reason: `Fonction ${usedFunction || 'inconnue'} utilisée au lieu de ${expected}`,
      expected: expected,
      found: usedFunction
    };
  }
  
  /**
   * Vérifie les patterns attendus dans la formule
   */
  checkPatterns(userFormula, expectedPatterns, checkpoint = {}) {
    const formula = this.normalizeForComparison(userFormula);
    const missingPatterns = [];
    const foundPatterns = [];
    
    for (const pattern of expectedPatterns) {
      // C'est un pattern de colonne ou plage ?
      if (this.isRangePattern(pattern)) {
        const rangeCheck = this.checkRangePattern(formula, pattern, checkpoint);
        if (rangeCheck.found) {
          foundPatterns.push(pattern);
        } else {
          missingPatterns.push(pattern);
        }
      }
      // C'est un nom de fonction ?
      else if (this.isFunctionName(pattern)) {
        if (containsFunction(formula, pattern)) {
          foundPatterns.push(pattern);
        } else {
          // Vérifier les équivalents
          const equivFound = this.checkFunctionEquivalent(formula, pattern);
          if (equivFound) {
            foundPatterns.push(pattern);
          } else {
            missingPatterns.push(pattern);
          }
        }
      }
      // Autre pattern (critère, valeur...)
      else {
        const normalizedPattern = pattern.toUpperCase().replace(/\s/g, '');
        if (formula.includes(normalizedPattern)) {
          foundPatterns.push(pattern);
        } else {
          // Vérifier avec guillemets si c'est un critère texte
          if (formula.includes(`"${normalizedPattern}"`) || 
              formula.includes(`"${pattern}"`)) {
            foundPatterns.push(pattern);
          } else {
            missingPatterns.push(pattern);
          }
        }
      }
    }
    
    const passed = missingPatterns.length === 0;
    
    return {
      passed,
      reason: passed ? null : `Éléments manquants: ${missingPatterns.join(', ')}`,
      found: foundPatterns,
      missing: missingPatterns
    };
  }
  
  /**
   * Compare deux formules pour équivalence
   */
  checkFormulaEquivalence(userFormula, expectedFormula) {
    const normalizedUser = this.normalizeForComparison(userFormula);
    const normalizedExpected = this.normalizeForComparison(expectedFormula);
    
    // Comparaison directe après normalisation
    if (normalizedUser === normalizedExpected) {
      return { passed: true, reason: null };
    }
    
    // Vérifier si c'est juste une différence de référence absolue/relative
    if (this.options.ignoreAbsoluteRelative) {
      const userWithoutDollar = normalizedUser.replace(/\$/g, '');
      const expectedWithoutDollar = normalizedExpected.replace(/\$/g, '');
      
      if (userWithoutDollar === expectedWithoutDollar) {
        return { 
          passed: true, 
          reason: null,
          note: 'Références absolues/relatives ignorées'
        };
      }
    }
    
    return {
      passed: false,
      reason: 'Formule différente de celle attendue'
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTHODES UTILITAIRES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Normalise une formule pour comparaison
   */
  normalizeForComparison(formula) {
    if (!formula) return '';
    
    let normalized = formula
      .toUpperCase()
      .replace(/\s/g, '')        // Supprimer espaces
      .replace(/;/g, ',')        // Unifier séparateurs
      .replace(/^\s*=\s*/, '='); // Normaliser le début
    
    // Supprimer les $ si on ignore absolu/relatif
    if (this.options.ignoreAbsoluteRelative) {
      normalized = normalized.replace(/\$/g, '');
    }
    
    return normalized;
  }
  
  /**
   * Détecte si c'est un pattern de plage
   */
  isRangePattern(pattern) {
    return /^[A-Z]+\d*:?[A-Z]*\d*$/i.test(pattern) || 
           /^[A-Z]+$/i.test(pattern);
  }
  
  /**
   * Détecte si c'est un nom de fonction
   */
  isFunctionName(pattern) {
    const upper = pattern.toUpperCase();
    return FUNCTION_MAPPING_FR_TO_EN[upper] !== undefined ||
           FUNCTION_MAPPING_EN_TO_FR[upper] !== undefined ||
           /^[A-Z.]+$/i.test(pattern);
  }
  
  /**
   * Vérifie un pattern de plage avec tolérance
   */
  checkRangePattern(formula, pattern, checkpoint = {}) {
    const patternUpper = pattern.toUpperCase();
    
    // Pattern exact
    if (formula.includes(patternUpper)) {
      return { found: true, exact: true };
    }
    
    // Si c'est juste une colonne (ex: "D"), vérifier si elle est utilisée
    if (/^[A-Z]+$/i.test(pattern)) {
      const colRegex = new RegExp(`${patternUpper}\\d+`, 'g');
      if (colRegex.test(formula)) {
        return { found: true, column: true };
      }
    }
    
    // Si c'est une plage (ex: "D2:D100"), vérifier avec tolérance
    const rangeMatch = patternUpper.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
    if (rangeMatch) {
      const [, col1, row1, col2, row2] = rangeMatch;
      const expectedStart = parseInt(row1);
      const expectedEnd = parseInt(row2);
      
      // Chercher une plage similaire dans la formule
      const formulaRanges = this.extractRanges(formula);
      for (const range of formulaRanges) {
        if (range.col1 === col1 && range.col2 === col2) {
          const startDiff = Math.abs(range.row1 - expectedStart);
          const endDiff = Math.abs(range.row2 - expectedEnd);
          
          if (startDiff <= this.options.rangeTolerance && 
              endDiff <= this.options.rangeTolerance) {
            return { 
              found: true, 
              approximate: true,
              actualRange: `${range.col1}${range.row1}:${range.col2}${range.row2}`
            };
          }
        }
      }
    }
    
    return { found: false };
  }
  
  /**
   * Extrait les plages d'une formule
   */
  extractRanges(formula) {
    const ranges = [];
    const regex = /([A-Z]+)(\d+):([A-Z]+)(\d+)/gi;
    let match;
    
    while ((match = regex.exec(formula)) !== null) {
      ranges.push({
        col1: match[1].toUpperCase(),
        row1: parseInt(match[2]),
        col2: match[3].toUpperCase(),
        row2: parseInt(match[4]),
        full: match[0]
      });
    }
    
    return ranges;
  }
  
  /**
   * Vérifie si une fonction équivalente est présente
   */
  checkFunctionEquivalent(formula, functionName) {
    const upper = functionName.toUpperCase();
    const equivalents = FUNCTION_EQUIVALENCES[upper] || [];
    
    for (const equiv of equivalents) {
      if (containsFunction(formula, equiv)) {
        return equiv;
      }
    }
    
    return null;
  }
  
  /**
   * Extrait la fonction principale d'une formule
   */
  extractMainFunction(formula) {
    const match = formula.match(/^=?\s*([A-Z][A-Z0-9._]+)\s*\(/i);
    return match ? match[1].toUpperCase() : null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS D'AIDE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crée un validateur avec les options par défaut
 */
export function createValidator(options = {}) {
  return new FlexibleFormulaValidator(options);
}

/**
 * Validation rapide (utilise les options par défaut)
 */
export function quickValidate(userFormula, expectedFormula, expectedValue, userValue) {
  const validator = new FlexibleFormulaValidator();
  return validator.validate({
    userFormula,
    expectedFormula,
    expectedValue,
    userValue
  });
}

/**
 * Vérifie juste si la fonction est correcte
 */
export function validateFunction(userFormula, expectedFunction) {
  const validator = new FlexibleFormulaValidator();
  return validator.checkFunction(userFormula, expectedFunction);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default FlexibleFormulaValidator;
