/**
 * FORMULA NORMALIZER - v1.0 (Phase 1 - T1.3)
 * 
 * Utilitaires pour normaliser les formules Excel :
 * - Conversion FR ↔ EN
 * - Suppression des références absolues ($)
 * - Normalisation des espaces et de la casse
 * 
 * OBJECTIF : Permettre une comparaison flexible des formules
 * indépendamment de la langue ou du style de l'utilisateur.
 */

// ═══════════════════════════════════════════════════════════════════════════
// MAPPING COMPLET FONCTIONS FR ↔ EN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mapping bidirectionnel des fonctions Excel FR → EN
 * Source: Documentation Microsoft Excel + GoalKicker VBA Notes
 */
export const FUNCTION_MAPPING_FR_TO_EN = {
  // ─────────────────────────────────────────────────────────────────────────
  // MATHÉMATIQUES ET TRIGONOMÉTRIE
  // ─────────────────────────────────────────────────────────────────────────
  'SOMME': 'SUM',
  'MOYENNE': 'AVERAGE',
  'MEDIANE': 'MEDIAN',
  'MODE': 'MODE',
  'MIN': 'MIN',
  'MAX': 'MAX',
  'NB': 'COUNT',
  'NBVAL': 'COUNTA',
  'NB.VIDE': 'COUNTBLANK',
  'PRODUIT': 'PRODUCT',
  'SOMMEPROD': 'SUMPRODUCT',
  'ARRONDI': 'ROUND',
  'ARRONDI.INF': 'ROUNDDOWN',
  'ARRONDI.SUP': 'ROUNDUP',
  'ENT': 'INT',
  'TRONQUE': 'TRUNC',
  'ABS': 'ABS',
  'SIGNE': 'SIGN',
  'MOD': 'MOD',
  'PUISSANCE': 'POWER',
  'RACINE': 'SQRT',
  'ALEA': 'RAND',
  'ALEA.ENTRE.BORNES': 'RANDBETWEEN',
  'PI': 'PI',
  'DEGRES': 'DEGREES',
  'RADIANS': 'RADIANS',
  'SIN': 'SIN',
  'COS': 'COS',
  'TAN': 'TAN',
  'EXP': 'EXP',
  'LN': 'LN',
  'LOG': 'LOG',
  'LOG10': 'LOG10',
  'PLAFOND': 'CEILING',
  'PLANCHER': 'FLOOR',
  'QUOTIENT': 'QUOTIENT',
  'PGCD': 'GCD',
  'PPCM': 'LCM',
  'SOUS.TOTAL': 'SUBTOTAL',
  'AGREGAT': 'AGGREGATE',
  
  // ─────────────────────────────────────────────────────────────────────────
  // STATISTIQUES
  // ─────────────────────────────────────────────────────────────────────────
  'ECARTYPE': 'STDEV',
  'ECARTYPE.STANDARD': 'STDEV.S',
  'ECARTYPE.PEARSON': 'STDEV.P',
  'VAR': 'VAR',
  'VAR.S': 'VAR.S',
  'VAR.P': 'VAR.P',
  'GRANDE.VALEUR': 'LARGE',
  'PETITE.VALEUR': 'SMALL',
  'RANG': 'RANK',
  'RANG.POURCENTAGE': 'PERCENTRANK',
  'CENTILE': 'PERCENTILE',
  'QUARTILE': 'QUARTILE',
  'FREQUENCE': 'FREQUENCY',
  'MOYENNE.SI': 'AVERAGEIF',
  'MOYENNE.SI.ENS': 'AVERAGEIFS',
  'NB.SI': 'COUNTIF',
  'NB.SI.ENS': 'COUNTIFS',
  'SOMME.SI': 'SUMIF',
  'SOMME.SI.ENS': 'SUMIFS',
  'MAX.SI.ENS': 'MAXIFS',
  'MIN.SI.ENS': 'MINIFS',
  
  // ─────────────────────────────────────────────────────────────────────────
  // LOGIQUE
  // ─────────────────────────────────────────────────────────────────────────
  'SI': 'IF',
  'SI.CONDITIONS': 'IFS',
  'SI.MULTIPLE': 'SWITCH',
  'SIERREUR': 'IFERROR',
  'SI.NON.DISP': 'IFNA',
  'ET': 'AND',
  'OU': 'OR',
  'OUX': 'XOR',
  'NON': 'NOT',
  'VRAI': 'TRUE',
  'FAUX': 'FALSE',
  'ESTERREUR': 'ISERROR',
  'ESTNA': 'ISNA',
  'ESTVIDE': 'ISBLANK',
  'ESTTEXTE': 'ISTEXT',
  'ESTNUM': 'ISNUMBER',
  'ESTLOGIQUE': 'ISLOGICAL',
  'ESTREF': 'ISREF',
  'ESTERR': 'ISERR',
  'TYPE.ERREUR': 'ERROR.TYPE',
  
  // ─────────────────────────────────────────────────────────────────────────
  // RECHERCHE ET RÉFÉRENCE
  // ─────────────────────────────────────────────────────────────────────────
  'RECHERCHEV': 'VLOOKUP',
  'RECHERCHEH': 'HLOOKUP',
  'RECHERCHEX': 'XLOOKUP',
  'RECHERCHE': 'LOOKUP',
  'INDEX': 'INDEX',
  'EQUIV': 'MATCH',
  'DECALER': 'OFFSET',
  'INDIRECT': 'INDIRECT',
  'ADRESSE': 'ADDRESS',
  'LIGNE': 'ROW',
  'LIGNES': 'ROWS',
  'COLONNE': 'COLUMN',
  'COLONNES': 'COLUMNS',
  'CHOISIR': 'CHOOSE',
  'TRANSPOSE': 'TRANSPOSE',
  'LIEN_HYPERTEXTE': 'HYPERLINK',
  'FILTRE': 'FILTER',
  'UNIQUE': 'UNIQUE',
  'TRIER': 'SORT',
  'TRIERPAR': 'SORTBY',
  'SEQUENCE': 'SEQUENCE',
  
  // ─────────────────────────────────────────────────────────────────────────
  // TEXTE
  // ─────────────────────────────────────────────────────────────────────────
  'CONCATENER': 'CONCATENATE',
  'CONCAT': 'CONCAT',
  'JOINDRE.TEXTE': 'TEXTJOIN',
  'GAUCHE': 'LEFT',
  'DROITE': 'RIGHT',
  'STXT': 'MID',
  'NBCAR': 'LEN',
  'CHERCHE': 'SEARCH',
  'TROUVE': 'FIND',
  'SUBSTITUE': 'SUBSTITUTE',
  'REMPLACER': 'REPLACE',
  'MAJUSCULE': 'UPPER',
  'MINUSCULE': 'LOWER',
  'NOMPROPRE': 'PROPER',
  'SUPPRESPACE': 'TRIM',
  'EPURAGE': 'CLEAN',
  'TEXTE': 'TEXT',
  'CNUM': 'VALUE',
  'CAR': 'CHAR',
  'CODE': 'CODE',
  'REPT': 'REPT',
  'EXACT': 'EXACT',
  'T': 'T',
  'N': 'N',
  'FRANC': 'DOLLAR',
  'CTXT': 'FIXED',
  
  // ─────────────────────────────────────────────────────────────────────────
  // DATE ET HEURE
  // ─────────────────────────────────────────────────────────────────────────
  'AUJOURDHUI': 'TODAY',
  'MAINTENANT': 'NOW',
  'DATE': 'DATE',
  'DATEVAL': 'DATEVALUE',
  'TEMPS': 'TIME',
  'TEMPSVAL': 'TIMEVALUE',
  'ANNEE': 'YEAR',
  'MOIS': 'MONTH',
  'JOUR': 'DAY',
  'HEURE': 'HOUR',
  'MINUTE': 'MINUTE',
  'SECONDE': 'SECOND',
  'JOURSEM': 'WEEKDAY',
  'NO.SEMAINE': 'WEEKNUM',
  'NB.JOURS.OUVRES': 'NETWORKDAYS',
  'NB.JOURS.OUVRES.INTL': 'NETWORKDAYS.INTL',
  'SERIE.JOUR.OUVRE': 'WORKDAY',
  'SERIE.JOUR.OUVRE.INTL': 'WORKDAY.INTL',
  'DATEDIF': 'DATEDIF',
  'FIN.MOIS': 'EOMONTH',
  'MOIS.DECALER': 'EDATE',
  'NB.JOURS.MOIS': 'DAYS',
  'FRACTION.ANNEE': 'YEARFRAC',
  
  // ─────────────────────────────────────────────────────────────────────────
  // FINANCIER
  // ─────────────────────────────────────────────────────────────────────────
  'VAN': 'NPV',
  'TRI': 'IRR',
  'TRI.PAIEMENTS': 'XIRR',
  'VAN.PAIEMENTS': 'XNPV',
  'VPM': 'PMT',
  'VA': 'PV',
  'VC': 'FV',
  'TAUX': 'RATE',
  'NPM': 'NPER',
  'INTPER': 'IPMT',
  'PRINCPER': 'PPMT',
  'AMORLIN': 'SLN',
  'DB': 'DB',
  'DDB': 'DDB',
  
  // ─────────────────────────────────────────────────────────────────────────
  // INFORMATION
  // ─────────────────────────────────────────────────────────────────────────
  'CELLULE': 'CELL',
  'TYPE': 'TYPE',
  'INFORMATIONS': 'INFO',
  'NA': 'NA',
  
  // ─────────────────────────────────────────────────────────────────────────
  // MATRICE (Excel 365 / Dynamic Arrays)
  // ─────────────────────────────────────────────────────────────────────────
  'ASSEMB.H': 'HSTACK',
  'ASSEMB.V': 'VSTACK',
  'PARCOURIR.LIGNE': 'BYROW',
  'PARCOURIR.COLONNE': 'BYCOL',
  'REDUIRE': 'REDUCE',
  'CREER.TABLEAU': 'MAKEARRAY',
  'MAP': 'MAP',
  'LAMBDA': 'LAMBDA',
  'LET': 'LET',
};

