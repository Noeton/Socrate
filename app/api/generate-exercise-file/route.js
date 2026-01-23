import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import logger from '@/lib/logger';
import { validateRequest, generateExerciseFileSchema, sanitizeString } from '@/lib/validators';
import ExerciseLibrary from '@/backend/services/exercises/ExerciseLibrary';
import AdaptiveEngine from '@/backend/services/socrate/AdaptiveEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS POUR FORMATER LES DONNÉES D'EXERCICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Formate le contexte (objet ou string) en texte lisible
 */
function formatContexte(contexte) {
  if (!contexte) return 'Exercice pratique Excel';
  
  // Si c'est déjà une string, on la retourne
  if (typeof contexte === 'string') return contexte;
  
  // Si c'est un objet, on extrait les informations
  if (typeof contexte === 'object') {
    const parts = [];
    
    // Situation principale
    if (contexte.situation) {
      parts.push(contexte.situation);
    }
    
    // Message du manager
    if (contexte.manager) {
      const { nom, poste, demande } = contexte.manager;
      if (demande) {
        parts.push('');
        parts.push(`📋 ${nom || 'Ton manager'}${poste ? ' (' + poste + ')' : ''} :`);
        parts.push('"' + demande + '"');
      }
    }
    
    // Enjeux et deadline
    if (contexte.enjeux) {
      parts.push('');
      parts.push('🎯 Enjeux : ' + contexte.enjeux);
    }
    if (contexte.deadline) {
      parts.push('⏰ Deadline : ' + contexte.deadline);
    }
    
    return parts.join('\n') || 'Exercice pratique Excel';
  }
  
  return 'Exercice pratique Excel';
}

/**
 * Extrait les consignes depuis "consignes" ou "etapes"
 */
function extractConsignes(exercise) {
  // Priorité 1: consignes directes
  if (exercise.consignes && Array.isArray(exercise.consignes) && exercise.consignes.length > 0) {
    return exercise.consignes;
  }
  
  // Priorité 2: extraire depuis étapes
  if (exercise.etapes && Array.isArray(exercise.etapes)) {
    const consignes = [];
    exercise.etapes.forEach((etape) => {
      if (etape.phase) {
        consignes.push(etape.phase);
      } else if (etape.titre) {
        consignes.push(etape.titre);
      } else if (etape.description) {
        consignes.push(etape.description);
      }
      
      // Ajouter les raccourcis importants
      if (etape.raccourcis && Array.isArray(etape.raccourcis)) {
        etape.raccourcis.slice(0, 2).forEach(r => {
          consignes.push('   → ' + r);
        });
      }
    });
    if (consignes.length > 0) return consignes;
  }
  
  // Priorité 3: générer depuis checkpoints
  if (exercise.checkpoints && Array.isArray(exercise.checkpoints)) {
    return exercise.checkpoints.map(cp => 
      cp.description || ('Compléter ' + (cp.cellule || 'la tâche'))
    );
  }
  
  // Fallback
  return ['Suivre les instructions de l\'exercice'];
}

/**
 * Extrait les données (headers + rows) depuis différentes structures
 */
