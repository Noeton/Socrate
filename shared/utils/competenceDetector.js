/**
 * DÉTECTION INTELLIGENTE DES COMPÉTENCES EXCEL - v2.0
 * 
 * Nouvelles fonctionnalités :
 * - Détection du type de références ($)
 * - Analyse de l'usage approprié des références
 * - Simulation de recopie
 * - Intégration avec erreursFrequentes.js
 */

import { findCompetence, findCompetenceById } from '../data/competencesExcel.js';
import { detecterErreurs, classifierSeverite } from '../data/erreursFrequentes.js';

// ═══════════════════════════════════════════════════════════════
// DÉTECTION DES COMPÉTENCES DEPUIS UN EXERCICE
// ═══════════════════════════════════════════════════════════════

export function detectCompetencesFromExercise(exerciceId, fileContext) {
  const competences = new Set();
  
  if (!fileContext.formulas || fileContext.formulas.length === 0) {
    console.log('⚠️ [COMPETENCE] Aucune formule trouvée');
    return [];
  }

  const formulas = fileContext.formulas.map(f => f.formula.toUpperCase());
  const allFormulasText = formulas.join(' ');

  // Formules de base
  if (/\bSOMME\s*\(/.test(allFormulasText) || /\bSUM\s*\(/.test(allFormulasText)) {
    competences.add('SOMME');
  }
  
  if (/\bMOYENNE\s*\(/.test(allFormulasText) || /\bAVERAGE\s*\(/.test(allFormulasText)) {
    competences.add('MOYENNE');
  }
  
  if (/\b(MIN|MAX)\s*\(/.test(allFormulasText)) {
    competences.add('MIN/MAX');
  }

  // Formules SI
  const siCount = (allFormulasText.match(/\bSI\s*\(/g) || []).length;
  const ifCount = (allFormulasText.match(/\bIF\s*\(/g) || []).length;
  const totalSi = siCount + ifCount;
  
  if (totalSi > 0) {
    const hasNestedSi = formulas.some(f => {
      const siMatches = (f.match(/\bSI\s*\(/g) || []).length;
      const ifMatches = (f.match(/\bIF\s*\(/g) || []).length;
      return (siMatches + ifMatches) >= 2;
    });
    
    if (hasNestedSi) {
      competences.add('SI imbriqués');
    } else {
      competences.add('SI simple');
    }
  }

  // Formules conditionnelles
  if (/\bNB\.SI\s*\(/.test(allFormulasText) || /\bCOUNTIF\s*\(/.test(allFormulasText)) {
    competences.add('NB.SI');
  }
  
  if (/\bNB\.SI\.ENS\s*\(/.test(allFormulasText) || /\bCOUNTIFS\s*\(/.test(allFormulasText)) {
    competences.add('NB.SI.ENS');
  }
  
  if (/\bSOMME\.SI\s*\(/.test(allFormulasText) || /\bSUMIF\s*\(/.test(allFormulasText)) {
    competences.add('SOMME.SI');
  }
  
  if (/\bSOMME\.SI\.ENS\s*\(/.test(allFormulasText) || /\bSUMIFS\s*\(/.test(allFormulasText)) {
    competences.add('SOMME.SI.ENS');
  }

  // RECHERCHE
  if (/\bRECHERCHEV\s*\(/.test(allFormulasText) || /\bVLOOKUP\s*\(/.test(allFormulasText)) {
    competences.add('RECHERCHEV');
    
    // Détecter si c'est une RECHERCHEV approchée
    if (/RECHERCHEV\([^)]+;[^)]+;\d+\s*\)/i.test(allFormulasText) ||
        /RECHERCHEV\([^)]+;[^)]+;\d+\s*;\s*(VRAI|TRUE|1)\s*\)/i.test(allFormulasText)) {
      competences.add('RECHERCHEV approchée');
    }
  }
  
  if (/\bRECHERCHEH\s*\(/.test(allFormulasText) || /\bHLOOKUP\s*\(/.test(allFormulasText)) {
    competences.add('RECHERCHEH');
  }
  
  if (/\bRECHERCHEX\s*\(/.test(allFormulasText) || /\bXLOOKUP\s*\(/.test(allFormulasText)) {
    competences.add('XLOOKUP');
  }

  // INDEX + EQUIV
  const hasIndex = /\bINDEX\s*\(/.test(allFormulasText);
  const hasEquiv = /\bEQUIV\s*\(/.test(allFormulasText) || /\bMATCH\s*\(/.test(allFormulasText);
  
  if (hasIndex && hasEquiv) {
    competences.add('INDEX + EQUIV');
  }

  // SOMMEPROD
  if (/\bSOMMEPROD\s*\(/.test(allFormulasText) || /\bSUMPRODUCT\s*\(/.test(allFormulasText)) {
    competences.add('SOMMEPROD');
  }

  // Formules texte
  if (/\b(CONCATENER|CONCAT|JOINDRE\.TEXTE)\s*\(/.test(allFormulasText) || /&/.test(allFormulasText)) {
    competences.add('CONCATENER');
  }
  
  if (/\b(GAUCHE|DROITE|STXT|LEFT|RIGHT|MID)\s*\(/.test(allFormulasText)) {
    competences.add('Formules texte (GAUCHE, DROITE)');
  }

  // Formules date
  if (/\b(AUJOURDHUI|TODAY|MOIS|ANNEE|JOUR|MONTH|YEAR|DAY)\s*\(/.test(allFormulasText)) {
    competences.add('Formules date (AUJOURDHUI, MOIS)');
  }

  // Gestion d'erreurs
  if (/\bSIERREUR\s*\(/.test(allFormulasText) || /\bIFERROR\s*\(/.test(allFormulasText)) {
    competences.add('SIERREUR');
  }

  // Formules dynamiques Excel 365
  if (/\b(FILTER|SORT|UNIQUE|FILTRE|TRIER)\s*\(/.test(allFormulasText)) {
    competences.add('FILTER/SORT/UNIQUE');
  }

  // Formules avancées
  if (/\bDECALER\s*\(/.test(allFormulasText) || /\bOFFSET\s*\(/.test(allFormulasText)) {
    competences.add('DECALER');
  }
  
  if (/\bLET\s*\(/.test(allFormulasText)) {
    competences.add('LET');
  }
  
  if (/\bLAMBDA\s*\(/.test(allFormulasText)) {
    competences.add('LAMBDA');
  }

  // Références absolues - Détection améliorée
  const refAnalysis = analyzeAllReferences(formulas);
  
  if (refAnalysis.hasAbsolute) {
    competences.add('Références absolues ($)');
  }
  
  if (refAnalysis.hasMixed) {
    competences.add('Références mixtes');
  }

  // Convertir en Array et valider
  const competencesArray = Array.from(competences);
  
  const competencesValides = competencesArray
    .map(nom => {
      const comp = findCompetence(nom);
      return comp ? comp.nom : null;
    })
    .filter(Boolean);

  console.log(`🔍 [COMPETENCE] ${competencesValides.length} détectée(s):`, competencesValides);

  return competencesValides;
}

// ═══════════════════════════════════════════════════════════════
// ANALYSE DES RÉFÉRENCES ($)
// ═══════════════════════════════════════════════════════════════

/**
 * Classifie une référence de cellule
 * @param {string} ref - Référence (ex: "A1", "$A$1", "A$1", "$A1")
 * @returns {string} - 'relative' | 'absolute' | 'mixed_row' | 'mixed_col'
 */
export function classifyReference(ref) {
  if (!ref) return 'invalid';
  
  // Nettoyer la référence (enlever le nom de feuille si présent)
  const cleanRef = ref.replace(/^[^!]+!/, '');
  
  const hasColDollar = /^\$[A-Z]+/.test(cleanRef);
  const hasRowDollar = /\$\d+$/.test(cleanRef);
  
  if (hasColDollar && hasRowDollar) return 'absolute';      // $A$1
  if (hasColDollar && !hasRowDollar) return 'mixed_col';    // $A1
  if (!hasColDollar && hasRowDollar) return 'mixed_row';    // A$1
  return 'relative';                                         // A1
}

/**
 * Parse toutes les références d'une formule
 * @param {string} formula - La formule à analyser
 * @returns {Array} - [{ref: "A1", type: "relative", position: 5}, ...]
 */
export function parseReferences(formula) {
  if (!formula) return [];
  
  const references = [];
  
  // Regex pour capturer les références de cellules (avec ou sans $)
  // Gère aussi les références avec nom de feuille (Feuille1!A1)
  const refRegex = /(?:([A-Za-z0-9_]+)!)?\$?([A-Z]{1,3})\$?(\d{1,7})/g;
  
  let match;
  while ((match = refRegex.exec(formula)) !== null) {
    const fullRef = match[0];
    const sheet = match[1] || null;
    
    references.push({
      ref: fullRef,
      sheet: sheet,
      type: classifyReference(fullRef),
      position: match.index
    });
  }
  
  return references;
}

/**
 * Analyse toutes les formules pour détecter les types de références utilisés
 * @param {Array} formulas - Liste de formules
 * @returns {Object} - {hasAbsolute, hasMixed, hasRelative, details}
 */
export function analyzeAllReferences(formulas) {
  const result = {
    hasAbsolute: false,
    hasMixed: false,
    hasRelative: false,
    details: {
      absolute: 0,
      mixed_row: 0,
      mixed_col: 0,
      relative: 0
    }
  };
  
  for (const formula of formulas) {
    const refs = parseReferences(formula);
    
    for (const ref of refs) {
      result.details[ref.type] = (result.details[ref.type] || 0) + 1;
      
      if (ref.type === 'absolute') result.hasAbsolute = true;
      if (ref.type === 'mixed_row' || ref.type === 'mixed_col') result.hasMixed = true;
      if (ref.type === 'relative') result.hasRelative = true;
    }
  }
  
  return result;
}

/**
 * Simule la recopie d'une formule
 * @param {string} formula - Formule originale
 * @param {string} direction - 'down' | 'right' | 'up' | 'left'
 * @param {number} steps - Nombre de cellules de décalage
 * @returns {string} - Formule adaptée
 */
export function simulateCopy(formula, direction, steps = 1) {
  if (!formula) return formula;
  
  const refRegex = /(\$?)([A-Z]{1,3})(\$?)(\d{1,7})/g;
  
  return formula.replace(refRegex, (match, colDollar, col, rowDollar, row) => {
    let newCol = col;
    let newRow = parseInt(row);
    
    // Si pas de $, la référence bouge
    if (direction === 'down' && !rowDollar) {
      newRow += steps;
    } else if (direction === 'up' && !rowDollar) {
      newRow = Math.max(1, newRow - steps);
    } else if (direction === 'right' && !colDollar) {
      newCol = incrementColumn(col, steps);
    } else if (direction === 'left' && !colDollar) {
      newCol = decrementColumn(col, steps);
    }
    
    return `${colDollar}${newCol}${rowDollar}${newRow}`;
  });
}

/**
 * Incrémente une lettre de colonne
 */
function incrementColumn(col, steps) {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }
  num += steps;
  
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result || 'A';
}

/**
 * Décrémente une lettre de colonne
 */
function decrementColumn(col, steps) {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }
  num = Math.max(1, num - steps);
  
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result || 'A';
}

/**
 * Analyse si l'usage des références est approprié au contexte
 * @param {string} formula - La formule
 * @param {Object} context - {willBeCopied: bool, copyDirection: 'down'|'right'|'both'}
 * @returns {Object} - {isAppropriate: bool, issues: [], suggestions: []}
 */
export function analyzeReferenceUsage(formula, context = {}) {
  const result = {
    isAppropriate: true,
    issues: [],
    suggestions: []
  };
  
  if (!context.willBeCopied) {
    return result; // Pas de recopie prévue, pas de problème
  }
  
  const refs = parseReferences(formula);
  
  // Détecter les RECHERCHEV avec table non figée
  if (/RECHERCHEV|VLOOKUP/i.test(formula)) {
    const tableRef = formula.match(/RECHERCHEV\([^;]+;([^;]+);/i);
    if (tableRef) {
      const tableRefs = parseReferences(tableRef[1]);
      const hasRelativeInTable = tableRefs.some(r => r.type === 'relative');
      
      if (hasRelativeInTable) {
        result.isAppropriate = false;
        result.issues.push({
          type: 'table_not_fixed',
          message: "La table de RECHERCHEV contient des références relatives",
          refs: tableRefs.filter(r => r.type === 'relative')
        });
        result.suggestions.push("Fige la table avec $ : $A$1:$D$10");
      }
    }
  }
  
  // Vérifier cohérence recopie vers le bas
  if (context.copyDirection === 'down' || context.copyDirection === 'both') {
    const relativeRows = refs.filter(r => r.type === 'relative' || r.type === 'mixed_col');
    // C'est normal d'avoir des références relatives si on recopie vers le bas
  }
  
  // Vérifier cohérence recopie vers la droite
  if (context.copyDirection === 'right' || context.copyDirection === 'both') {
    const relativeCols = refs.filter(r => r.type === 'relative' || r.type === 'mixed_row');
    // C'est normal d'avoir des références relatives si on recopie vers la droite
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// ÉVALUATION DE MAÎTRISE
// ═══════════════════════════════════════════════════════════════

/**
 * Évalue le niveau de maîtrise d'une compétence basé sur les formules
 * @param {string} competenceName - Nom de la compétence
 * @param {Array} formulas - Liste des formules de l'utilisateur
 * @returns {number} - Score de maîtrise (0-100)
 */
export function evaluateCompetenceMastery(competenceName, formulas) {
  if (!formulas || formulas.length === 0) return 0;
  
  let score = 50; // Score de base si la compétence est utilisée
  
  // Analyser les erreurs dans les formules
  const allErrors = [];
  for (const formula of formulas) {
    const errors = detecterErreurs(formula);
    allErrors.push(...errors);
  }
  
  // Ajuster le score selon la sévérité des erreurs
  const severite = classifierSeverite(allErrors);
  
  switch (severite) {
    case 'critique':
      score = Math.max(20, score - 40);
      break;
    case 'importante':
      score = Math.max(35, score - 25);
      break;
    case 'mineure':
      score = Math.max(50, score - 10);
      break;
    case 'aucune':
      score = Math.min(90, score + 30);
      break;
  }
  
  // Bonus si utilisation avancée (références mixtes, etc.)
  const refAnalysis = analyzeAllReferences(formulas);
  if (refAnalysis.hasMixed && competenceName.includes('Référence')) {
    score = Math.min(100, score + 15);
  }
  
  return Math.round(score);
}

/**
 * Détecte les patterns d'erreurs récurrents
 * @param {Array} formulas - Liste des formules
 * @returns {Object} - {patterns: [], competencesToReview: []}
 */
export function detectErrorPatterns(formulas) {
  const errorCounts = {};
  const allErrors = [];
  
  for (const formula of formulas) {
    const errors = detecterErreurs(formula);
    
    for (const error of errors) {
      errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
      allErrors.push(error);
    }
  }
  
  // Trouver les patterns récurrents (erreur vue 2+ fois)
  const patterns = Object.entries(errorCounts)
    .filter(([type, count]) => count >= 2)
    .map(([type, count]) => ({
      type,
      count,
      errors: allErrors.filter(e => e.type === type)
    }))
    .sort((a, b) => b.count - a.count);
  
  // Identifier les compétences à revoir
  const competencesToReview = new Set();
  for (const error of allErrors) {
    if (error.competences) {
      error.competences.forEach(c => competencesToReview.add(c));
    }
  }
  
  return {
    patterns,
    competencesToReview: Array.from(competencesToReview)
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  // Détection compétences
  detectCompetencesFromExercise,
  evaluateCompetenceMastery,
  
  // Analyse références
  classifyReference,
  parseReferences,
  analyzeAllReferences,
  simulateCopy,
  analyzeReferenceUsage,
  
  // Patterns d'erreurs
  detectErrorPatterns
};