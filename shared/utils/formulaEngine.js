/**
 * FORMULA ENGINE - Moteur d'exécution de formules Excel
 * Supporte les noms français ET anglais des fonctions
 */

import FormulaParser from 'fast-formula-parser';
import { FR_TO_EN, toEnglish } from './excelFunctionMap';

/**
 * Convertit une formule française en anglaise
 * Ex: "=SOMME(A1:A3)" → "=SUM(A1:A3)"
 * Ex: "=SI(A1>10;\"Oui\";\"Non\")" → "=IF(A1>10,\"Oui\",\"Non\")"
 */
export function translateFormula(formula) {
  if (!formula || !formula.startsWith('=')) return formula;
  
  let translated = formula;
  
  // Remplacer les points-virgules par des virgules (format FR → EN)
  // Attention à ne pas remplacer dans les strings
  translated = replaceSemicolons(translated);
  
  // Remplacer les noms de fonctions FR → EN
  Object.keys(FR_TO_EN).forEach(frName => {
    const enName = FR_TO_EN[frName];
    // Regex pour matcher le nom de fonction suivi d'une parenthèse
    const regex = new RegExp(`\\b${frName}\\s*\\(`, 'gi');
    translated = translated.replace(regex, `${enName}(`);
  });
  
  return translated;
}

/**
 * Remplace les ; par des , sauf dans les chaînes de caractères
 */
function replaceSemicolons(formula) {
  let result = '';
  let inString = false;
  let stringChar = null;
  
  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];
    
    // Gestion des guillemets
    if ((char === '"' || char === "'") && formula[i-1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }
    
    // Remplacer ; par , sauf dans les strings
    if (char === ';' && !inString) {
      result += ',';
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Classe principale du moteur de formules
 */
export class FormulaEngine {
  constructor(data = []) {
    this.data = data;
    this.parser = new FormulaParser({
      onCell: this.onCell.bind(this),
      onRange: this.onRange.bind(this)
    });
  }
  
  /**
   * Met à jour les données de la grille
   */
  setData(data) {
    this.data = data;
  }
  
  /**
   * Callback pour résoudre une référence de cellule (ex: A1)
   */
  onCell({ row, col }) {
    // row et col sont 1-indexed dans fast-formula-parser
    const r = row - 1;
    const c = col - 1;
    
    if (r < 0 || c < 0 || r >= this.data.length || !this.data[r]) {
      return null;
    }
    
    const value = this.data[r][c];
    
    // Si c'est un nombre stocké comme string, le convertir
    if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
      return parseFloat(value);
    }
    
    return value;
  }
  
  /**
   * Callback pour résoudre une plage (ex: A1:B3)
   */
  onRange({ from, to }) {
    const result = [];
    
    for (let row = from.row; row <= to.row; row++) {
      const rowData = [];
      for (let col = from.col; col <= to.col; col++) {
        const value = this.onCell({ row, col });
        rowData.push(value);
      }
      result.push(rowData);
    }
    
    return result;
  }
  
  /**
   * Exécute une formule et retourne le résultat
   * @param {string} formula - Formule (FR ou EN, avec ou sans =)
   * @returns {{ result: any, error: string|null }}
   */
  execute(formula) {
    try {
      if (!formula) {
        return { result: null, error: 'Formule vide' };
      }
      
      // Enlever le = initial si présent
      let cleanFormula = formula.trim();
      if (cleanFormula.startsWith('=')) {
        cleanFormula = cleanFormula.substring(1);
      }
      
      // Traduire FR → EN
      const translatedFormula = translateFormula('=' + cleanFormula).substring(1);
      
      // Exécuter
      const result = this.parser.parse(translatedFormula);
      
      if (result.error) {
        return { 
          result: null, 
          error: this.translateError(result.error) 
        };
      }
      
      return { result: result.result, error: null };
      
    } catch (err) {
      return { 
        result: null, 
        error: this.translateError(err.message || 'Erreur inconnue')
      };
    }
  }
  
  /**
   * Traduit les messages d'erreur en français
   */
  translateError(error) {
    const errorMap = {
      '#DIV/0!': '#DIV/0! - Division par zéro',
      '#VALUE!': '#VALEUR! - Type de données incorrect',
      '#REF!': '#REF! - Référence invalide',
      '#NAME?': '#NOM? - Fonction non reconnue',
      '#N/A': '#N/A - Valeur non trouvée',
      '#NUM!': '#NOMBRE! - Valeur numérique invalide',
      '#NULL!': '#NUL! - Intersection vide'
    };
    
    for (const [en, fr] of Object.entries(errorMap)) {
      if (error.includes(en)) {
        return fr;
      }
    }
    
    return error;
  }
  
  /**
   * Valide une formule sans l'exécuter
   * @returns {{ valid: boolean, error: string|null }}
   */
  validate(formula) {
    try {
      if (!formula || !formula.trim().startsWith('=')) {
        return { valid: false, error: 'Une formule doit commencer par =' };
      }
      
      // Vérifier les parenthèses
      const openCount = (formula.match(/\(/g) || []).length;
      const closeCount = (formula.match(/\)/g) || []).length;
      
      if (openCount !== closeCount) {
        return { 
          valid: false, 
          error: `Parenthèses non équilibrées (${openCount} ouvertes, ${closeCount} fermées)` 
        };
      }
      
      // Essayer d'exécuter pour voir si ça parse
      const result = this.execute(formula);
      
      if (result.error && result.error.includes('#NOM?')) {
        return { valid: false, error: result.error };
      }
      
      return { valid: true, error: null };
      
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
}

/**
 * Détecte les fonctions utilisées dans une formule
 * @returns {string[]} Liste des noms de fonctions (en français)
 */
export function detectFunctions(formula) {
  if (!formula) return [];
  
  const functions = [];
  const regex = /([A-Z][A-Z0-9_.]+)\s*\(/gi;
  let match;
  
  while ((match = regex.exec(formula)) !== null) {
    const fnName = match[1].toUpperCase();
    // Convertir en français si c'est une fonction anglaise
    const frName = Object.entries(FR_TO_EN).find(([fr, en]) => en === fnName)?.[0] || fnName;
    if (!functions.includes(frName)) {
      functions.push(frName);
    }
  }
  
  return functions;
}

/**
 * Convertit une référence style "A1" en indices [row, col] (0-indexed)
 */
export function cellRefToIndices(ref) {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  
  const colStr = match[1].toUpperCase();
  const row = parseInt(match[2]) - 1;
  
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  col -= 1;
  
  return { row, col };
}

/**
 * Convertit des indices [row, col] en référence style "A1"
 */
export function indicesToCellRef(row, col) {
  let colStr = '';
  let c = col + 1;
  
  while (c > 0) {
    const remainder = (c - 1) % 26;
    colStr = String.fromCharCode(65 + remainder) + colStr;
    c = Math.floor((c - 1) / 26);
  }
  
  return `${colStr}${row + 1}`;
}

// Export par défaut
export default FormulaEngine;