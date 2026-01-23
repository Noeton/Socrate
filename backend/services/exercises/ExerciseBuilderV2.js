import logger from '@/lib/logger';
/**
 * EXERCISE BUILDER V2
 * 
 * Génère des fichiers Excel de qualité professionnelle pour Socrate.
 * 
 * AMÉLIORATIONS v2 :
 * 1. Support multi-feuilles (Données, Analyse, Dashboard, etc.)
 * 2. Structure _socrate enrichie (expected_value, tolerance, competence_id)
 * 3. Feuille Instructions immersive avec contexte
 * 4. Formatage professionnel
 * 5. Validation des données intégrée
 */

import ExcelJS from 'exceljs';

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const STYLES = {
  title: {
    font: { bold: true, size: 16, color: { argb: 'FF2E5090' } },
    alignment: { horizontal: 'left', vertical: 'middle' }
  },
  subtitle: {
    font: { bold: true, size: 12, color: { argb: 'FF4A4A4A' } },
    alignment: { horizontal: 'left', vertical: 'middle' }
  },
  header: {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
  },
  data: {
    font: { size: 10 },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
    }
  },
  currency: {
    numFmt: '#,##0.00 €'
  },
  percent: {
    numFmt: '0.0%'
  },
  label: {
    font: { bold: true, size: 10, color: { argb: 'FF2E5090' } },
    alignment: { horizontal: 'right', vertical: 'middle' }
  },
  result: {
    font: { size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: {
      top: { style: 'medium', color: { argb: 'FFED7D31' } },
      left: { style: 'medium', color: { argb: 'FFED7D31' } },
      bottom: { style: 'medium', color: { argb: 'FFED7D31' } },
      right: { style: 'medium', color: { argb: 'FFED7D31' } }
    }
  },
  manager_quote: {
    font: { italic: true, size: 10, color: { argb: 'FF666666' } }
  },
  warning: {
    font: { bold: true, size: 10, color: { argb: 'FFCC0000' } }
  },
  success: {
    font: { bold: true, size: 10, color: { argb: 'FF008800' } }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère un fichier Excel complet à partir d'un exercice
 * @param {Object} exercise - L'exercice avec contexte, données, checkpoints
 * @param {Object} options - Options de génération
 * @returns {Promise<Buffer>} Buffer du fichier Excel
 */
export async function buildExerciseWorkbook(exercise, options = {}) {
  const {
    includeInstructions = true,
    includeSocrate = true,
    format = 'xlsx'
  } = options;
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Socrate';
  workbook.created = new Date();
  
  // 1. Feuille Instructions (si activée)
  if (includeInstructions) {
    buildInstructionsSheet(workbook, exercise);
  }
  
  // 2. Feuille(s) de données
  buildDataSheets(workbook, exercise);
  
  // 3. Feuille de travail (Analyse)
  buildWorkSheet(workbook, exercise);
  
  // 4. Feuille _socrate (cachée, pour la correction)
  if (includeSocrate) {
    buildSocrateSheet(workbook, exercise);
  }
  
  // 5. Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTION DES FEUILLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Construit la feuille d'instructions
 */
function buildInstructionsSheet(workbook, exercise) {
  const sheet = workbook.addWorksheet('📋 Instructions', {
    properties: { tabColor: { argb: 'FF2E5090' } }
  });
  
  let row = 1;
  
  // Titre
  sheet.getCell(`A${row}`).value = exercise.titre || 'Exercice Socrate';
  sheet.getCell(`A${row}`).style = STYLES.title;
  sheet.mergeCells(`A${row}:F${row}`);
  row += 2;
  
  // Contexte
  const contexte = exercise.contexte;
  if (contexte) {
    sheet.getCell(`A${row}`).value = '📌 CONTEXTE';
    sheet.getCell(`A${row}`).style = STYLES.subtitle;
    row++;
    
    // Situation
    if (contexte.situation) {
      sheet.getCell(`A${row}`).value = contexte.situation;
      sheet.mergeCells(`A${row}:F${row}`);
      sheet.getRow(row).height = 40;
      row++;
    }
    
    // Manager
    if (contexte.manager) {
      row++;
      sheet.getCell(`A${row}`).value = `👤 ${contexte.manager.nom} (${contexte.manager.poste})`;
      sheet.getCell(`A${row}`).style = STYLES.label;
      row++;
      
      if (contexte.manager.demande) {
        sheet.getCell(`A${row}`).value = `"${contexte.manager.demande}"`;
        sheet.getCell(`A${row}`).style = STYLES.manager_quote;
        sheet.mergeCells(`A${row}:F${row}`);
        sheet.getRow(row).height = 30;
        row++;
      }
    }
    
    // Enjeux et deadline
    if (contexte.enjeux) {
      row++;
      sheet.getCell(`A${row}`).value = '⚠️ Enjeux :';
      sheet.getCell(`A${row}`).style = STYLES.warning;
      sheet.getCell(`B${row}`).value = contexte.enjeux;
      sheet.mergeCells(`B${row}:F${row}`);
      row++;
    }
    
    if (contexte.deadline) {
      sheet.getCell(`A${row}`).value = '⏰ Deadline :';
      sheet.getCell(`A${row}`).style = STYLES.warning;
      sheet.getCell(`B${row}`).value = contexte.deadline;
      row++;
    }
    
    row += 2;
  }
  
  // Présentation des données
  if (exercise.presentation_donnees) {
    sheet.getCell(`A${row}`).value = '📊 DONNÉES';
    sheet.getCell(`A${row}`).style = STYLES.subtitle;
    row++;
    sheet.getCell(`A${row}`).value = exercise.presentation_donnees;
    sheet.mergeCells(`A${row}:F${row}`);
    sheet.getRow(row).height = 30;
    row += 2;
  }
  
  // Consignes / Étapes
  sheet.getCell(`A${row}`).value = '✅ À FAIRE';
  sheet.getCell(`A${row}`).style = STYLES.subtitle;
  row++;
  
  // Si étapes structurées
  if (exercise.etapes && Array.isArray(exercise.etapes)) {
    exercise.etapes.forEach(etape => {
      row++;
      sheet.getCell(`A${row}`).value = etape.phase || etape.titre;
      sheet.getCell(`A${row}`).style = { font: { bold: true, size: 11 } };
      row++;
      
      if (etape.objectif) {
        sheet.getCell(`A${row}`).value = `Objectif : ${etape.objectif}`;
        sheet.getCell(`A${row}`).style = { font: { italic: true, size: 10 } };
        row++;
      }
      
      const consignes = etape.consignes || etape.questions?.map(q => q.consigne) || [];
      consignes.forEach((consigne, i) => {
        sheet.getCell(`A${row}`).value = `${i + 1}. ${consigne}`;
        sheet.mergeCells(`A${row}:F${row}`);
        sheet.getRow(row).height = 20;
        row++;
      });
    });
  }
  // Si consignes simples
  else if (exercise.consignes && Array.isArray(exercise.consignes)) {
    exercise.consignes.forEach((consigne, i) => {
      sheet.getCell(`A${row}`).value = `${i + 1}. ${typeof consigne === 'string' ? consigne : consigne.texte}`;
      sheet.mergeCells(`A${row}:F${row}`);
      sheet.getRow(row).height = 20;
      row++;
    });
  }
  
  row += 2;
  
  // Message Socrate
  const socrateMsg = exercise.socrate_message?.intro || exercise.messages_socrate?.intro;
  if (socrateMsg) {
    sheet.getCell(`A${row}`).value = '💡 Conseil Socrate';
    sheet.getCell(`A${row}`).style = STYLES.subtitle;
    row++;
    sheet.getCell(`A${row}`).value = socrateMsg;
    sheet.getCell(`A${row}`).style = { font: { italic: true, color: { argb: 'FF2E5090' } } };
    sheet.mergeCells(`A${row}:F${row}`);
  }
  
  // Ajuster les colonnes
  sheet.getColumn(1).width = 15;
  sheet.getColumn(2).width = 60;
  sheet.columns.forEach((col, i) => {
    if (i > 1) col.width = 12;
  });
  
  console.log(`✅ [ExerciseBuilder] Feuille Instructions créée`);
}

/**
 * Construit les feuilles de données
 */
function buildDataSheets(workbook, exercise) {
  const donnees = exercise.donnees;
  
  if (!donnees) {
    console.warn('⚠️ [ExerciseBuilder] Pas de données dans l\'exercice');
    return;
  }
  
  // Cas simple : headers + rows au niveau racine
  if (donnees.headers && donnees.rows) {
    const sheet = workbook.addWorksheet('💼 Données', {
      properties: { tabColor: { argb: 'FF70AD47' } }
    });
    
    populateDataSheet(sheet, donnees.headers, donnees.rows);
    return;
  }
  
  // Cas multi-feuilles : chaque clé est une feuille
  for (const [sheetName, sheetData] of Object.entries(donnees)) {
    if (sheetData.headers && sheetData.rows) {
      const sheet = workbook.addWorksheet(sheetName, {
        properties: { tabColor: { argb: 'FF70AD47' } }
      });
      
      populateDataSheet(sheet, sheetData.headers, sheetData.rows);
    }
  }
}

/**
 * Remplit une feuille avec des données
 */
function populateDataSheet(sheet, headers, rows) {
  // En-têtes (ligne 1)
  headers.forEach((header, colIndex) => {
    const cell = sheet.getCell(1, colIndex + 1);
    cell.value = header;
    Object.assign(cell, { style: STYLES.header });
  });
  
  // Données (lignes 2+)
  rows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = sheet.getCell(rowIndex + 2, colIndex + 1);
      cell.value = value;
      
      // Appliquer style de base
      cell.style = { ...STYLES.data };
      
      // Format monétaire si c'est un montant
      if (typeof value === 'number' && (
        headers[colIndex].toLowerCase().includes('montant') ||
        headers[colIndex].toLowerCase().includes('prix') ||
        headers[colIndex].toLowerCase().includes('salaire') ||
        headers[colIndex].toLowerCase().includes('ca')
      )) {
        cell.numFmt = '#,##0.00 €';
      }
      
      // Format pourcentage
      if (typeof value === 'number' && (
        headers[colIndex].toLowerCase().includes('%') ||
        headers[colIndex].toLowerCase().includes('taux') ||
        headers[colIndex].toLowerCase().includes('marge')
      )) {
        // Si la valeur est > 1, c'est probablement un pourcentage (ex: 15 pour 15%)
        // Si < 1, c'est déjà en décimal (ex: 0.15 pour 15%)
        if (value <= 1 && value >= -1) {
          cell.numFmt = '0.0%';
        }
      }
    });
  });
  
  // Auto-ajuster les colonnes
  headers.forEach((_, colIndex) => {
    const column = sheet.getColumn(colIndex + 1);
    let maxLength = headers[colIndex].length;
    
    rows.forEach(row => {
      const cellLength = String(row[colIndex] || '').length;
      if (cellLength > maxLength) maxLength = cellLength;
    });
    
    column.width = Math.min(Math.max(maxLength + 2, 10), 40);
  });
  
  // Figer la première ligne
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  
  // Filtre automatique
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length + 1, column: headers.length }
  };
  
  console.log(`✅ [ExerciseBuilder] Feuille données créée (${rows.length} lignes)`);
}

