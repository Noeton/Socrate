/**
 * ANALYSEUR EXCEL INTELLIGENT
 * 
 * Analyse avancée des erreurs Excel avec :
 * - Contexte des cellules référencées
 * - Détection des erreurs en cascade
 * - Suggestions de formules corrigées
 * - Patterns d'erreurs
 */

/**
 * Analyse intelligente d'une erreur Excel
 */
export function analyzeErrorWithContext(worksheet, errorInfo) {
    const { cell, error, formula } = errorInfo;
    
    const analysis = {
      cell,
      error,
      errorType: getErrorType(error),
      formula,
      context: {},
      rootCause: null,
      suggestedFix: null,
      explanation: ''
    };
  
    // Extraire les cellules référencées dans la formule
    if (formula) {
      const referencedCells = extractCellReferences(formula);
      
      // Lire les valeurs de ces cellules
      referencedCells.forEach(ref => {
        try {
          const refCell = worksheet.getCell(ref);
          analysis.context[ref] = {
            value: refCell.value,
            type: typeof refCell.value,
            hasError: hasError(refCell),
            formula: refCell.formula || null
          };
        } catch (e) {
          analysis.context[ref] = { value: 'INVALID_REF', type: 'error' };
        }
      });
    }
  
    // Analyse selon le type d'erreur
    switch (error) {
      case '#DIV/0!':
        analysis.explanation = analyzeDivisionByZero(formula, analysis.context);
        analysis.suggestedFix = generateDivisionByZeroFix(formula);
        break;
        
      case '#REF!':
        analysis.explanation = analyzeInvalidReference(formula, analysis.context);
        analysis.suggestedFix = "Vérifie que toutes les cellules référencées existent. As-tu supprimé des lignes/colonnes ?";
        break;
        
      case '#NAME?':
        analysis.explanation = analyzeUnknownName(formula);
        analysis.suggestedFix = generateNameErrorFix(formula);
        break;
        
      case '#VALUE!':
        analysis.explanation = analyzeValueError(formula, analysis.context);
        analysis.suggestedFix = "Vérifie que toutes les cellules contiennent le bon type de données (nombres vs texte)";
        break;
        
      case '#N/A':
        analysis.explanation = analyzeNotAvailable(formula, analysis.context);
        analysis.suggestedFix = generateNAFix(formula);
        break;
        
      case '#NULL!':
        analysis.explanation = "Intersection de plages vide. Vérifie les espaces dans ta formule (ex: A1 B1 au lieu de A1:B1)";
        break;
        
      case '#NUM!':
        analysis.explanation = "Valeur numérique invalide. Vérifie les calculs (racine carrée d'un nombre négatif, etc.)";
        break;
    }
  
    return analysis;
  }
  
  /**
   * Analyse spécifique : Division par zéro
   */
  function analyzeDivisionByZero(formula, context) {
    // Trouver le diviseur dans la formule
    const divisionMatch = formula.match(/([A-Z]+\d+)\s*\/\s*([A-Z]+\d+)/i);
    
    if (divisionMatch) {
      const dividend = divisionMatch[1];
      const divisor = divisionMatch[2];
      
      const dividendValue = context[dividend]?.value;
      const divisorValue = context[divisor]?.value;
      
      let explanation = `Tu essaies de diviser `;
      
      if (dividendValue !== undefined) {
        explanation += `${dividendValue} (${dividend})`;
      } else {
        explanation += `la valeur de ${dividend}`;
      }
      
      explanation += ` par `;
      
      if (divisorValue === 0 || divisorValue === null || divisorValue === '') {
        explanation += `0 ou une cellule vide (${divisor})`;
      } else {
        explanation += `${divisorValue} (${divisor})`;
      }
      
      explanation += `.\n\n`;
      explanation += `💡 **Cause probable :** La cellule ${divisor} est vide, contient 0, ou n'a pas encore été remplie.\n`;
      explanation += `✅ **Solution pro :** Utilise SIERREUR() ou SI() pour gérer ce cas.`;
      
      return explanation;
    }
    
    return "Division par zéro détectée. Vérifie que le diviseur n'est pas vide ou égal à 0.";
  }
  
  /**
   * Analyse spécifique : Référence invalide
   */
  function analyzeInvalidReference(formula, context) {
    const invalidRefs = Object.entries(context)
      .filter(([ref, data]) => data.value === 'INVALID_REF')
      .map(([ref]) => ref);
    
    if (invalidRefs.length > 0) {
      return `Les cellules ${invalidRefs.join(', ')} n'existent pas ou ont été supprimées.\n\n` +
             `💡 **Cause probable :** Tu as supprimé des lignes ou colonnes après avoir créé la formule.\n` +
             `✅ **Solution :** Recrée la formule avec les bonnes références de cellules.`;
    }
    
    return "Référence de cellule invalide. As-tu supprimé des lignes ou colonnes ?";
  }
  
  /**
   * Analyse spécifique : Nom de fonction inconnu
   */
  function analyzeUnknownName(formula) {
    // Extraire les noms de fonctions (mots en majuscules suivis de parenthèses)
    const functionMatches = formula.match(/[A-Z_]+(?=\()/g);
    
    if (functionMatches && functionMatches.length > 0) {
      const possibleError = functionMatches[0];
      
      // Suggestions courantes
      const suggestions = {
        'SOM': 'SOMME',
        'SUMME': 'SOMME',
        'MOYENN': 'MOYENNE',
        'AVERAGE': 'MOYENNE',
        'RECHERCHE': 'RECHERCHEV ou RECHERCHEX',
        'VLOOKUP': 'RECHERCHEV',
        'COUNTIF': 'NB.SI',
        'SUMIF': 'SOMME.SI'
      };
      
      const suggestion = suggestions[possibleError.toUpperCase()];
      
      if (suggestion) {
        return `Excel ne reconnaît pas "${possibleError}".\n\n` +
               `💡 **Suggestion :** Tu voulais peut-être dire **${suggestion}** ?\n` +
               `✅ **Astuce :** En français, les fonctions sont traduites (SOMME, MOYENNE, etc.)`;
      }
    }
    
    return "Excel ne reconnaît pas un nom de fonction ou de plage.\n\n" +
           "💡 Vérifie l'orthographe des fonctions (SOMME, MOYENNE, SI, etc.)";
  }
  
  /**
   * Analyse spécifique : Erreur de valeur
   */
  function analyzeValueError(formula, context) {
    // Chercher des opérations mathématiques avec du texte
    const refsWithText = Object.entries(context)
      .filter(([ref, data]) => typeof data.value === 'string' && data.value !== '')
      .map(([ref, data]) => `${ref} (contient "${data.value}")`);
    
    if (refsWithText.length > 0) {
      return `Erreur de type : tu essaies de faire une opération mathématique avec du texte.\n\n` +
             `📝 Cellules contenant du texte : ${refsWithText.join(', ')}\n\n` +
             `💡 **Solution :** Remplace le texte par un nombre, ou utilise NBVAL() pour vérifier le type.`;
    }
    
    return "Type de valeur incorrect. Tu essaies probablement de calculer avec du texte au lieu de nombres.";
  }
  
  /**
   * Analyse spécifique : Valeur non disponible (RECHERCHEV, etc.)
   */
  function analyzeNotAvailable(formula, context) {
    if (formula.includes('RECHERCHEV') || formula.includes('RECHERCHEH')) {
      return "La valeur recherchée n'existe pas dans la plage.\n\n" +
             "💡 **Causes courantes :**\n" +
             "- Faute de frappe dans la valeur cherchée\n" +
             "- La valeur n'existe pas dans la première colonne/ligne\n" +
             "- Espaces invisibles dans les données\n\n" +
             "✅ **Solution pro :** Utilise SIERREUR(RECHERCHEV(...); \"Non trouvé\")";
    }
    
    return "Valeur non disponible. Souvent lié à RECHERCHEV ou INDEX/EQUIV.";
  }
  
  /**
   * Génère une formule corrigée pour #DIV/0!
   */
  function generateDivisionByZeroFix(formula) {
    if (!formula) return null;
    
    // Option 1 : SIERREUR (plus propre)
    const fix1 = `=SIERREUR(${formula}; 0)`;
    
    // Option 2 : SI avec condition
    const divisionMatch = formula.match(/([A-Z]+\d+)\s*\/\s*([A-Z]+\d+)/i);
    let fix2 = null;
    
    if (divisionMatch) {
      const divisor = divisionMatch[2];
      fix2 = `=SI(${divisor}=0; 0; ${formula})`;
    }
    
    return {
      option1: { formula: fix1, description: "Remplace l'erreur par 0 (plus simple)" },
      option2: fix2 ? { formula: fix2, description: "Vérifie avant de diviser (plus explicite)" } : null
    };
  }
  
  /**
   * Génère une formule corrigée pour #NAME?
   */
  function generateNameErrorFix(formula) {
    // Corrections courantes français/anglais
    const corrections = {
      'SUM': 'SOMME',
      'AVERAGE': 'MOYENNE',
      'IF': 'SI',
      'VLOOKUP': 'RECHERCHEV',
      'COUNTIF': 'NB.SI',
      'SUMIF': 'SOMME.SI'
    };
    
    let fixedFormula = formula;
    
    Object.entries(corrections).forEach(([eng, fr]) => {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi');
      fixedFormula = fixedFormula.replace(regex, fr);
    });
    
    if (fixedFormula !== formula) {
      return {
        original: formula,
        fixed: fixedFormula,
        description: "Formule avec noms de fonctions corrigés (français)"
      };
    }
    
    return null;
  }
  
  /**
   * Génère une formule corrigée pour #N/A
   */
  function generateNAFix(formula) {
    if (!formula) return null;
    
    return {
      formula: `=SIERREUR(${formula}; "Non trouvé")`,
      description: "Remplace #N/A par un message clair"
    };
  }
  
  /**
   * Détecte les erreurs en cascade
   */
  export function detectCascadingErrors(worksheet, errors) {
    const errorCells = errors.map(e => e.cell);
    const cascadeMap = {};
    
    errors.forEach(errorInfo => {
      const { cell, formula } = errorInfo;
      
      if (!formula) return;
      
      // Trouver les cellules référencées qui ont aussi des erreurs
      const referencedCells = extractCellReferences(formula);
      const referencedErrorCells = referencedCells.filter(ref => errorCells.includes(ref));
      
      if (referencedErrorCells.length > 0) {
        cascadeMap[cell] = {
          isDerivative: true,
          rootCauses: referencedErrorCells
        };
      } else {
        cascadeMap[cell] = {
          isDerivative: false,
          rootCauses: []
        };
      }
    });
    
    // Identifier les erreurs racines
    const rootErrors = Object.entries(cascadeMap)
      .filter(([cell, info]) => !info.isDerivative)
      .map(([cell]) => cell);
    
    const derivativeErrors = Object.entries(cascadeMap)
      .filter(([cell, info]) => info.isDerivative)
      .map(([cell, info]) => ({ cell, rootCauses: info.rootCauses }));
    
    return {
      rootErrors,
      derivativeErrors,
      hasACascade: derivativeErrors.length > 0
    };
  }
  
  /**
   * Détecte des patterns d'erreurs
   */
  export function detectErrorPatterns(errors) {
    const patterns = [];
    
    // Pattern 1 : Même erreur sur toute une colonne/ligne
    const errorsByType = {};
    errors.forEach(e => {
      if (!errorsByType[e.error]) errorsByType[e.error] = [];
      errorsByType[e.error].push(e.cell);
    });
    
    Object.entries(errorsByType).forEach(([errorType, cells]) => {
      if (cells.length >= 3) {
        // Vérifier si c'est une colonne
        const columns = cells.map(cell => cell.match(/[A-Z]+/)[0]);
        const uniqueColumns = [...new Set(columns)];
        
        if (uniqueColumns.length === 1) {
          patterns.push({
            type: 'column_error',
            errorType,
            column: uniqueColumns[0],
            affectedCells: cells,
            suggestion: `Toute la colonne ${uniqueColumns[0]} a l'erreur ${errorType}. ` +
                       `Vérifie la formule de base, puis copie-la correctement.`
          });
        }
        
        // Vérifier si c'est une ligne
        const rows = cells.map(cell => cell.match(/\d+/)[0]);
        const uniqueRows = [...new Set(rows)];
        
        if (uniqueRows.length === 1) {
          patterns.push({
            type: 'row_error',
            errorType,
            row: uniqueRows[0],
            affectedCells: cells,
            suggestion: `Toute la ligne ${uniqueRows[0]} a l'erreur ${errorType}. ` +
                       `Vérifie la formule de base, puis copie-la correctement.`
          });
        }
      }
    });
    
    // Pattern 2 : Beaucoup de #REF! (suppression probable)
    if (errorsByType['#REF!'] && errorsByType['#REF!'].length >= 3) {
      patterns.push({
        type: 'mass_ref_error',
        affectedCells: errorsByType['#REF!'],
        suggestion: `Tu as ${errorsByType['#REF!'].length} erreurs #REF!. ` +
                   `As-tu supprimé des lignes ou colonnes récemment ? ` +
                   `Essaie Ctrl+Z pour annuler, ou recrée les formules.`
      });
    }
    
    return patterns;
  }
  
  /**
   * Extrait les références de cellules d'une formule
   */
  function extractCellReferences(formula) {
    if (!formula) return [];
    
    // Regex pour capturer A1, B2, AA10, etc.
    const cellRegex = /\b[A-Z]+\d+\b/g;
    const matches = formula.match(cellRegex);
    
    return matches ? [...new Set(matches)] : [];
  }
  
  /**
   * Vérifie si une cellule a une erreur
   */
  function hasError(cell) {
    if (cell.value && typeof cell.value === 'object' && cell.value.error) {
      return true;
    }
    
    if (cell.result && typeof cell.result === 'object' && cell.result.error) {
      return true;
    }
    
    if (typeof cell.value === 'string' && cell.value.startsWith('#')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Identifie le type d'erreur Excel
   */
  function getErrorType(errorCode) {
    const errorTypes = {
      '#DIV/0!': 'Division par zéro',
      '#N/A': 'Valeur non disponible',
      '#NAME?': 'Nom de fonction non reconnu',
      '#NULL!': 'Intersection de plages vide',
      '#NUM!': 'Valeur numérique invalide',
      '#REF!': 'Référence de cellule invalide',
      '#VALUE!': 'Type de valeur incorrect'
    };
    
    return errorTypes[errorCode] || 'Erreur inconnue';
  }
  
  export default {
    analyzeErrorWithContext,
    detectCascadingErrors,
    detectErrorPatterns
  };