// Générer le mapping inverse EN → FR
export const FUNCTION_MAPPING_EN_TO_FR = Object.fromEntries(
  Object.entries(FUNCTION_MAPPING_FR_TO_EN).map(([fr, en]) => [en, fr])
);

// Mapping bidirectionnel (pour recherche rapide dans les deux sens)
export const FUNCTION_MAPPING_BIDIRECTIONAL = {
  ...FUNCTION_MAPPING_FR_TO_EN,
  ...FUNCTION_MAPPING_EN_TO_FR
};

// ═══════════════════════════════════════════════════════════════════════════
// MAPPING DES VALEURS LOGIQUES
// ═══════════════════════════════════════════════════════════════════════════

export const LOGICAL_VALUES_FR_TO_EN = {
  'VRAI': 'TRUE',
  'FAUX': 'FALSE'
};

export const LOGICAL_VALUES_EN_TO_FR = {
  'TRUE': 'VRAI',
  'FALSE': 'FAUX'
};

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS DE NORMALISATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options de normalisation
 * @typedef {Object} NormalizeOptions
 * @property {boolean} removeAbsolute - Supprimer les $ des références (default: true)
 * @property {boolean} toUpperCase - Convertir en majuscules (default: true)
 * @property {boolean} trimSpaces - Normaliser les espaces (default: true)
 * @property {'FR'|'EN'|null} targetLanguage - Langue cible pour les fonctions (null = pas de conversion)
 */