/**
 * Construit la feuille de travail (Analyse)
 */
function buildWorkSheet(workbook, exercise) {
  const sheet = workbook.addWorksheet('📊 Analyse', {
    properties: { tabColor: { argb: 'FFED7D31' } }
  });
  
  // Titre
  sheet.getCell('A1').value = 'ZONE DE TRAVAIL';
  sheet.getCell('A1').style = STYLES.title;
  
  // Labels pour les cellules de résultat (basé sur les checkpoints)
  const checkpoints = exercise.checkpoints || [];
  
  // Déterminer où placer les labels
  // On crée une structure de labels basée sur les checkpoints
  let currentRow = 3;
  
  checkpoints.forEach((cp, index) => {
    // Extraire la cellule cible
    let cellRef = cp.cellule;
    if (cellRef.includes('!')) {
      // Si c'est une référence multi-feuille (ex: Analyse!B3), extraire juste la cellule
      const parts = cellRef.split('!');
      if (parts[0].toLowerCase().includes('analyse')) {
        cellRef = parts[1];
      } else {
        return; // Ce checkpoint n'est pas pour cette feuille
      }
    }
    
    // Ajouter un label à gauche de la cellule
    const cellCol = cellRef.match(/[A-Z]+/)?.[0] || 'B';
    const cellRow = parseInt(cellRef.match(/\d+/)?.[0] || currentRow);
    
    // Si la colonne est B ou plus, mettre le label en A
    if (cellCol >= 'B') {
      const labelCell = sheet.getCell(`A${cellRow}`);
      labelCell.value = `${cp.description || `Résultat ${index + 1}`} :`;
      labelCell.style = STYLES.label;
    }
    
    // Marquer la cellule de résultat avec un style spécial
    const resultCell = sheet.getCell(cellRef);
    resultCell.style = STYLES.result;
    
    currentRow = Math.max(currentRow, cellRow + 1);
  });
  
  // Ajuster les colonnes
  sheet.getColumn(1).width = 30;
  for (let i = 2; i <= 10; i++) {
    sheet.getColumn(i).width = 15;
  }
  
  console.log(`✅ [ExerciseBuilder] Feuille Analyse créée`);
}

