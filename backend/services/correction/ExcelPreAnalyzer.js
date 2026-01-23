import { toFrench } from '@/shared/utils/excelFunctionMap.js';
/**
 * PRÉ-ANALYSEUR EXCEL - FAST & LOCAL (0 tokens)
 * 
 * Détecte :
 * - Erreurs Excel critiques (#REF!, #DIV/0!...)
 * - Présence des formules attendues
 * - Cohérence basique de structure
 * - Score préliminaire
 */

class ExcelPreAnalyzer {
  
    /**
     * Analyse rapide d'une feuille Excel
     * @param {Object} worksheet - Feuille ExcelJS
     * @param {Object} exercise - Exercice attendu (optionnel pour fichiers random)
     * @returns {Object} Rapport de pré-analyse
     */
    static analyze(worksheet, exercise = null) {
      console.log('⚡ [PRE-ANALYZER] Démarrage analyse rapide...');
  
      const analysis = {
        hasFormulas: false,
        formulaCount: 0,
        criticalErrors: [],
        detectedFunctions: new Set(),
        expectedFunctionsPresent: [],
        missingFunctions: [],
        structureValid: true,
        emptyKeyAreas: [],
        preliminaryScore: 0,
        shouldSkipClaude: false,
        skipReason: null
      };
  
      // ÉTAPE 1 : Scanner toutes les cellules
      const allFormulas = [];
      const allErrors = [];
      
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          const cellRef = this.getCellRef(colNumber, rowNumber);
  
          // Détecter formules
          if (cell.formula) {
            analysis.hasFormulas = true;
            analysis.formulaCount++;
            allFormulas.push({
              cell: cellRef,
              formula: cell.formula,
              value: cell.value
            });
  
            // Extraire fonctions utilisées
            const functions = this.extractFunctions(cell.formula);
            functions.forEach(fn => analysis.detectedFunctions.add(fn));
          }
  
          // Détecter erreurs Excel
          const error = this.detectError(cell);
          if (error) {
            allErrors.push({
              cell: cellRef,
              type: error,
              formula: cell.formula || null
            });
          }
        });
      });
  
      analysis.detectedFunctions = Array.from(analysis.detectedFunctions);
      analysis.criticalErrors = allErrors;
  
      console.log(`📊 [PRE-ANALYZER] ${analysis.formulaCount} formules, ${allErrors.length} erreurs`);
  
      // ÉTAPE 2 : Vérifier présence des fonctions attendues (si exercice Socrate)
      if (exercise && exercise.competences) {
        const expectedFunctions = this.mapCompetencesToFunctions(exercise.competences);
        
        expectedFunctions.forEach(fn => {
          if (analysis.detectedFunctions.includes(fn)) {
            analysis.expectedFunctionsPresent.push(fn);
          } else {
            analysis.missingFunctions.push(fn);
          }
        });
  
        console.log(`✅ [PRE-ANALYZER] Fonctions présentes: ${analysis.expectedFunctionsPresent.join(', ')}`);
        console.log(`❌ [PRE-ANALYZER] Fonctions manquantes: ${analysis.missingFunctions.join(', ')}`);
      }
  
      // ÉTAPE 3 : Calculer score préliminaire
      analysis.preliminaryScore = this.calculatePreliminaryScore(analysis, exercise);
  
      // ÉTAPE 4 : Décider si on skip Claude
      if (analysis.criticalErrors.length >= 5) {
        analysis.shouldSkipClaude = true;
        analysis.skipReason = `Trop d'erreurs critiques (${analysis.criticalErrors.length}). Corrige d'abord les #REF!, #DIV/0!, etc.`;
      } else if (analysis.preliminaryScore < 30) {
        analysis.shouldSkipClaude = true;
        analysis.skipReason = 'Score préliminaire trop faible. Vérifie ta structure et tes formules de base.';
      } else if (!analysis.hasFormulas) {
        analysis.shouldSkipClaude = true;
        analysis.skipReason = 'Aucune formule détectée. As-tu oublié de calculer ?';
      }
  
      console.log(`🎯 [PRE-ANALYZER] Score préliminaire: ${analysis.preliminaryScore}/100`);
      console.log(`🚦 [PRE-ANALYZER] Skip Claude: ${analysis.shouldSkipClaude}`);
  
      return {
        ...analysis,
        allFormulas,
        timestamp: new Date().toISOString()
      };
    }
  
    /**
     * Détecte les erreurs Excel dans une cellule
     */
    static detectError(cell) {
      const excelErrors = ['#DIV/0!', '#N/A', '#NAME?', '#NULL!', '#NUM!', '#REF!', '#VALUE!'];
      
      // Vérifier dans cell.value
      if (cell.value && typeof cell.value === 'object' && cell.value.error) {
        return cell.value.error.toString();
      }
  
      // Vérifier dans cell.result
      if (cell.result && typeof cell.result === 'object' && cell.result.error) {
        return cell.result.error.toString();
      }
  
      // Vérifier si la valeur est une string d'erreur
      if (typeof cell.value === 'string' && excelErrors.includes(cell.value)) {
        return cell.value;
      }
  
      return null;
    }
  
    /**
     * Extrait les noms de fonctions d'une formule
     */
    static extractFunctions(formula) {
      if (!formula) return [];
      
      // Regex pour capturer les noms de fonctions (lettres majuscules/underscore suivies de parenthèse)
      const functionRegex = /\b([A-Z_\.]+)(?=\()/g;
      const matches = formula.match(functionRegex);
      
      if (!matches) return [];
      
      // Traduire EN → FR pour cohérence avec les compétences attendues
      const translated = matches.map(fn => toFrench(fn));
      return [...new Set(translated)];
    }
  
    /**
     * Map compétences → fonctions Excel attendues
     */
    static mapCompetencesToFunctions(competences) {
      const mapping = {
        'calculs_base': ['SOMME', 'MOYENNE', 'MIN', 'MAX'],
        'SOMME': ['SOMME'],
        'MOYENNE': ['MOYENNE'],
        'MIN': ['MIN'],
        'MAX': ['MAX'],
        'SI': ['SI'],
        'SI_imbriques': ['SI'],
        'RECHERCHEV': ['RECHERCHEV'],
        'RECHERCHEX': ['RECHERCHEX'],
        'NB.SI': ['NB.SI'],
        'SOMME.SI': ['SOMME.SI'],
        'NB.SI.ENS': ['NB.SI.ENS'],
        'SOMME.SI.ENS': ['SOMME.SI.ENS'],
        'CONCATENER': ['CONCATENER', 'CONCAT'],
        'GAUCHE': ['GAUCHE'],
        'DROITE': ['DROITE'],
        'STXT': ['STXT'],
        'tableaux_croises': [], // Pas de formule spécifique
        'graphiques': [] // Pas de formule spécifique
      };
  
      const expectedFunctions = new Set();
      competences.forEach(comp => {
        const functions = mapping[comp] || [];
        functions.forEach(fn => expectedFunctions.add(fn));
      });
  
      return Array.from(expectedFunctions);
    }
  
    /**
     * Calcule un score préliminaire (0-100)
     */
    static calculatePreliminaryScore(analysis, exercise) {
      let score = 50; // Base neutre
  
      // Bonus : formules présentes
      if (analysis.hasFormulas) {
        score += 10;
      }
  
      // Malus : erreurs critiques
      score -= analysis.criticalErrors.length * 5;
  
      // Si exercice Socrate : vérifier présence fonctions attendues
      if (exercise && exercise.competences) {
        const expectedCount = analysis.expectedFunctionsPresent.length + analysis.missingFunctions.length;
        if (expectedCount > 0) {
          const presenceRate = analysis.expectedFunctionsPresent.length / expectedCount;
          score += presenceRate * 30; // Max +30 si toutes présentes
        }
      } else {
        // Fichier random : bonus selon variété de fonctions
        score += Math.min(analysis.detectedFunctions.length * 5, 20);
      }
  
      // Bonus : beaucoup de formules (signe de travail)
      if (analysis.formulaCount >= 10) score += 10;
      if (analysis.formulaCount >= 30) score += 10;
  
      return Math.max(0, Math.min(100, Math.round(score)));
    }
  
    /**
     * Convertit colNumber + rowNumber en référence Excel (A1, B2, etc.)
     */
    static getCellRef(colNumber, rowNumber) {
      let colName = '';
      let col = colNumber;
      
      while (col > 0) {
        const modulo = (col - 1) % 26;
        colName = String.fromCharCode(65 + modulo) + colName;
        col = Math.floor((col - modulo) / 26);
      }
      
      return `${colName}${rowNumber}`;
    }
  
    /**
     * Extrait uniquement les formules clés (pour optimiser contexte Claude)
     */
    static extractKeyFormulas(allFormulas, exercise = null) {
      // Si exercice Socrate : prendre les formules liées aux objectifs
      // Sinon : prendre les formules de synthèse (SOMME, MOYENNE en fin de colonnes)
      
      if (!allFormulas || allFormulas.length === 0) return [];
  
      // Stratégie simple : garder max 15 formules représentatives
      const keyFormulas = [];
  
      // 1. Formules avec fonctions complexes (SI, RECHERCHEV, etc.)
      const complexFormulas = allFormulas.filter(f => 
        /SI|RECHERCHE|SOMME\.SI|NB\.SI|SIERREUR/i.test(f.formula)
      );
      keyFormulas.push(...complexFormulas.slice(0, 8));
  
      // 2. Formules de synthèse (dernières lignes généralement)
      const synthesisFormulas = allFormulas
        .filter(f => !keyFormulas.includes(f))
        .slice(-7); // Les 7 dernières
      keyFormulas.push(...synthesisFormulas);
  
      return keyFormulas.slice(0, 15); // Max 15
    }
}
  
export default ExcelPreAnalyzer;
  