/**
 * Normalise une formule Excel pour comparaison
 * 
 * @param {string} formula - La formule à normaliser
 * @param {NormalizeOptions} options - Options de normalisation
 * @returns {string} Formule normalisée
 * 
 * @example
 * normalizeFormula('=SOMME($A$1:$A$10)') // '=SOMME(A1:A10)'
 * normalizeFormula('=SUM(A1:A10)', { targetLanguage: 'FR' }) // '=SOMME(A1:A10)'
 * normalizeFormula('=somme( A1 : A10 )') // '=SOMME(A1:A10)'
 */
export function normalizeFormula(formula, options = {}) {
  if (!formula || typeof formula !== 'string') {
    return '';
  }
  
  const {
    removeAbsolute = true,
    toUpperCase = true,
    trimSpaces = true,
    targetLanguage = null
  } = options;
  
  let normalized = formula;
  
  // 1. Supprimer les $ des références absolues/mixtes
  if (removeAbsolute) {
    normalized = normalized.replace(/\$/g, '');
  }
  
  // 2. Convertir en majuscules
  if (toUpperCase) {
    normalized = normalized.toUpperCase();
  }
  
  // 3. Normaliser les espaces
  if (trimSpaces) {
    // Supprimer les espaces autour des opérateurs et séparateurs
    normalized = normalized
      .replace(/\s*([+\-*/=<>:;,()[\]{}])\s*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // 4. Convertir les fonctions vers la langue cible
  if (targetLanguage) {
    normalized = convertFunctionsLanguage(normalized, targetLanguage);
  }
  
  return normalized;
}

/**
 * Convertit les fonctions d'une formule vers la langue cible
 * 
 * @param {string} formula - Formule (déjà en majuscules de préférence)
 * @param {'FR'|'EN'} targetLanguage - Langue cible
 * @returns {string} Formule avec fonctions converties
 */
export function convertFunctionsLanguage(formula, targetLanguage) {
  const mapping = targetLanguage === 'FR' 
    ? FUNCTION_MAPPING_EN_TO_FR 
    : FUNCTION_MAPPING_FR_TO_EN;
  
  let converted = formula;
  
  // Trier par longueur décroissante pour éviter les remplacements partiels
  const sortedFunctions = Object.keys(mapping).sort((a, b) => b.length - a.length);
  
  for (const funcName of sortedFunctions) {
    // Remplacer uniquement quand c'est un nom de fonction (suivi de parenthèse)
    const regex = new RegExp(`\\b${escapeRegex(funcName)}\\s*\\(`, 'gi');
    converted = converted.replace(regex, `${mapping[funcName]}(`);
  }
  
  // Convertir aussi les valeurs logiques (VRAI/TRUE, FAUX/FALSE)
  const logicalMapping = targetLanguage === 'FR' 
    ? LOGICAL_VALUES_EN_TO_FR 
    : LOGICAL_VALUES_FR_TO_EN;
  
  for (const [from, to] of Object.entries(logicalMapping)) {
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    converted = converted.replace(regex, to);
  }
  
  return converted;
}

/**
 * Vérifie si deux formules sont équivalentes (indépendamment de la langue et du style)
 * 
 * @param {string} formula1 - Première formule
 * @param {string} formula2 - Deuxième formule
 * @param {NormalizeOptions} options - Options de normalisation
 * @returns {boolean} True si les formules sont équivalentes
 * 
 * @example
 * areFormulasEquivalent('=SOMME($A$1:$A$10)', '=SUM(A1:A10)') // true
 * areFormulasEquivalent('=SI(A1>0;VRAI;FAUX)', '=IF(A1>0,TRUE,FALSE)') // true (si on normalise les séparateurs)
 */
export function areFormulasEquivalent(formula1, formula2, options = {}) {
  // Normaliser les deux formules en FR pour comparaison
  const norm1 = normalizeFormula(formula1, { ...options, targetLanguage: 'FR' });
  const norm2 = normalizeFormula(formula2, { ...options, targetLanguage: 'FR' });
  
  // Normaliser aussi les séparateurs (virgule vs point-virgule)
  const normSep1 = normalizeSeparators(norm1);
  const normSep2 = normalizeSeparators(norm2);
  
  return normSep1 === normSep2;
}

/**
 * Normalise les séparateurs d'arguments (virgule ↔ point-virgule)
 * Note: Cette fonction est simplifiée et peut ne pas gérer tous les cas edge
 */
function normalizeSeparators(formula) {
  // Convertir les virgules en point-virgules (standard FR)
  // Attention: ne pas convertir les virgules dans les chaînes de caractères
  let result = '';
  let inString = false;
  let stringChar = null;
  
  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      result += char;
    } else if (inString && char === stringChar) {
      inString = false;
      stringChar = null;
      result += char;
    } else if (!inString && char === ',') {
      result += ';';
    } else {
      result += char;
    }
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION DE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si une formule contient un pattern (avec normalisation)
 * 
 * @param {string} formula - Formule à vérifier
 * @param {string|string[]} patterns - Pattern(s) à chercher
 * @param {Object} options - Options de validation
 * @param {boolean} options.ignoreAbsolute - Ignorer les $ (default: true)
 * @param {boolean} options.ignoreLang - Accepter FR ou EN (default: true)
 * @param {boolean} options.ignoreCase - Ignorer la casse (default: true)
 * @returns {Object} { matches: boolean, missingPatterns: string[] }
 */
export function validateFormulaPattern(formula, patterns, options = {}) {
  const {
    ignoreAbsolute = true,
    ignoreLang = true,
    ignoreCase = true
  } = options;
  
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  const missingPatterns = [];
  
  // Normaliser la formule
  const normalizedFormula = normalizeFormula(formula, {
    removeAbsolute: ignoreAbsolute,
    toUpperCase: ignoreCase,
    targetLanguage: ignoreLang ? 'FR' : null
  });
  
  for (const pattern of patternList) {
    // Normaliser le pattern aussi
    let normalizedPattern = normalizeFormula(pattern, {
      removeAbsolute: ignoreAbsolute,
      toUpperCase: ignoreCase,
      targetLanguage: ignoreLang ? 'FR' : null
    });
    
    // Si ignoreLang, vérifier les deux versions (FR et EN)
    if (ignoreLang) {
      const patternFR = normalizedPattern;
      const patternEN = convertFunctionsLanguage(pattern.toUpperCase(), 'EN');
      
      if (!normalizedFormula.includes(patternFR) && !normalizedFormula.includes(patternEN)) {
        // Vérifier aussi sans les caractères spéciaux pour les plages
        const simplifiedPattern = normalizedPattern.replace(/[()[\]]/g, '');
        if (!normalizedFormula.includes(simplifiedPattern)) {
          missingPatterns.push(pattern);
        }
      }
    } else {
      if (!normalizedFormula.includes(normalizedPattern)) {
        missingPatterns.push(pattern);
      }
    }
  }
  
  return {
    matches: missingPatterns.length === 0,
    missingPatterns
  };
}

/**
 * Extrait le nom de la fonction principale d'une formule
 * 
 * @param {string} formula - Formule (ex: "=SOMME.SI(A1:A10;B1;C1:C10)")
 * @returns {string|null} Nom de la fonction ou null
 */
export function extractMainFunction(formula) {
  if (!formula || typeof formula !== 'string') return null;
  
  // Enlever le = initial s'il existe
  let f = formula.trim();
  if (f.startsWith('=')) f = f.substring(1);
  
  // Extraire tout jusqu'à la première parenthèse
  const match = f.match(/^([A-Z._]+)\s*\(/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Vérifie si une fonction est utilisée dans une formule (FR ou EN)
 * 
 * @param {string} formula - Formule à vérifier
 * @param {string} functionName - Nom de la fonction (FR ou EN)
 * @returns {boolean}
 */
export function containsFunction(formula, functionName) {
  if (!formula || !functionName) return false;
  
  const normalizedFormula = formula.toUpperCase();
  const funcUpper = functionName.toUpperCase();
  
  // Obtenir les deux versions de la fonction
  const frVersion = FUNCTION_MAPPING_EN_TO_FR[funcUpper] || funcUpper;
  const enVersion = FUNCTION_MAPPING_FR_TO_EN[funcUpper] || funcUpper;
  
  // Vérifier si l'une des versions est présente (suivie d'une parenthèse)
  const regexFR = new RegExp(`\\b${escapeRegex(frVersion)}\\s*\\(`, 'i');
  const regexEN = new RegExp(`\\b${escapeRegex(enVersion)}\\s*\\(`, 'i');
  
  return regexFR.test(normalizedFormula) || regexEN.test(normalizedFormula);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Échappe les caractères spéciaux pour regex
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Obtient l'équivalent d'une fonction dans l'autre langue
 * 
 * @param {string} functionName - Nom de fonction
 * @param {'FR'|'EN'} targetLanguage - Langue cible
 * @returns {string} Fonction dans la langue cible
 */
export function translateFunction(functionName, targetLanguage) {
  if (!functionName) return functionName;
  
  const upper = functionName.toUpperCase();
  
  if (targetLanguage === 'FR') {
    return FUNCTION_MAPPING_EN_TO_FR[upper] || upper;
  } else {
    return FUNCTION_MAPPING_FR_TO_EN[upper] || upper;
  }
}

/**
 * Liste toutes les fonctions présentes dans une formule
 * 
 * @param {string} formula - Formule à analyser
 * @returns {string[]} Liste des fonctions trouvées (en FR)
 */
export function listFunctionsInFormula(formula) {
  if (!formula || typeof formula !== 'string') return [];
  
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

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Mappings
  FUNCTION_MAPPING_FR_TO_EN,
  FUNCTION_MAPPING_EN_TO_FR,
  FUNCTION_MAPPING_BIDIRECTIONAL,
  
  // Fonctions principales
  normalizeFormula,
  convertFunctionsLanguage,
  areFormulasEquivalent,
  validateFormulaPattern,
  
  // Utilitaires
  extractMainFunction,
  containsFunction,
  translateFunction,
  listFunctionsInFormula
};
