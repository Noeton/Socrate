import { toEnglish } from '@/shared/utils/excelFunctionMap.js';
/**
 * VALIDATION CHECKER
 * Valide les checkpoints de manière hybride (résultat + méthode + structure)
 */

class ValidationChecker {
  
    /**
     * Valide un checkpoint de type "formule"
     */
    static validateFormulaCheckpoint(cell, checkpoint, worksheet) {
      const result = {
        success: false,
        score: 0,
        maxScore: checkpoint.points,
        level: 0,
        details: {},
        feedback: []
      };
  
      if (!cell || (!cell.formula && cell.value === null)) {
        result.feedback.push(`❌ Cellule ${checkpoint.cellule} vide`);
        return result;
      }
  
      const userFormula = cell.formula ? cell.formula.toString().toUpperCase() : '';
      const userValue = cell.value;
  
      // NIVEAU 1 : Valeur non-erreur (50%)
      const hasValue = userValue !== null && userValue !== undefined;
      const isError = this.isExcelError(userValue);
      
      if (hasValue && !isError) {
        result.score += checkpoint.points * 0.5;
        result.level = 1;
        result.details.resultOk = true;
        result.feedback.push(`✅ Cellule ${checkpoint.cellule} a une valeur`);
      } else if (isError) {
        result.feedback.push(`❌ Erreur Excel: ${userValue}`);
        return result;
      }
  
      // NIVEAU 2 : Fonction présente (30%)
      if (checkpoint.fonction) {
        const expectedFunctionFR = checkpoint.fonction.toUpperCase();
        const expectedFunctionEN = toEnglish(expectedFunctionFR);
        if (userFormula.includes(expectedFunctionFR) || userFormula.includes(expectedFunctionEN)) {
          result.score += checkpoint.points * 0.3;
          result.level = 2;
          result.details.functionOk = true;
          result.feedback.push(`✅ Fonction ${checkpoint.fonction} utilisée`);
        } else {
          result.feedback.push(`⚠️ Fonction ${checkpoint.fonction} manquante`);
        }
      } else {
        result.score += checkpoint.points * 0.3;
        result.level = 2;
      }
  
      // NIVEAU 3 : Pattern match (20%)
      if (checkpoint.pattern) {
        const patterns = Array.isArray(checkpoint.pattern) 
          ? checkpoint.pattern 
          : checkpoint.pattern.split('||');
        
        const matchCount = patterns.filter(p => 
          userFormula.includes(p.toUpperCase())
        ).length;
        
        const matchRate = matchCount / patterns.length;
        
        if (matchRate >= 0.7) {
          result.score += checkpoint.points * 0.2;
          result.level = 3;
          result.details.patternOk = true;
          result.feedback.push(`✅ Structure correcte`);
        } else {
          result.feedback.push(`⚠️ Éléments manquants dans la formule`);
        }
      } else {
        result.score += checkpoint.points * 0.2;
        result.level = 3;
      }
  
      result.success = result.score >= (checkpoint.points * 0.7);
      return result;
    }
  
    /**
     * Valide un checkpoint de type "validation"
     */
    static validateDataValidationCheckpoint(cell, checkpoint, worksheet) {
      const result = {
        success: false,
        score: 0,
        maxScore: checkpoint.points,
        details: {},
        feedback: []
      };
  
      if (!cell) {
        result.feedback.push(`❌ Cellule ${checkpoint.cellule} introuvable`);
        return result;
      }
  
      const validation = cell.dataValidation;
      
      if (!validation || !validation.type) {
        result.feedback.push(`❌ Pas de validation sur ${checkpoint.cellule}`);
        return result;
      }
  
      const expectedValues = Array.isArray(checkpoint.pattern) 
        ? checkpoint.pattern 
        : checkpoint.pattern.split('||');
  
      // Type list
      if (validation.type === 'list') {
        const listFormula = validation.formulae?.[0] || '';
        const listItems = listFormula
          .replace(/"/g, '')
          .split(/[,;]/)
          .map(item => item.trim());
  
        const allPresent = expectedValues.every(expected => 
          listItems.some(item => item.includes(expected))
        );
  
        if (allPresent) {
          result.score = checkpoint.points;
          result.success = true;
          result.details.listOk = true;
          result.feedback.push(`✅ Liste déroulante correcte`);
        } else {
          result.score = checkpoint.points * 0.5;
          result.feedback.push(`⚠️ Liste déroulante incomplète`);
        }
      }
      
      // Type date
      else if (validation.type === 'date') {
        if (validation.operator === 'between' && validation.formulae?.length === 2) {
          result.score = checkpoint.points;
          result.success = true;
          result.details.dateRangeOk = true;
          result.feedback.push(`✅ Validation de date OK`);
        } else {
          result.score = checkpoint.points * 0.5;
          result.feedback.push(`⚠️ Validation de date partielle`);
        }
      }
      
      // Type whole/decimal
      else if (validation.type === 'whole' || validation.type === 'decimal') {
        if (validation.operator === 'between' && validation.formulae?.length === 2) {
          result.score = checkpoint.points;
          result.success = true;
          result.details.numberRangeOk = true;
          result.feedback.push(`✅ Validation de nombre OK`);
        } else {
          result.score = checkpoint.points * 0.5;
          result.feedback.push(`⚠️ Validation de nombre partielle`);
        }
      }
      
      else {
        result.score = checkpoint.points * 0.3;
        result.feedback.push(`⚠️ Type de validation non vérifié`);
      }
  
      return result;
    }
  
    /**
     * Détecte si une valeur est une erreur Excel
     */
    static isExcelError(value) {
      if (typeof value === 'object' && value?.error) return true;
      if (typeof value === 'string') {
        return ['#DIV/0!', '#N/A', '#NAME?', '#NULL!', '#NUM!', '#REF!', '#VALUE!'].includes(value);
      }
      return false;
    }
  }
  
  export default ValidationChecker;
  