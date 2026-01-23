/**
 * COMPUTATION ENGINE - v1.0
 * 
 * Moteur de calcul pour enrichir les checkpoints avec expected_value.
 * 
 * RESPONSABILITÉS :
 * 1. Calculer les statistiques d'un dataset (colonnes numériques, texte, valeurs uniques)
 * 2. Exécuter les "computation" des checkpoints pour obtenir expected_value
 * 3. Formater les stats pour les prompts Claude
 * 
 * PRINCIPES :
 * - Claude CONÇOIT (structure, contexte, computation.type)
 * - Le CODE CALCULE (expected_value, tolerance)
 */

import { COMPUTATION_TYPES, matchCriteria } from './CompetenceValidationMap.js';

// ═══════════════════════════════════════════════════════════════════════════
// CALCUL DES STATISTIQUES D'UN DATASET
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcule les statistiques complètes d'un dataset
 * @param {string[]} headers - En-têtes des colonnes
 * @param {Array[]} rows - Lignes de données
 * @returns {Object} Statistiques détaillées par colonne
 */
export function computeDatasetStats(headers, rows) {
  if (!headers || !rows || rows.length === 0) {
    return {
      rowCount: 0,
      columns: {},
      numericColumns: [],
      textColumns: [],
      dateColumns: []
    };
  }

  const stats = {
    rowCount: rows.length,
    columns: {},
    numericColumns: [],
    textColumns: [],
    dateColumns: []
  };

  // Analyser chaque colonne
  headers.forEach((header, colIndex) => {
    const values = rows.map(row => row[colIndex]).filter(v => v !== null && v !== undefined && v !== '');
    
    const colStats = analyzeColumn(header, values, colIndex);
    stats.columns[header] = colStats;

    // Classifier la colonne
    if (colStats.type === 'number') {
      stats.numericColumns.push({
        name: header,
        index: colIndex,
        letter: indexToLetter(colIndex),
        ...colStats
      });
    } else if (colStats.type === 'date') {
      stats.dateColumns.push({
        name: header,
        index: colIndex,
        letter: indexToLetter(colIndex),
        ...colStats
      });
    } else {
      stats.textColumns.push({
        name: header,
        index: colIndex,
        letter: indexToLetter(colIndex),
        ...colStats
      });
    }
  });

  return stats;
}

/**
 * Analyse une colonne pour déterminer son type et ses statistiques
 */
function analyzeColumn(name, values, index) {
  if (values.length === 0) {
    return { type: 'empty', count: 0 };
  }

  // Détecter le type dominant
  const types = values.map(v => detectValueType(v));
  const typeCounts = {};
  types.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });
  
  const dominantType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  const stats = {
    type: dominantType,
    count: values.length,
    nullCount: values.filter(v => v === null || v === undefined || v === '').length
  };

  if (dominantType === 'number') {
    const numValues = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    stats.sum = numValues.reduce((a, b) => a + b, 0);
    stats.average = numValues.length > 0 ? stats.sum / numValues.length : 0;
    stats.min = Math.min(...numValues);
    stats.max = Math.max(...numValues);
    stats.median = calculateMedian(numValues);
  } else if (dominantType === 'text') {
    const uniqueValues = [...new Set(values.map(v => String(v)))];
    stats.uniqueCount = uniqueValues.length;
    stats.uniqueValues = uniqueValues.slice(0, 20); // Limiter pour les gros datasets
    
    // Compter les occurrences
    const valueCounts = {};
    values.forEach(v => {
      const key = String(v);
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    });
    stats.valueCounts = valueCounts;
    stats.mostCommon = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));
  } else if (dominantType === 'date') {
    const dateValues = values.map(v => parseDate(v)).filter(d => d !== null);
    if (dateValues.length > 0) {
      stats.minDate = new Date(Math.min(...dateValues));
      stats.maxDate = new Date(Math.max(...dateValues));
    }
  }

  return stats;
}

/**
 * Détecte le type d'une valeur
 */
