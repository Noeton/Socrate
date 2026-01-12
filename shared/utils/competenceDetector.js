/**
 * DÉTECTION INTELLIGENTE DES COMPÉTENCES EXCEL
 */

import { findCompetence } from '../data/competencesExcel.js';

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
  if (/\b(CONCATENER|CONCAT)\s*\(/.test(allFormulasText)) {
    competences.add('CONCATENER');
  }
  
  if (/\b(GAUCHE|DROITE|LEFT|RIGHT)\s*\(/.test(allFormulasText)) {
    competences.add('Formules texte (GAUCHE, DROITE)');
  }

  // Formules date
  if (/\b(AUJOURDHUI|TODAY|MOIS|ANNEE|MONTH|YEAR)\s*\(/.test(allFormulasText)) {
    competences.add('Formules date (AUJOURDHUI, MOIS)');
  }

  // Gestion d'erreurs
  if (/\bSIERREUR\s*\(/.test(allFormulasText) || /\bIFERROR\s*\(/.test(allFormulasText)) {
    competences.add('SIERREUR');
  }

  // Formules dynamiques Excel 365
  if (/\b(FILTER|SORT|UNIQUE)\s*\(/.test(allFormulasText)) {
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

  // Références absolues
  const hasAbsoluteRefs = formulas.some(f => /\$[A-Z]+\$?\d+/.test(f));
  if (hasAbsoluteRefs) {
    competences.add('Références absolues ($)');
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

export function evaluateCompetenceMastery(competenceName, formulas) {
  // Simple pour l'instant : présence = 70%
  return 70;
}

export default {
  detectCompetencesFromExercise,
  evaluateCompetenceMastery
};