/**
 * Construit la feuille _socrate (métadonnées pour correction)
 */
function buildSocrateSheet(workbook, exercise) {
  const sheet = workbook.addWorksheet('_socrate', {
    properties: { tabColor: { argb: 'FF7030A0' } },
    state: 'veryHidden' // Caché pour l'utilisateur
  });
  
  let row = 1;
  
  // === METADATA ===
  sheet.getCell(`A${row}`).value = 'SOCRATE_METADATA';
  sheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: 'FF7030A0' } };
  row += 2;
  
  sheet.getCell(`A${row}`).value = 'version';
  sheet.getCell(`B${row}`).value = '2.0';
  row++;
  
  sheet.getCell(`A${row}`).value = 'exercise_id';
  sheet.getCell(`B${row}`).value = exercise.id || 'unknown';
  row++;
  
  sheet.getCell(`A${row}`).value = 'titre';
  sheet.getCell(`B${row}`).value = exercise.titre || '';
  row++;
  
  sheet.getCell(`A${row}`).value = 'niveau';
  sheet.getCell(`B${row}`).value = exercise.metadata?.niveau || exercise.niveau || 'intermediaire';
  row++;
  
  sheet.getCell(`A${row}`).value = 'nb_lignes_donnees';
  sheet.getCell(`B${row}`).value = exercise.donnees?.rows?.length || 0;
  row++;
  
  const totalPoints = (exercise.checkpoints || []).reduce((sum, cp) => sum + (cp.points || 0), 0);
  sheet.getCell(`A${row}`).value = 'total_points';
  sheet.getCell(`B${row}`).value = totalPoints;
  row++;
  
  sheet.getCell(`A${row}`).value = 'seuil_reussite';
  sheet.getCell(`B${row}`).value = exercise.scoring?.seuil_reussite || 70;
  row += 2;
  
  // === CHECKPOINTS ===
  sheet.getCell(`A${row}`).value = 'CHECKPOINTS';
  sheet.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: 'FFCC6600' } };
  row++;
  
  // Headers - Version enrichie
  const cpHeaders = [
    'id', 'cellule', 'type', 'description', 'fonction', 'pattern',
    'recopie_jusqua', 'points', 'indice_1', 'indice_2', 'indice_3',
    'expected_value', 'tolerance', 'competence_id', 'computation_type'
  ];
  
  cpHeaders.forEach((header, idx) => {
    const cell = sheet.getCell(row, idx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
  });
  row++;
  
  // Data
  (exercise.checkpoints || []).forEach((checkpoint, idx) => {
    sheet.getCell(row, 1).value = checkpoint.id || `cp_${idx + 1}`;
    sheet.getCell(row, 2).value = checkpoint.cellule;
    sheet.getCell(row, 3).value = checkpoint.type || 'formule';
    sheet.getCell(row, 4).value = checkpoint.description || '';
    sheet.getCell(row, 5).value = checkpoint.fonction || '';
    
    const patternStr = Array.isArray(checkpoint.pattern)
      ? checkpoint.pattern.join('||')
      : (checkpoint.pattern || '');
    sheet.getCell(row, 6).value = patternStr;
    
    sheet.getCell(row, 7).value = checkpoint.recopie_jusqua || '';
    sheet.getCell(row, 8).value = checkpoint.points || 0;
    sheet.getCell(row, 9).value = checkpoint.indices?.[0] || '';
    sheet.getCell(row, 10).value = checkpoint.indices?.[1] || '';
    sheet.getCell(row, 11).value = checkpoint.indices?.[2] || '';
    
    // Nouvelles colonnes V2
    sheet.getCell(row, 12).value = checkpoint.expected_value ?? '';
    sheet.getCell(row, 13).value = checkpoint.tolerance ?? '';
    sheet.getCell(row, 14).value = checkpoint.competence_id ?? '';
    sheet.getCell(row, 15).value = checkpoint.computation?.type || '';
    
    row++;
  });
  
  // Auto-width
  const widths = [8, 15, 10, 40, 12, 30, 12, 8, 40, 40, 40, 15, 10, 12, 15];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
  
  console.log(`✅ [ExerciseBuilder] Feuille _socrate créée (${(exercise.checkpoints || []).length} checkpoints)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { STYLES };

export default {
  buildExerciseWorkbook
};