function detectValueType(value) {
  if (value === null || value === undefined || value === '') {
    return 'empty';
  }
  
  // Nombre
  if (typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value))) {
    return 'number';
  }
  
  // Date (formats courants)
  if (value instanceof Date) {
    return 'date';
  }
  
  const datePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // DD/MM/YYYY ou MM/DD/YYYY
    /^\d{4}-\d{2}-\d{2}$/,          // YYYY-MM-DD
    /^\d{1,2}-[a-zA-Z]{3}-\d{2,4}$/ // DD-MMM-YYYY
  ];
  
  if (typeof value === 'string' && datePatterns.some(p => p.test(value))) {
    return 'date';
  }
  
  return 'text';
}

/**
 * Parse une date (plusieurs formats supportés)
 */
function parseDate(value) {
  if (value instanceof Date) return value.getTime();
  
  // Essayer les formats courants
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return parsed.getTime();
  
  // Format DD/MM/YYYY
  const match = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = year.length === 2 ? (parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year)) : parseInt(year);
    return new Date(fullYear, parseInt(month) - 1, parseInt(day)).getTime();
  }
  
  return null;
}

/**
 * Calcule la médiane
 */
function calculateMedian(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Convertit un index de colonne en lettre (0 -> A, 25 -> Z, 26 -> AA)
 */
function indexToLetter(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

// ═══════════════════════════════════════════════════════════════════════════
// RÉSOLUTION DES COLONNES "AUTO" (Phase 1 - T1.1.1)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Résout automatiquement "auto" vers une vraie colonne
 * 
 * PROBLÈME : Claude génère parfois `"column": "auto"` au lieu du vrai nom
 * SOLUTION : Inférer la meilleure colonne selon le type de computation et les stats
 * 
 * @param {Object} computation - L'objet computation du checkpoint
 * @param {Object} stats - Statistiques du dataset (de computeDatasetStats)
 * @param {Object} compInfo - Informations sur la compétence (optionnel)
 * @returns {Object} Computation avec colonnes résolues
 */
export function resolveAutoColumn(computation, stats, compInfo = null) {
  if (!computation) return computation;
  
  const resolved = { ...computation };
  const numericCols = stats?.numericColumns || [];
  const textCols = stats?.textColumns || [];
  
  // Mots-clés pour identifier les colonnes pertinentes
  const NUMERIC_KEYWORDS = {
    sum: ['total', 'montant', 'ca', 'chiffre', 'vente', 'prix', 'cout', 'coût', 'revenue', 'amount', 'sales'],
    average: ['moyenne', 'prix', 'note', 'score', 'taux', 'avg', 'rate'],
    count: ['quantite', 'quantité', 'nb', 'nombre', 'qty', 'count'],
    min: ['prix', 'cout', 'coût', 'montant', 'price', 'cost'],
    max: ['prix', 'ca', 'montant', 'vente', 'sales', 'revenue']
  };
  
  const TEXT_KEYWORDS = {
    criteria: ['region', 'région', 'categorie', 'catégorie', 'type', 'statut', 'status', 'pays', 'ville', 'client', 'produit', 'segment'],
    lookup: ['nom', 'name', 'id', 'code', 'reference', 'référence', 'produit', 'product']
  };
  
  /**
   * Trouve la meilleure colonne numérique
   */
  const findBestNumericColumn = (keywords) => {
    // Priorité 1: correspondance exacte avec un mot-clé
    for (const kw of keywords) {
      const match = numericCols.find(c => 
        c.name.toLowerCase().includes(kw)
      );
      if (match) return match.name;
    }
    
    // Priorité 2: première colonne avec sum > 0
    const withSum = numericCols.find(c => c.sum && c.sum > 0);
    if (withSum) return withSum.name;
    
    // Fallback: première colonne numérique
    return numericCols[0]?.name || null;
  };
  
  /**
   * Trouve la meilleure colonne texte
   */
  const findBestTextColumn = (keywords) => {
    // Priorité 1: correspondance avec un mot-clé
    for (const kw of keywords) {
      const match = textCols.find(c => 
        c.name.toLowerCase().includes(kw)
      );
      if (match) return match.name;
    }
    
    // Priorité 2: colonne avec un nombre modéré de valeurs uniques (2-20)
    const goodCardinality = textCols.find(c => 
      c.uniqueCount && c.uniqueCount >= 2 && c.uniqueCount <= 20
    );
    if (goodCardinality) return goodCardinality.name;
    
    // Fallback: première colonne texte
    return textCols[0]?.name || null;
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Résolution selon le type de computation
  // ─────────────────────────────────────────────────────────────────────────
  
  const type = computation.type;
  
  switch (type) {
    // Agrégations simples - besoin d'une colonne numérique
    case 'sum':
    case 'average':
    case 'min':
    case 'max':
    case 'count':
    case 'counta':
      if (resolved.column === 'auto' || !resolved.column) {
        const keywords = NUMERIC_KEYWORDS[type] || NUMERIC_KEYWORDS.sum;
        resolved.column = findBestNumericColumn(keywords);
        resolved._auto_resolved = true;
        console.log(`🔧 [resolveAutoColumn] ${type}: column "auto" → "${resolved.column}"`);
      }
      break;
    
    // COUNTIF - besoin d'une colonne texte pour les critères
    case 'countif':
      if (resolved.column === 'auto' || !resolved.column) {
        resolved.column = findBestTextColumn(TEXT_KEYWORDS.criteria);
        resolved._auto_resolved = true;
        console.log(`🔧 [resolveAutoColumn] countif: column "auto" → "${resolved.column}"`);
      }
      // Si criteria est aussi "auto", prendre la première valeur unique
      if (resolved.criteria === 'auto' && resolved.column) {
        const col = textCols.find(c => c.name === resolved.column);
        resolved.criteria = col?.mostCommon?.[0]?.value || col?.uniqueValues?.[0] || 'Valeur';
        console.log(`🔧 [resolveAutoColumn] countif: criteria "auto" → "${resolved.criteria}"`);
      }
      break;
    
    // SUMIF - besoin de criteria_column (texte) et sum_column (numérique)
    case 'sumif':
      if (resolved.criteria_column === 'auto' || !resolved.criteria_column) {
        resolved.criteria_column = findBestTextColumn(TEXT_KEYWORDS.criteria);
        resolved._auto_resolved = true;
        console.log(`🔧 [resolveAutoColumn] sumif: criteria_column "auto" → "${resolved.criteria_column}"`);
      }
      if (resolved.sum_column === 'auto' || !resolved.sum_column) {
        resolved.sum_column = findBestNumericColumn(NUMERIC_KEYWORDS.sum);
        console.log(`🔧 [resolveAutoColumn] sumif: sum_column "auto" → "${resolved.sum_column}"`);
      }
      // Résoudre criteria si "auto"
      if (resolved.criteria === 'auto' && resolved.criteria_column) {
        const col = textCols.find(c => c.name === resolved.criteria_column);
        resolved.criteria = col?.mostCommon?.[0]?.value || col?.uniqueValues?.[0] || 'Valeur';
        console.log(`🔧 [resolveAutoColumn] sumif: criteria "auto" → "${resolved.criteria}"`);
      }
      break;
    
    // SUMIFS - similaire à SUMIF mais avec criteria_list
    case 'sumifs':
      if (resolved.sum_column === 'auto' || !resolved.sum_column) {
        resolved.sum_column = findBestNumericColumn(NUMERIC_KEYWORDS.sum);
        resolved._auto_resolved = true;
        console.log(`🔧 [resolveAutoColumn] sumifs: sum_column "auto" → "${resolved.sum_column}"`);
      }
      // Résoudre chaque critère dans criteria_list
      if (resolved.criteria_list && Array.isArray(resolved.criteria_list)) {
        resolved.criteria_list = resolved.criteria_list.map((crit, i) => {
          const newCrit = { ...crit };
          if (newCrit.column === 'auto' || !newCrit.column) {
            newCrit.column = textCols[i]?.name || findBestTextColumn(TEXT_KEYWORDS.criteria);
            console.log(`🔧 [resolveAutoColumn] sumifs criteria_list[${i}].column → "${newCrit.column}"`);
          }
          if (newCrit.criteria === 'auto' && newCrit.column) {
            const col = textCols.find(c => c.name === newCrit.column);
            newCrit.criteria = col?.mostCommon?.[0]?.value || col?.uniqueValues?.[0] || 'Valeur';
          }
          return newCrit;
        });
      }
      break;
    
    // COUNTIFS - similaire à SUMIFS
    case 'countifs':
      if (resolved.criteria_list && Array.isArray(resolved.criteria_list)) {
        resolved.criteria_list = resolved.criteria_list.map((crit, i) => {
          const newCrit = { ...crit };
          if (newCrit.column === 'auto' || !newCrit.column) {
            newCrit.column = textCols[i]?.name || findBestTextColumn(TEXT_KEYWORDS.criteria);
            newCrit._auto_resolved = true;
            console.log(`🔧 [resolveAutoColumn] countifs criteria_list[${i}].column → "${newCrit.column}"`);
          }
          if (newCrit.criteria === 'auto' && newCrit.column) {
            const col = textCols.find(c => c.name === newCrit.column);
            newCrit.criteria = col?.mostCommon?.[0]?.value || col?.uniqueValues?.[0] || 'Valeur';
          }
          return newCrit;
        });
      }
      break;
    
    // AVERAGEIF
    case 'averageif':
      if (resolved.criteria_column === 'auto' || !resolved.criteria_column) {
        resolved.criteria_column = findBestTextColumn(TEXT_KEYWORDS.criteria);
        resolved._auto_resolved = true;
      }
      if (resolved.average_column === 'auto' || !resolved.average_column) {
        resolved.average_column = findBestNumericColumn(NUMERIC_KEYWORDS.average);
      }
      if (resolved.sum_column === 'auto' || !resolved.sum_column) {
        resolved.sum_column = resolved.average_column || findBestNumericColumn(NUMERIC_KEYWORDS.average);
      }
      break;
    
    // LOOKUP / VLOOKUP / INDEX_MATCH
    case 'lookup':
    case 'vlookup':
    case 'lookup_approx':
    case 'index_match':
      if (resolved.search_column === 'auto' || !resolved.search_column) {
        resolved.search_column = findBestTextColumn(TEXT_KEYWORDS.lookup);
        resolved._auto_resolved = true;
        console.log(`🔧 [resolveAutoColumn] ${type}: search_column "auto" → "${resolved.search_column}"`);
      }
      if (resolved.return_column === 'auto' || !resolved.return_column) {
        resolved.return_column = findBestNumericColumn(NUMERIC_KEYWORDS.sum);
        console.log(`🔧 [resolveAutoColumn] ${type}: return_column "auto" → "${resolved.return_column}"`);
      }
      // Résoudre search_value si "auto"
      if (resolved.search_value === 'auto' && resolved.search_column) {
        const col = textCols.find(c => c.name === resolved.search_column);
        resolved.search_value = col?.uniqueValues?.[0] || 'Valeur';
        console.log(`🔧 [resolveAutoColumn] ${type}: search_value "auto" → "${resolved.search_value}"`);
      }
      break;
    
    // HLOOKUP
    case 'hlookup':
      // Pour RECHERCHEH, search_value est dans les headers
      if (resolved.search_value === 'auto') {
        resolved.search_value = numericCols[0]?.name || textCols[0]?.name || 'Colonne';
      }
      break;
    
    // CONDITIONNEL (SI)
    case 'conditional':
    case 'if':
      if (resolved.column === 'auto' || !resolved.column) {
        resolved.column = findBestNumericColumn(NUMERIC_KEYWORDS.sum);
        resolved._auto_resolved = true;
      }
      break;
    
    // SOMMEPROD
    case 'sumproduct':
      if (resolved.columns && Array.isArray(resolved.columns)) {
        resolved.columns = resolved.columns.map((col, i) => {
          if (col === 'auto') {
            return numericCols[i]?.name || findBestNumericColumn(NUMERIC_KEYWORDS.sum);
          }
          return col;
        });
      }
      break;
  }
  
  return resolved;
}

// ═══════════════════════════════════════════════════════════════════════════
// ENRICHISSEMENT DES CHECKPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enrichit les checkpoints avec expected_value calculé
 * @param {Object[]} checkpoints - Liste des checkpoints
 * @param {Object} dataset - { headers, rows }
 * @param {Object} catalogues - Tables de référence additionnelles
 * @param {Object} stats - Statistiques pré-calculées (optionnel, sera calculé si absent)
 * @returns {Object[]} Checkpoints enrichis
 */
export function enrichCheckpoints(checkpoints, dataset, catalogues = {}, stats = null) {
  if (!checkpoints || !Array.isArray(checkpoints)) {
    return [];
  }

  const { headers, rows } = dataset;
  
  // Calculer les stats si non fournies (nécessaire pour resolveAutoColumn)
  const datasetStats = stats || computeDatasetStats(headers, rows);
  
  return checkpoints.map(checkpoint => {
    const enriched = { ...checkpoint };
    
    // Si pas de computation défini, retourner tel quel
    if (!checkpoint.computation) {
      enriched.computation_success = false;
      enriched.computation_error = 'Pas de computation défini';
      return enriched;
    }

    try {
      // ═══════════════════════════════════════════════════════════════════════
      // NOUVEAU (Phase 1 - T1.1.1) : Résoudre les colonnes "auto" AVANT exécution
      // ═══════════════════════════════════════════════════════════════════════
      const resolvedComputation = resolveAutoColumn(checkpoint.computation, datasetStats);
      enriched.computation = resolvedComputation; // Sauvegarder la version résolue
      
      const result = executeComputation(resolvedComputation, headers, rows, catalogues);
      
      enriched.expected_value = result.value;
      enriched.computation_success = true;
      enriched.computation_details = result.details;
      
      // Marquer si auto-résolution a été utilisée
      if (resolvedComputation._auto_resolved) {
        enriched.computation_auto_resolved = true;
      }
      
      // Ajouter une tolérance pour les nombres flottants
      if (typeof result.value === 'number') {
        enriched.tolerance = checkpoint.tolerance || calculateTolerance(result.value);
      }
      
    } catch (error) {
      enriched.computation_success = false;
      enriched.computation_error = error.message;
      console.warn(`⚠️ [ComputationEngine] Erreur calcul checkpoint ${checkpoint.id}:`, error.message);
    }

    return enriched;
  });
}

/**
 * Exécute un computation et retourne la valeur
 */
function executeComputation(computation, headers, rows, catalogues) {
  const { type } = computation;
  
  // Trouver l'index d'une colonne par nom
  const getColumnIndex = (columnName) => {
    const idx = headers.findIndex(h => 
      h.toLowerCase() === columnName.toLowerCase() ||
      h.toLowerCase().includes(columnName.toLowerCase())
    );
    if (idx === -1) {
      throw new Error(`Colonne "${columnName}" non trouvée`);
    }
    return idx;
  };
  
  // Extraire les valeurs d'une colonne
  const getColumnValues = (columnName) => {
    const idx = getColumnIndex(columnName);
    return rows.map(row => row[idx]);
  };
  
  // Extraire les valeurs numériques d'une colonne
  const getNumericValues = (columnName) => {
    return getColumnValues(columnName)
      .map(v => parseFloat(v))
      .filter(n => !isNaN(n));
  };

  switch (type) {
    // ─────────────────────────────────────────────────────────────────────────
    // AGRÉGATIONS SIMPLES
    // ─────────────────────────────────────────────────────────────────────────
    case 'sum': {
      const values = getNumericValues(computation.column);
      const result = values.reduce((a, b) => a + b, 0);
      return { value: result, details: { count: values.length } };
    }
    
    case 'average': {
      const values = getNumericValues(computation.column);
      const result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return { value: result, details: { count: values.length } };
    }
    
    case 'min': {
      const values = getNumericValues(computation.column);
      const result = values.length > 0 ? Math.min(...values) : 0;
      return { value: result, details: { count: values.length } };
    }
    
    case 'max': {
      const values = getNumericValues(computation.column);
      const result = values.length > 0 ? Math.max(...values) : 0;
      return { value: result, details: { count: values.length } };
    }
    
    case 'count': {
      const values = getNumericValues(computation.column);
      return { value: values.length, details: {} };
    }
    
    case 'counta': {
      const values = getColumnValues(computation.column).filter(v => v !== null && v !== undefined && v !== '');
      return { value: values.length, details: {} };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONDITIONNELS
    // ─────────────────────────────────────────────────────────────────────────
    case 'countif': {
      const values = getColumnValues(computation.column);
      const count = values.filter(v => matchCriteria(v, computation.criteria)).length;
      return { value: count, details: { criteria: computation.criteria } };
    }
    
    case 'countifs': {
      const criteriaList = computation.criteria_list || [];
      let matchingRows = rows;
      
      for (const c of criteriaList) {
        const colIdx = getColumnIndex(c.column);
        matchingRows = matchingRows.filter(row => matchCriteria(row[colIdx], c.criteria));
      }
      
      return { value: matchingRows.length, details: { criteriaCount: criteriaList.length } };
    }
    
    case 'sumif': {
      const criteriaValues = getColumnValues(computation.criteria_column);
      const sumValues = getColumnValues(computation.sum_column);
      
      let total = 0;
      for (let i = 0; i < criteriaValues.length; i++) {
        if (matchCriteria(criteriaValues[i], computation.criteria)) {
          total += (parseFloat(sumValues[i]) || 0);
        }
      }
      
      return { value: total, details: { criteria: computation.criteria } };
    }
    
    case 'sumifs': {
      const sumColIdx = getColumnIndex(computation.sum_column);
      const criteriaList = computation.criteria_list || [];
      
      let total = 0;
      for (const row of rows) {
        const matchesAll = criteriaList.every(c => {
          const colIdx = getColumnIndex(c.column);
          return matchCriteria(row[colIdx], c.criteria);
        });
        
        if (matchesAll) {
          total += (parseFloat(row[sumColIdx]) || 0);
        }
      }
      
      return { value: total, details: { criteriaCount: criteriaList.length } };
    }

    case 'averageif': {
      const criteriaValues = getColumnValues(computation.criteria_column);
      const avgValues = getColumnValues(computation.average_column || computation.sum_column);
      
      let total = 0;
      let count = 0;
      for (let i = 0; i < criteriaValues.length; i++) {
        if (matchCriteria(criteriaValues[i], computation.criteria)) {
          const val = parseFloat(avgValues[i]);
          if (!isNaN(val)) {
            total += val;
            count++;
          }
        }
      }
      
      return { value: count > 0 ? total / count : 0, details: { count } };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECHERCHES
    // ─────────────────────────────────────────────────────────────────────────
    case 'lookup_approx': // Alias pour RECHERCHEV approchée (compétence 53)
    case 'lookup':
    case 'vlookup': {
      const searchColIdx = getColumnIndex(computation.search_column);
      const returnColIdx = getColumnIndex(computation.return_column);
      const searchValue = computation.search_value;
      // lookup_approx force le mode approché, sinon utilise le flag
      const approximate = type === 'lookup_approx' ? true : (computation.approximate || false);
      
      if (approximate) {
        // Recherche approchée (table doit être triée)
        let lastMatch = null;
        for (const row of rows) {
          if (row[searchColIdx] <= searchValue) {
            lastMatch = row[returnColIdx];
          } else {
            break;
          }
        }
        return { value: lastMatch ?? '#N/A', details: { approximate: true } };
      } else {
        // Recherche exacte
        const foundRow = rows.find(row => row[searchColIdx] == searchValue);
        return { value: foundRow ? foundRow[returnColIdx] : '#N/A', details: {} };
      }
    }
    
    case 'index_match': {
      const searchColIdx = getColumnIndex(computation.search_column);
      const returnColIdx = getColumnIndex(computation.return_column);
      const searchValue = computation.search_value;
      
      const rowIndex = rows.findIndex(row => row[searchColIdx] == searchValue);
      if (rowIndex === -1) {
        return { value: '#N/A', details: {} };
      }
      
      return { value: rows[rowIndex][returnColIdx], details: { rowIndex } };
    }

    case 'hlookup': {
      // Pour RECHERCHEH, on cherche dans les headers (première ligne)
      const searchValue = computation.search_value;
      const rowIndex = computation.row_index || 2; // Par défaut ligne 2
      
      const colIdx = headers.findIndex(h => h == searchValue);
      if (colIdx === -1) {
        return { value: '#N/A', details: {} };
      }
      
      // rowIndex est 1-based (1 = headers, 2 = première ligne de données)
      const dataRowIdx = rowIndex - 2;
      if (dataRowIdx < 0 || dataRowIdx >= rows.length) {
        return { value: '#REF!', details: {} };
      }
      
      return { value: rows[dataRowIdx][colIdx], details: {} };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONDITIONNEL
    // ─────────────────────────────────────────────────────────────────────────
    case 'conditional':
    case 'if': {
      const colIdx = computation.column ? getColumnIndex(computation.column) : null;
      const testValue = colIdx !== null ? rows[0]?.[colIdx] : computation.test_value;
      
      const result = matchCriteria(testValue, computation.condition)
        ? computation.value_if_true
        : computation.value_if_false;
      
      return { value: result, details: { testValue, condition: computation.condition } };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRODUIT
    // ─────────────────────────────────────────────────────────────────────────
    case 'sumproduct': {
      const arrays = computation.columns.map(colName => getNumericValues(colName));
      
      if (arrays.length === 0 || arrays[0].length === 0) {
        return { value: 0, details: {} };
      }
      
      const length = Math.min(...arrays.map(a => a.length));
      let total = 0;
      for (let i = 0; i < length; i++) {
        let product = 1;
        for (const arr of arrays) {
          product *= (arr[i] || 0);
        }
        total += product;
      }
      
      return { value: total, details: { columns: computation.columns.length } };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AVEC CATALOGUE EXTERNE
    // ─────────────────────────────────────────────────────────────────────────
    case 'lookup_catalogue': {
      const catalogueName = computation.catalogue;
      const catalogue = catalogues[catalogueName];
      
      if (!catalogue) {
        throw new Error(`Catalogue "${catalogueName}" non trouvé`);
      }
      
      const searchValue = computation.search_value;
      const returnColumn = computation.return_column;
      
      const foundRow = catalogue.find(row => 
        row[computation.search_column] == searchValue
      );
      
      return { 
        value: foundRow ? foundRow[returnColumn] : '#N/A', 
        details: { catalogue: catalogueName } 
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MANUEL (pas de calcul automatique)
    // ─────────────────────────────────────────────────────────────────────────
    case 'manual':
      return { 
        value: computation.expected_value || null, 
        details: { manual: true } 
      };

    default:
      throw new Error(`Type de computation non supporté: ${type}`);
  }
}

/**
 * Calcule une tolérance raisonnable pour un nombre
 */
function calculateTolerance(value) {
  if (value === 0) return 0.01;
  
  // 0.01% de la valeur, minimum 0.01
  const tolerance = Math.abs(value) * 0.0001;
  return Math.max(tolerance, 0.01);
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATAGE POUR PROMPTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formate les statistiques pour inclusion dans un prompt Claude
 * @param {Object} stats - Résultat de computeDatasetStats
 * @returns {string} Texte formaté
 */
export function formatStatsForPrompt(stats) {
  if (!stats || stats.rowCount === 0) {
    return 'Aucune donnée disponible.';
  }

  let output = `## STATISTIQUES DU DATASET\n\n`;
  output += `- **Nombre de lignes** : ${stats.rowCount}\n`;
  output += `- **Colonnes numériques** : ${stats.numericColumns.length}\n`;
  output += `- **Colonnes texte** : ${stats.textColumns.length}\n\n`;

  // Colonnes numériques
  if (stats.numericColumns.length > 0) {
    output += `### Colonnes numériques\n\n`;
    stats.numericColumns.forEach(col => {
      output += `**${col.name}** (colonne ${col.letter}) :\n`;
      output += `  - Somme : ${formatNumber(col.sum)}\n`;
      output += `  - Moyenne : ${formatNumber(col.average)}\n`;
      output += `  - Min : ${formatNumber(col.min)} | Max : ${formatNumber(col.max)}\n\n`;
    });
  }

  // Colonnes texte (avec valeurs uniques)
  if (stats.textColumns.length > 0) {
    output += `### Colonnes catégorielles\n\n`;
    stats.textColumns.forEach(col => {
      output += `**${col.name}** (colonne ${col.letter}) :\n`;
      output += `  - Valeurs uniques : ${col.uniqueCount}\n`;
      if (col.mostCommon && col.mostCommon.length > 0) {
        output += `  - Plus fréquentes : ${col.mostCommon.map(v => `"${v.value}" (${v.count})`).join(', ')}\n`;
      }
      output += '\n';
    });
  }

  return output;
}

/**
 * Formate un nombre pour l'affichage
 */
function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  
  // Arrondir à 2 décimales si nécessaire
  const rounded = Math.round(n * 100) / 100;
  
  // Formater avec séparateurs de milliers
  return rounded.toLocaleString('fr-FR');
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  computeDatasetStats,
  enrichCheckpoints,
  formatStatsForPrompt,
  executeComputation,
  resolveAutoColumn
};