function extractDonnees(donnees) {
  if (!donnees) return { headers: null, rows: null };
  
  // Structure standard: { headers: [...], rows: [[...], ...] }
  if (donnees.headers && donnees.rows && donnees.rows.length > 0) {
    return { headers: donnees.headers, rows: donnees.rows };
  }
  
  // Structure avec headers mais rows vide ou manquant
  if (donnees.headers && (!donnees.rows || donnees.rows.length === 0)) {
    return { headers: donnees.headers, rows: [] };
  }
  
  // Structures alternatives courantes
  const alternativeKeys = [
    'donnees_produits', 'donnees_mensuelles', 'donnees_categories',
    'rows_ventes', 'table_ventes', 'table_licences', 'employes',
    'bareme_primes', 'grille_tarifaire', 'taux_change', 'montants_eur',
    'grille_conversion', 'formulaire', 'formulaire_recherche',
    'formulaire_cotation', 'zones_resultats'
  ];
  
  for (const key of alternativeKeys) {
    if (donnees[key]) {
      const data = donnees[key];
      
      // Si c'est un array d'objets, extraire les clés comme headers
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
        const headers = Object.keys(data[0]);
        const rows = data.map(obj => headers.map(h => obj[h]));
        return { headers, rows };
      }
      
      // Si c'est un array de arrays
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
        return { headers: data[0], rows: data.slice(1) };
      }
      
      // Si c'est un objet avec sa propre structure headers/rows
      if (typeof data === 'object' && data.headers && data.rows) {
        return { headers: data.headers, rows: data.rows };
      }
    }
  }
  
  // Cas spéciaux
  if (donnees.feuille_source && donnees.rows_ventes) {
    return { 
      headers: donnees.headers_ventes || ['Données'], 
      rows: donnees.rows_ventes 
    };
  }
  
  // Structure/attendu (exercices de séries)
  if (donnees.structure || donnees.attendu) {
    return { 
      headers: ['Instruction'], 
      rows: [['Cet exercice implique la création de séries automatiques - voir les consignes']] 
    };
  }
  
  // Fichiers externes (Power Query)
  if (donnees.fichier_ventes || donnees.fichier_regions) {
    return { 
      headers: ['Note'], 
      rows: [['Cet exercice utilise des fichiers externes - voir les instructions détaillées']] 
    };
  }
  
  return { headers: null, rows: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTE
// ═══════════════════════════════════════════════════════════════════════════════

// Support GET pour window.open()
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');
    const competence = searchParams.get('competence');
    const niveau = searchParams.get('niveau') || 'debutant';
    
    // Créer un userId temporaire pour GET
    const userId = 'guest-' + Date.now();
    
    return generateExcelFile({ userId, exerciseId, competence, niveau });
  } catch (error) {
    logger.error('GENERATE-FILE GET', 'Erreur', { error: error.message });
    return NextResponse.json({ error: error.message || 'Erreur lors de la génération' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, exerciseId, competence, niveau = 'debutant' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    return generateExcelFile({ userId, exerciseId, competence, niveau });
  } catch (error) {
    logger.error('GENERATE-FILE POST', 'Erreur', { error: error.message });
    return NextResponse.json({ error: error.message || 'Erreur lors de la génération' }, { status: 500 });
  }
}

// Fonction commune pour générer le fichier
async function generateExcelFile({ userId, exerciseId, competence, niveau }) {
  try {
    logger.info('GENERATE-FILE', 'Demande génération', { userId: userId?.substring(0, 8), exerciseId, niveau });

    // 1. Trouver l'exercice
    let exercise = null;

    if (exerciseId) {
      exercise = ExerciseLibrary.getExerciseById(sanitizeString(exerciseId));
      if (exercise) {
        logger.debug('GENERATE-FILE', 'Exercice trouvé par ID', { exerciseId });
      } else {
        logger.warn('GENERATE-FILE', 'ExerciseId non trouvé, fallback adaptatif', { exerciseId });
      }
    }

    if (!exercise) {
      try {
        const recommendation = await AdaptiveEngine.selectNextExercise({
          niveau: niveau,
          competences: {},
          progression: { streakReussites: 0, exercicesReussis: 0, exercicesEchoues: 0, topicsVus: [] },
          comportement: { vitesseComprehension: 'normale', modePrefere: 'learning' }
        });
        exercise = ExerciseLibrary.getExerciseByRecommendation(recommendation, userId, []);
      } catch (adaptiveError) {
        logger.warn('GENERATE-FILE', 'AdaptiveEngine error', { error: adaptiveError.message });
      }
    }

    if (!exercise) {
      logger.debug('GENERATE-FILE', 'Fallback premier exercice', { niveau });
      ExerciseLibrary.initialize();
      exercise = ExerciseLibrary.exercises?.find(e => e.niveau === niveau) || 
                 ExerciseLibrary.exercises?.[0];
    }

    if (!exercise) {
      return NextResponse.json({ error: 'Aucun exercice disponible' }, { status: 404 });
    }

    logger.info('GENERATE-FILE', 'Exercice sélectionné', { id: exercise.id, titre: exercise.titre });

    // 2. Générer le fichier Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Socrate - Tuteur Excel';
    workbook.created = new Date();

    // Extraire les données avec le helper intelligent
    const { headers, rows } = extractDonnees(exercise.donnees);

    // Feuille principale avec les données
    const worksheet = workbook.addWorksheet('Exercice', {
      properties: { tabColor: { argb: '4472C4' } }
    });

    if (headers && headers.length > 0) {
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
      headerRow.alignment = { horizontal: 'center' };
    }

    if (rows && rows.length > 0) {
      rows.forEach(row => worksheet.addRow(row));
    } else {
      worksheet.addRow(['Les données de cet exercice seront créées par vous']);
      worksheet.getRow(1).font = { italic: true, color: { argb: '666666' } };
    }

    worksheet.columns.forEach(column => { column.width = 15; });

    // Feuille des consignes
    const consignesSheet = workbook.addWorksheet('Consignes', {
      properties: { tabColor: { argb: '70AD47' } }
    });

    consignesSheet.addRow(['EXERCICE : ' + exercise.titre]);
    consignesSheet.getRow(1).font = { bold: true, size: 14 };
    consignesSheet.addRow([]);
    
    // Contexte formaté (PAS de JSON brut !)
    consignesSheet.addRow(['CONTEXTE :']);
    consignesSheet.getRow(3).font = { bold: true };
    
    const contexteFormate = formatContexte(exercise.contexte);
    contexteFormate.split('\n').forEach(line => {
      const row = consignesSheet.addRow([line]);
      row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    });
    
    consignesSheet.addRow([]);
    consignesSheet.addRow(['CONSIGNES :']);
    consignesSheet.getRow(consignesSheet.rowCount).font = { bold: true };
    
    const consignes = extractConsignes(exercise);
    let consigneNum = 1;
    consignes.forEach((consigne) => {
      if (consigne.startsWith('   ')) {
        consignesSheet.addRow([consigne]);
      } else {
        consignesSheet.addRow([consigneNum + '. ' + consigne]);
        consigneNum++;
      }
    });

    consignesSheet.addRow([]);
    consignesSheet.addRow(['OBJECTIFS :']);
    consignesSheet.getRow(consignesSheet.rowCount).font = { bold: true };

    if (exercise.objectifs && exercise.objectifs.length > 0) {
      exercise.objectifs.forEach(objectif => consignesSheet.addRow(['• ' + objectif]));
    }

    consignesSheet.getColumn(1).width = 80;

    consignesSheet.addRow([]);
    consignesSheet.addRow(['---']);
    consignesSheet.addRow(['Une fois terminé, uploade ce fichier sur Socrate pour correction !']);
    consignesSheet.getRow(consignesSheet.rowCount).font = { italic: true, color: { argb: '666666' } };

    // 3. Retourner le fichier
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="exercice_' + exercise.id + '.xlsx"',
        'X-Exercise-Id': exercise.id,
        'X-Exercise-Title': encodeURIComponent(exercise.titre)
      }
    });

  } catch (error) {
    logger.error('GENERATE-FILE', 'Erreur', { error: error.message });
    return NextResponse.json({ error: error.message || 'Erreur lors de la génération' }, { status: 500 });
  }
}