/**
 * COMPETENCE VALIDATION MAP - v1.0
 * 
 * Définit pour chaque compétence Excel :
 * - Le type de validation supporté (full_auto, semi_auto, manual, tutorial)
 * - Les règles de validation automatisable
 * - Les types de checkpoints supportés
 * 
 * TYPES DE VALIDATION :
 * - full_auto    : Validation 100% automatique (formules, valeurs)
 * - semi_auto    : Validation partielle + screenshot Claude Vision
 * - manual       : Vérification du résultat final uniquement
 * - tutorial     : Pas de validation, juste un tuto guidé
 */

// ═══════════════════════════════════════════════════════════════════════════
// MAPPING COMPÉTENCE → TYPE DE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export const VALIDATION_MAP = {
    // ─────────────────────────────────────────────────────────────────────────
    // NIVEAU DÉBUTANT (1-10) - Majoritairement full_auto
    // ─────────────────────────────────────────────────────────────────────────
    1:  { type: 'full_auto', checkpointTypes: ['valeur'], description: 'Saisie de données' },
    2:  { type: 'semi_auto', checkpointTypes: ['format'], description: 'Formatage cellules', needsScreenshot: true },
    3:  { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'sum', description: 'SOMME' },
    4:  { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'average', description: 'MOYENNE' },
    5:  { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'minmax', description: 'MIN/MAX' },
    6:  { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'Copier-coller' },
    7:  { type: 'semi_auto', checkpointTypes: ['ordre'], description: 'Tri simple', needsScreenshot: true },
    8:  { type: 'semi_auto', checkpointTypes: ['filtre'], description: 'Filtres basiques', needsScreenshot: true },
    9:  { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'conditional', description: 'SI simple' },
    10: { type: 'semi_auto', checkpointTypes: ['format_conditionnel'], description: 'MFC simple', needsScreenshot: true },
  
    // ─────────────────────────────────────────────────────────────────────────
    // NIVEAU INTERMÉDIAIRE (11-25) - Mix full_auto et semi_auto
    // ─────────────────────────────────────────────────────────────────────────
    11: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'countif', description: 'NB.SI' },
    12: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'countifs', description: 'NB.SI.ENS' },
    13: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'sumif', description: 'SOMME.SI' },
    14: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'sumifs', description: 'SOMME.SI.ENS' },
    15: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'Références absolues ($)' },
    16: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'nested_if', description: 'SI imbriqués' },
    17: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'Fonctions texte' },
    18: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'lookup', description: 'RECHERCHEV' },
    19: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'CONCATENER / CONCAT' },
    20: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'Fonctions date' },
    21: { type: 'semi_auto', checkpointTypes: ['graphique'], description: 'Graphiques basiques', needsScreenshot: true },
    22: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'SIERREUR' },
    23: { type: 'semi_auto', checkpointTypes: ['tcd'], description: 'TCD basique', needsScreenshot: true },
    24: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'index_match', description: 'INDEX+EQUIV' },
    25: { type: 'semi_auto', checkpointTypes: ['validation_donnees'], description: 'Validation données', needsScreenshot: false },
  
    // ─────────────────────────────────────────────────────────────────────────
    // NIVEAU AVANCÉ (26-50) - Plus de semi_auto et manual
    // ─────────────────────────────────────────────────────────────────────────
    26: { type: 'semi_auto', checkpointTypes: ['tcd_avance'], description: 'TCD avancé', needsScreenshot: true },
    27: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'Tableaux structurés' },
    28: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'sumproduct', description: 'SOMMEPROD' },
    29: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'Fonctions matricielles' },
    30: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'INDIRECT' },
    31: { type: 'semi_auto', checkpointTypes: ['graphique_avance'], description: 'Graphiques avancés', needsScreenshot: true },
    32: { type: 'semi_auto', checkpointTypes: ['format_conditionnel_avance'], description: 'MFC avancée', needsScreenshot: true },
    33: { type: 'tutorial', checkpointTypes: [], description: 'Macros enregistrées', needsVideo: true },
    34: { type: 'tutorial', checkpointTypes: [], description: 'VBA basique', needsVideo: true },
    35: { type: 'manual', checkpointTypes: ['resultat_final'], description: 'Power Query Import', needsVideo: true },
    36: { type: 'manual', checkpointTypes: ['resultat_final'], description: 'Power Query Transform', needsVideo: true },
    37: { type: 'manual', checkpointTypes: ['resultat_final'], description: 'Power Query Merge', needsVideo: true },
    38: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'XLOOKUP' },
    39: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'Fonctions dynamiques (FILTER, SORT, UNIQUE)' },
    40: { type: 'semi_auto', checkpointTypes: ['dashboard'], description: 'Tableaux de bord', needsScreenshot: true },
    41: { type: 'tutorial', checkpointTypes: [], description: 'VBA intermédiaire', needsVideo: true },
    42: { type: 'manual', checkpointTypes: ['resultat_final'], description: 'Power Query avancé', needsVideo: true },
    43: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'LAMBDA' },
    44: { type: 'tutorial', checkpointTypes: [], description: 'VBA avancé', needsVideo: true },
    45: { type: 'semi_auto', checkpointTypes: ['graphique_dynamique'], description: 'Graphiques dynamiques', needsScreenshot: true },
    46: { type: 'manual', checkpointTypes: ['resultat_final'], description: 'Power Pivot', needsVideo: true },
    47: { type: 'tutorial', checkpointTypes: [], description: 'Optimisation performance', needsVideo: true },
    48: { type: 'tutorial', checkpointTypes: [], description: 'Power BI Desktop', needsVideo: true },
    49: { type: 'tutorial', checkpointTypes: [], description: 'Python/R dans Excel', needsVideo: true },
    50: { type: 'tutorial', checkpointTypes: [], description: 'Architecture solutions', needsVideo: true },
  
    // ─────────────────────────────────────────────────────────────────────────
    // NOUVELLES COMPÉTENCES (51-58)
    // ─────────────────────────────────────────────────────────────────────────
    51: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'Références mixtes' },
    52: { type: 'semi_auto', checkpointTypes: ['serie'], description: 'Génération de séries', needsScreenshot: true },
    53: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'lookup_approx', description: 'RECHERCHEV approchée' },
    54: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'hlookup', description: 'RECHERCHEH' },
    55: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], computation: 'database', description: 'Fonctions BD' },
    56: { type: 'full_auto', checkpointTypes: ['formule', 'valeur'], description: 'Références structurées' },
    57: { type: 'semi_auto', checkpointTypes: ['filtre_avance'], description: 'Filtres avancés', needsScreenshot: true },
    58: { type: 'full_auto', checkpointTypes: ['valeur'], description: 'Collage spécial valeurs' }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TYPES DE COMPUTATION SUPPORTÉS
  // ═══════════════════════════════════════════════════════════════════════════
  
  export const COMPUTATION_TYPES = {
    // Agrégations simples
    sum: {
      name: 'Somme',
      formula: 'SOMME',
      compute: (values) => values.reduce((a, b) => a + b, 0)
    },
    average: {
      name: 'Moyenne',
      formula: 'MOYENNE',
      compute: (values) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    },
    min: {
      name: 'Minimum',
      formula: 'MIN',
      compute: (values) => Math.min(...values)
    },
    max: {
      name: 'Maximum',
      formula: 'MAX',
      compute: (values) => Math.max(...values)
    },
    count: {
      name: 'Compte',
      formula: 'NB',
      compute: (values) => values.filter(v => typeof v === 'number').length
    },
    counta: {
      name: 'Compte non vide',
      formula: 'NBVAL',
      compute: (values) => values.filter(v => v !== null && v !== undefined && v !== '').length
    },
  
    // Conditionnels
    countif: {
      name: 'Compte conditionnel',
      formula: 'NB.SI',
      compute: (values, criteria) => values.filter(v => matchCriteria(v, criteria)).length
    },
    countifs: {
      name: 'Compte multi-conditions',
      formula: 'NB.SI.ENS',
      compute: (rows, criteriaList) => {
        return rows.filter(row => 
          criteriaList.every(c => matchCriteria(row[c.columnIndex], c.criteria))
        ).length;
      }
    },
    sumif: {
      name: 'Somme conditionnelle',
      formula: 'SOMME.SI',
      compute: (criteriaValues, criteria, sumValues) => {
        let total = 0;
        for (let i = 0; i < criteriaValues.length; i++) {
          if (matchCriteria(criteriaValues[i], criteria)) {
            total += (parseFloat(sumValues[i]) || 0);
          }
        }
        return total;
      }
    },
    sumifs: {
      name: 'Somme multi-conditions',
      formula: 'SOMME.SI.ENS',
      compute: (rows, sumColumnIndex, criteriaList) => {
        return rows
          .filter(row => criteriaList.every(c => matchCriteria(row[c.columnIndex], c.criteria)))
          .reduce((sum, row) => sum + (parseFloat(row[sumColumnIndex]) || 0), 0);
      }
    },
  
    // Recherches
    lookup: {
      name: 'Recherche verticale',
      formula: 'RECHERCHEV',
      compute: (searchValue, table, searchColIndex, returnColIndex, approximate = false) => {
        for (const row of table) {
          if (approximate) {
            // Approché : trouve la plus grande valeur <= searchValue
            // (table doit être triée)
            if (row[searchColIndex] <= searchValue) {
              continue; // On continue tant qu'on trouve des valeurs <=
            }
            // On a dépassé, donc la ligne précédente était la bonne
            const prevIndex = table.indexOf(row) - 1;
            if (prevIndex >= 0) {
              return table[prevIndex][returnColIndex];
            }
          } else {
            // Exact
            if (row[searchColIndex] === searchValue) {
              return row[returnColIndex];
            }
          }
        }
        // Pour approché, si on arrive à la fin, c'est la dernière ligne
        if (approximate && table.length > 0) {
          return table[table.length - 1][returnColIndex];
        }
        return '#N/A';
      }
    },
    index_match: {
      name: 'INDEX EQUIV',
      formula: 'INDEX+EQUIV',
      compute: (searchValue, searchColumn, returnColumn) => {
        const index = searchColumn.findIndex(v => v === searchValue);
        if (index === -1) return '#N/A';
        return returnColumn[index];
      }
    },
  
    // Conditionnel
    conditional: {
      name: 'Conditionnel',
      formula: 'SI',
      compute: (value, condition, valueIfTrue, valueIfFalse) => {
        return evaluateCondition(value, condition) ? valueIfTrue : valueIfFalse;
      }
    },
  
    // Produit
    sumproduct: {
      name: 'Somme produit',
      formula: 'SOMMEPROD',
      compute: (arrays) => {
        if (!arrays || arrays.length === 0) return 0;
        const length = arrays[0].length;
        let total = 0;
        for (let i = 0; i < length; i++) {
          let product = 1;
          for (const arr of arrays) {
            product *= (parseFloat(arr[i]) || 0);
          }
          total += product;
        }
        return total;
      }
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Évalue si une valeur correspond à un critère
   * Supporte : "valeur", ">10", "<5", ">=10", "<=5", "<>valeur", "*wildcard*"
   */
  function matchCriteria(value, criteria) {
    if (criteria === null || criteria === undefined) return true;
    
    const criteriaStr = String(criteria);
    
    // Opérateurs de comparaison
    if (criteriaStr.startsWith('>=')) {
      return parseFloat(value) >= parseFloat(criteriaStr.slice(2));
    }
    if (criteriaStr.startsWith('<=')) {
      return parseFloat(value) <= parseFloat(criteriaStr.slice(2));
    }
    if (criteriaStr.startsWith('<>')) {
      return String(value).toLowerCase() !== criteriaStr.slice(2).toLowerCase();
    }
    if (criteriaStr.startsWith('>')) {
      return parseFloat(value) > parseFloat(criteriaStr.slice(1));
    }
    if (criteriaStr.startsWith('<')) {
      return parseFloat(value) < parseFloat(criteriaStr.slice(1));
    }
    
    // Wildcards
    if (criteriaStr.includes('*') || criteriaStr.includes('?')) {
      const regex = new RegExp(
        '^' + criteriaStr
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.') + '$',
        'i'
      );
      return regex.test(String(value));
    }
    
    // Égalité simple (insensible à la casse pour le texte)
    if (typeof value === 'string') {
      return value.toLowerCase() === criteriaStr.toLowerCase();
    }
    
    return value == criteria; // == pour permettre "10" == 10
  }
  
  /**
   * Évalue une condition simple
   * Supporte : ">10", "<5", ">=10", "<=5", "=10", "<>10"
   */
  function evaluateCondition(value, condition) {
    const condStr = String(condition);
    
    if (condStr.startsWith('>=')) {
      return parseFloat(value) >= parseFloat(condStr.slice(2));
    }
    if (condStr.startsWith('<=')) {
      return parseFloat(value) <= parseFloat(condStr.slice(2));
    }
    if (condStr.startsWith('<>')) {
      return value != condStr.slice(2);
    }
    if (condStr.startsWith('>')) {
      return parseFloat(value) > parseFloat(condStr.slice(1));
    }
    if (condStr.startsWith('<')) {
      return parseFloat(value) < parseFloat(condStr.slice(1));
    }
    if (condStr.startsWith('=')) {
      return value == condStr.slice(1);
    }
    
    // Par défaut, égalité
    return value == condition;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // API PUBLIQUE
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Obtient les informations de validation pour une compétence
   * @param {number} competenceId - ID de la compétence
   * @returns {Object} { type, checkpointTypes, description, needsScreenshot?, needsVideo? }
   */
  export function getValidationInfo(competenceId) {
    return VALIDATION_MAP[competenceId] || {
      type: 'manual',
      checkpointTypes: ['valeur'],
      description: 'Compétence inconnue'
    };
  }
  
  /**
   * Vérifie si une compétence est entièrement automatisable
   * @param {number} competenceId - ID de la compétence
   * @returns {boolean}
   */
  export function isFullyAutomatable(competenceId) {
    const info = VALIDATION_MAP[competenceId];
    return info?.type === 'full_auto';
  }
  
  /**
   * Vérifie si une compétence nécessite un screenshot
   * @param {number} competenceId - ID de la compétence
   * @returns {boolean}
   */
  export function needsScreenshot(competenceId) {
    const info = VALIDATION_MAP[competenceId];
    return info?.needsScreenshot === true;
  }
  
  /**
   * Vérifie si une compétence nécessite une vidéo tutoriel
   * @param {number} competenceId - ID de la compétence
   * @returns {boolean}
   */
  export function needsVideoTutorial(competenceId) {
    const info = VALIDATION_MAP[competenceId];
    return info?.needsVideo === true || info?.type === 'tutorial';
  }
  
  /**
   * Obtient toutes les compétences automatisables
   * @returns {number[]} Liste des IDs de compétences full_auto
   */
  export function getAutomatableCompetences() {
    return Object.entries(VALIDATION_MAP)
      .filter(([_, info]) => info.type === 'full_auto')
      .map(([id]) => parseInt(id));
  }
  
  /**
   * Obtient toutes les compétences nécessitant un screenshot
   * @returns {number[]} Liste des IDs
   */
  export function getScreenshotCompetences() {
    return Object.entries(VALIDATION_MAP)
      .filter(([_, info]) => info.needsScreenshot)
      .map(([id]) => parseInt(id));
  }
  
  /**
   * Obtient toutes les compétences nécessitant un tutoriel
   * @returns {number[]} Liste des IDs
   */
  export function getTutorialCompetences() {
    return Object.entries(VALIDATION_MAP)
      .filter(([_, info]) => info.type === 'tutorial' || info.needsVideo)
      .map(([id]) => parseInt(id));
  }
  
  /**
   * Obtient le type de computation pour une compétence
   * @param {number} competenceId - ID de la compétence
   * @returns {Object|null} Configuration du computation ou null
   */
  export function getComputationType(competenceId) {
    const info = VALIDATION_MAP[competenceId];
    if (!info?.computation) return null;
    return COMPUTATION_TYPES[info.computation] || null;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Export des helpers pour utilisation dans ComputationEngine
  export { matchCriteria, evaluateCondition };
  
  export default {
    VALIDATION_MAP,
    COMPUTATION_TYPES,
    getValidationInfo,
    isFullyAutomatable,
    needsScreenshot,
    needsVideoTutorial,
    getAutomatableCompetences,
    getScreenshotCompetences,
    getTutorialCompetences,
    getComputationType,
    matchCriteria,
    evaluateCondition
  };