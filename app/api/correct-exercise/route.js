import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getSupabaseAdmin } from '@/lib/config';
import logger from '@/lib/logger';
import { validateFile, sanitizeString } from '@/lib/validators';
import { checkRateLimit, getRateLimitHeaders, rateLimitExceededResponse } from '@/lib/rateLimit';
import SpacedRepetition from '@/backend/services/learning/SpacedRepetition';
import ExerciseLibrary from '@/backend/services/exercises/ExerciseLibrary';
import { validateAllCheckpoints, generateFeedbackReport } from '@/backend/services/correction/CheckpointValidator';
import { VisualValidationService } from '@/backend/services/correction/VisualValidationService';

// Instance singleton du service de validation visuelle
const visualValidator = new VisualValidationService();

const supabaseAdmin = getSupabaseAdmin();

/**
 * API de correction d'exercices Excel - v2.1
 * Utilise les checkpoints pour une validation précise
 * Support des screenshots pour validation visuelle (graphiques, MFC)
 * Fallback sur Claude API si pas de checkpoints
 * 
 * POST /api/correct-exercise
 * Body (FormData):
 *   - file: Excel file
 *   - userId: string
 *   - exerciseId: string
 *   - screenshot: (optionnel) Image file pour validation visuelle
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = sanitizeString(formData.get('userId'));
    const exerciseId = sanitizeString(formData.get('exerciseId'));
    const screenshotFile = formData.get('screenshot'); // NOUVEAU
    const attemptDuration = parseInt(formData.get('attemptDuration')) || null; // NOUVEAU: durée en ms
    const exerciseGeneratedAt = formData.get('exerciseGeneratedAt') || null; // NOUVEAU: timestamp génération
    
    logger.info('CORRECT', 'Correction exercice', { 
      exerciseId, 
      userId: userId?.substring(0, 8),
      hasScreenshot: !!screenshotFile 
    });
    
    // Rate limiting
    const rateLimit = await checkRateLimit(userId || 'anonymous', '/api/correct-exercise');
    if (!rateLimit.allowed) {
      logger.warn('CORRECT', 'Rate limit atteint', { userId });
      return rateLimitExceededResponse(rateLimit);
    }
    
    // Validation des inputs
    if (!userId || !exerciseId) {
      return NextResponse.json(
        { error: 'userId ou exerciseId manquant' },
        { status: 400 }
      );
    }
    
    // Validation du fichier
    const fileValidation = validateFile(file);
    if (!fileValidation.success) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }
    
    // NOUVEAU : Convertir screenshot en base64 si présent
    let screenshotBase64 = null;
    if (screenshotFile && screenshotFile.size > 0) {
      try {
        const screenshotBuffer = await screenshotFile.arrayBuffer();
        screenshotBase64 = Buffer.from(screenshotBuffer).toString('base64');
        logger.info('CORRECT', 'Screenshot reçu', { size: screenshotFile.size });
      } catch (e) {
        logger.warn('CORRECT', 'Erreur lecture screenshot', { error: e.message });
      }
    }
    
    // NOUVEAU : Récupérer exerciseData si fourni (exercices dynamiques)
    let dynamicExerciseData = null;
    const exerciseDataStr = formData.get('exerciseData');
    if (exerciseDataStr) {
      try {
        dynamicExerciseData = JSON.parse(exerciseDataStr);
        logger.info('CORRECT', 'Exercice dynamique reçu', { 
          id: dynamicExerciseData.id,
          checkpoints: dynamicExerciseData.checkpoints?.length || 0
        });
      } catch (e) {
        logger.warn('CORRECT', 'Erreur parsing exerciseData', { error: e.message });
      }
    }
    
    // ÉTAPE 1 : Charger l'exercice original
    // Priorité : exercice dynamique > ExerciseLibrary > fallback
    let originalExercise = dynamicExerciseData || ExerciseLibrary.getExerciseById(exerciseId);
    
    if (!originalExercise) {
      logger.warn('CORRECT', 'Exercice non trouvé, fallback', { exerciseId });
      // Fallback pour exercices dynamiques/non catalogués
      return await handleFallbackCorrection(file, userId, exerciseId, screenshotBase64);
    }
    
    // Marquer si c'est un exercice dynamique
    const isDynamicExercise = !!dynamicExerciseData;
    
    logger.info('CORRECT', 'Exercice chargé', { 
      titre: originalExercise.titre, 
      checkpoints: originalExercise.checkpoints?.length || 0,
      isDynamic: isDynamicExercise
    });
    
    // ÉTAPE 2 : Extraire les données du fichier uploadé
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    // Chercher la bonne feuille
    const worksheet = findMainWorksheet(workbook);
    
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Aucune feuille de calcul trouvée' },
        { status: 400 }
      );
    }
    
    logger.debug('CORRECT', 'Feuille trouvée', { name: worksheet.name });
    
    // ÉTAPE 3 : Extraire formules et valeurs
    const userFormulas = extractFormulas(worksheet);
    const userValues = extractValues(worksheet);
    
    // Extraire aussi des autres feuilles si nécessaire (ex: feuille TVA)
    const allFormulas = { ...userFormulas };
    const allValues = { ...userValues };
    
    workbook.eachSheet((sheet, sheetId) => {
      if (sheet.name !== worksheet.name) {
        const sheetFormulas = extractFormulas(sheet, sheet.name);
        const sheetValues = extractValues(sheet, sheet.name);
        Object.assign(allFormulas, sheetFormulas);
        Object.assign(allValues, sheetValues);
      }
    });
    
    logger.debug('CORRECT', 'Données extraites', { formules: Object.keys(allFormulas).length, valeurs: Object.keys(allValues).length });
    
    // ÉTAPE 4 : Valider avec les checkpoints
    let analysis;
    
    if (originalExercise.checkpoints && originalExercise.checkpoints.length > 0) {
      // Mode CHECKPOINT (précis)
      logger.info('CORRECT', 'Mode CHECKPOINT activé');
      
      const validationResult = validateAllCheckpoints(
        originalExercise,
        allFormulas,
        allValues,
        workbook
      );
      
      // Générer le feedback
      const feedback = generateFeedbackReport(validationResult, originalExercise);
      
      // Construire l'analyse
      analysis = {
        score: validationResult.score,
        success: validationResult.score >= 7,
        competences_tested: originalExercise.competences || [],
        competences_validated: validationResult.score >= 7 ? originalExercise.competences : [],
        errors_detected: validationResult.results
          .filter(r => r.passed === false)
          .map(r => ({
            cellule: r.cellule,
            type: r.details?.missingFunction ? 'formule_incorrecte' : 'checkpoint_echoue',
            gravite: r.points >= 15 ? 'critique' : 'importante',
            description: r.feedback,
            indice: r.indice
          })),
        feedback: feedback,
        checkpoints_detail: validationResult.results
      };
      
      logger.info('CORRECT', 'Validation checkpoints', { passed: validationResult.checkpointsPassed, total: validationResult.checkpointsTotal });
      
      // NOUVEAU : Gérer les checkpoints visuels (graphiques, MFC)
      const visualCheckpoints = originalExercise.checkpoints.filter(
        cp => cp.type === 'graphique' || cp.type === 'format' || cp.validation_type === 'visual' || cp.requires_screenshot
      );
      
      if (visualCheckpoints.length > 0) {
        logger.info('CORRECT', 'Checkpoints visuels détectés', { count: visualCheckpoints.length });
        
        if (screenshotBase64) {
          // Utiliser le nouveau VisualValidationService
          try {
            const visualResults = await visualValidator.validateAll(
              visualCheckpoints,
              screenshotBase64,
              {
                exerciseId,
                exerciseTitle: originalExercise.titre,
                competences: originalExercise.competences
              }
            );
            
            if (visualResults.imageError) {
              logger.warn('CORRECT', 'Erreur image screenshot', { error: visualResults.imageError });
              analysis.feedback += `\n\n⚠️ **Erreur image** : ${visualResults.imageError}`;
            } else if (visualResults.hasVisualValidation) {
              // Mettre à jour les résultats des checkpoints visuels
              for (const visualResult of visualResults.checkpoints) {
                const cpResult = validationResult.results.find(r => r.id === visualResult.id);
                if (cpResult) {
                  cpResult.passed = visualResult.valid;
                  cpResult.score = visualResult.score;
                  cpResult.feedback = visualResult.feedback || visualResult.summary;
                  cpResult.visual_details = visualResult.details || visualResult.checks;
                  cpResult.needsManualCheck = false;
                }
                
                // Ajouter le feedback visuel spécifique
                if (visualResult.type === 'graphique') {
                  const icon = visualResult.valid ? '✅' : '⚠️';
                  analysis.feedback += `\n\n${icon} **Graphique** : ${visualResult.feedback || (visualResult.valid ? 'Bien validé' : 'À améliorer')}`;
                } else if (visualResult.type === 'format') {
                  const icon = visualResult.valid ? '✅' : '⚠️';
                  analysis.feedback += `\n\n${icon} **Mise en forme** : ${visualResult.feedback || (visualResult.valid ? 'Correcte' : 'À corriger')}`;
                }
              }
              
              // Ajuster le score global avec la composante visuelle
              if (visualResults.globalVisualScore !== undefined) {
                const visualWeight = visualCheckpoints.length / validationResult.checkpointsTotal;
                const visualContribution = (visualResults.globalVisualScore / 100) * 10 * visualWeight;
                analysis.score = Math.min(10, analysis.score * (1 - visualWeight) + visualContribution);
                analysis.score = Math.round(analysis.score * 10) / 10;
              }
              
              logger.info('CORRECT', 'Validation visuelle terminée', { 
                globalScore: visualResults.globalVisualScore,
                checkpointsValidated: visualResults.checkpoints.filter(c => c.valid).length,
                total: visualResults.checkpoints.length
              });
            }
          } catch (visualError) {
            logger.error('CORRECT', 'Erreur validation visuelle', { error: visualError.message });
            analysis.feedback += '\n\n⚠️ **Validation visuelle** : Une erreur technique s\'est produite.';
          }
        } else {
          // Pas de screenshot mais checkpoints visuels requis
          analysis.feedback += '\n\n⚠️ **Éléments visuels non vérifiés** : Pour valider tes graphiques ou ta mise en forme conditionnelle, ajoute une capture d\'écran lors de la soumission.';
          analysis.needs_screenshot = true;
          
          // Marquer les checkpoints visuels comme non validés
          for (const visualCp of visualCheckpoints) {
            const cpResult = validationResult.results.find(r => r.id === visualCp.id);
            if (cpResult) {
              cpResult.passed = false;
              cpResult.feedback = 'Screenshot requis pour validation';
              cpResult.needsScreenshot = true;
            }
          }
        }
      }
      
    } else {
      // Mode FALLBACK (Claude API)
      logger.info('CORRECT', 'Mode CLAUDE API (pas de checkpoints)');
      analysis = await analyzeWithClaudeAPI(originalExercise, allFormulas, allValues, null, screenshotBase64);
    }
    
    logger.info('CORRECT', 'Score final', { score: analysis.score });
    
    // ÉTAPE 5 : Calculer mastery level
    const masteryLevel = calculateMasteryLevel(analysis);
    
    // ÉTAPE 6 : Enregistrer dans Supabase avec données enrichies
    await saveToHistory({
      userId,
      exerciseId,
      score: analysis.score,
      success: analysis.success,
      competencesTested: analysis.competences_tested,
      competencesValidated: analysis.competences_validated,
      errors: analysis.errors_detected,
      feedback: analysis.feedback,
      checkpointsDetail: analysis.checkpoints_detail || null,
      formulasSubmitted: allFormulas,
      attemptDuration: attemptDuration,
      exerciseGeneratedAt: exerciseGeneratedAt
    });
    
    // ÉTAPE 7 : Planifier révision si réussi
    if (analysis.success) {
      await SpacedRepetition.scheduleReview(
        userId,
        exerciseId,
        masteryLevel,
        new Date()
      );
      logger.info('CORRECT', 'Révision planifiée', { userId: userId.substring(0, 8), masteryLevel });
    }
    
    // ÉTAPE 8 : Retourner le rapport
    return NextResponse.json({
      success: analysis.success,
      score: analysis.score,
      masteryLevel: masteryLevel,
      feedback: analysis.feedback,
      errors: analysis.errors_detected,
      competencesValidated: analysis.competences_validated,
      checkpointsDetail: analysis.checkpoints_detail || null,
      nextReview: analysis.success ? SpacedRepetition.calculateNextReview(masteryLevel).nextReviewAt : null,
      needs_screenshot: analysis.needs_screenshot || false // NOUVEAU
    });
    
  } catch (error) {
    logger.error('CORRECT', 'Erreur correction', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la correction' },
      { status: 500 }
    );
  }
}

/**
 * Trouve la feuille principale du classeur
 */
function findMainWorksheet(workbook) {
  // Priorité : feuille nommée explicitement
  const priorityNames = ['💼 Exercice', 'Exercice', 'Données', 'Data', 'Feuil1', 'Sheet1'];
  
  for (const name of priorityNames) {
    const sheet = workbook.getWorksheet(name);
    if (sheet) return sheet;
  }
  
  // Sinon, première feuille
  return workbook.worksheets[0];
}

/**
 * Extrait toutes les formules d'une feuille
 * @param {Worksheet} worksheet - Feuille Excel
 * @param {string} sheetPrefix - Préfixe pour les références multi-feuilles
 */
function extractFormulas(worksheet, sheetPrefix = '') {
  const formulas = {};
  const prefix = sheetPrefix ? `${sheetPrefix}!` : '';
  
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      if (cell.formula) {
        const cellRef = `${prefix}${columnToLetter(colNumber)}${rowNumber}`;
        formulas[cellRef] = cell.formula;
      }
    });
  });
  
  return formulas;
}

/**
 * Extrait toutes les valeurs d'une feuille
 */
function extractValues(worksheet, sheetPrefix = '') {
  const values = {};
  const prefix = sheetPrefix ? `${sheetPrefix}!` : '';
  
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      if (cell.value !== null && cell.value !== undefined) {
        const cellRef = `${prefix}${columnToLetter(colNumber)}${rowNumber}`;
        // Gérer les différents types de valeurs
        if (cell.value && typeof cell.value === 'object') {
          if (cell.value.result !== undefined) {
            values[cellRef] = cell.value.result; // Résultat de formule
          } else if (cell.value.text) {
            values[cellRef] = cell.value.text; // Rich text
          } else if (cell.value instanceof Date) {
            values[cellRef] = cell.value;
          } else {
            values[cellRef] = cell.value;
          }
        } else {
          values[cellRef] = cell.value;
        }
      }
    });
  });
  
  return values;
}

/**
 * Convertit un numéro de colonne en lettre (1 -> A, 27 -> AA)
 */
function columnToLetter(col) {
  let letter = '';
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * Analyse avec Claude API (fallback ou complément)
 */
async function analyzeWithClaudeAPI(exercise, userFormulas, userValues, checkpointResults = null) {
  try {
    logger.debug('CLAUDE-API', 'Démarrage analyse');
    
    // Construire le contexte selon si on a déjà des résultats de checkpoints
    let contextMessage = '';
    
    if (checkpointResults) {
      contextMessage = `
RÉSULTATS CHECKPOINTS DÉJÀ VALIDÉS :
- Score actuel : ${checkpointResults.score}/10
- Checkpoints passés : ${checkpointResults.checkpointsPassed}/${checkpointResults.checkpointsTotal}

ÉLÉMENTS À VÉRIFIER (non automatisables) :
- Présence et qualité des graphiques
- Mise en forme conditionnelle
- Lisibilité générale

Donne uniquement un feedback sur ces éléments visuels.`;
    } else {
      contextMessage = `
EXERCICE ORIGINAL :
Titre: ${exercise.titre}
Compétences attendues: ${exercise.competences?.join(', ')}

CONSIGNES :
${exercise.consignes?.join('\n')}

FORMULES SOUMISES :
${JSON.stringify(userFormulas, null, 2)}

Analyse les formules et donne un feedback pédagogique détaillé.`;
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: checkpointResults 
            ? contextMessage
            : `Tu es un correcteur d'exercices Excel expert et bienveillant.

${contextMessage}

CRITÈRES D'ÉVALUATION :
1. Les formules demandées sont-elles présentes ?
2. Sont-elles syntaxiquement correctes ?
3. Donnent-elles les bons résultats ?
4. Y a-t-il des erreurs de logique ?

RÉPONSE ATTENDUE (JSON uniquement) :
{
  "score": 0-10,
  "success": true|false,
  "competences_tested": ["SOMME", "MOYENNE", ...],
  "competences_validated": ["SOMME", ...],
  "errors_detected": [
    {
      "cellule": "E37",
      "type": "formule_manquante|formule_incorrecte|erreur_logique",
      "gravite": "critique|importante|mineure",
      "description": "Description de l'erreur",
      "correction_suggeree": "=SOMME(E2:E36)"
    }
  ],
  "feedback": "Feedback global en 2-3 phrases, bienveillant et constructif"
}

IMPORTANT : Si score >= 7 → success: true. Sois encourageant.`
        }],
        system: checkpointResults
          ? `Tu complètes l'analyse d'un exercice Excel. Concentre-toi uniquement sur les aspects visuels (graphiques, mise en forme). Sois concis.`
          : `Tu es un correcteur pédagogique expert en Excel. Tu analyses les erreurs avec précision mais ton feedback est toujours bienveillant et constructif.`
      })
    });

    const data = await response.json();
    
    if (!data.content || !data.content[0]) {
      throw new Error('Réponse API vide');
    }
    
    const aiResponse = data.content[0].text;
    
    // Si c'était juste pour les graphiques, retourner le texte
    if (checkpointResults) {
      return {
        graphiques_feedback: aiResponse
      };
    }
    
    // Sinon, parser le JSON
    const jsonText = aiResponse.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(jsonText);
    
    logger.info('CLAUDE-API', 'Analyse terminée', { score: analysis.score });
    
    return analysis;
    
  } catch (error) {
    logger.error('CLAUDE-API', 'Erreur analyse', { error: error.message });
    
    return {
      score: 5,
      success: false,
      competences_tested: exercise.competences || [],
      competences_validated: [],
      errors_detected: [{
        type: 'analyse_impossible',
        gravite: 'importante',
        description: 'Impossible d\'analyser automatiquement'
      }],
      feedback: 'Erreur d\'analyse. Vérifie que ton fichier est bien au format Excel.'
    };
  }
}

/**
 * Gestion fallback pour exercices non catalogués
 * @param {File} file - Fichier Excel uploadé
 * @param {string} userId - ID utilisateur
 * @param {string} exerciseId - ID exercice
 * @param {string|null} screenshotBase64 - Screenshot optionnel pour validation visuelle
 */
async function handleFallbackCorrection(file, userId, exerciseId, screenshotBase64 = null) {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: 'Aucune feuille trouvée' }, { status: 400 });
    }
    
    const userFormulas = extractFormulas(worksheet);
    const userValues = extractValues(worksheet);
    
    // Analyse basique avec Claude (inclut screenshot si disponible)
    const analysis = await analyzeWithClaudeAPI(
      { titre: 'Exercice', competences: [], consignes: [] },
      userFormulas,
      userValues,
      null,
      screenshotBase64
    );
    
    return NextResponse.json({
      success: analysis.success,
      score: analysis.score,
      feedback: analysis.feedback,
      errors: analysis.errors_detected
    });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Calcule le mastery level (0-100)
 */
function calculateMasteryLevel(analysis) {
  const baseScore = analysis.score * 10;
  
  let adjustment = 0;
  
  if (analysis.errors_detected) {
    const criticalErrors = analysis.errors_detected.filter(e => e.gravite === 'critique').length;
    const importantErrors = analysis.errors_detected.filter(e => e.gravite === 'importante').length;
    
    adjustment -= criticalErrors * 10;
    adjustment -= importantErrors * 5;
  }
  
  if (analysis.competences_validated && analysis.competences_tested) {
    const validationRate = analysis.competences_validated.length / Math.max(analysis.competences_tested.length, 1);
    adjustment += validationRate * 10;
  }
  
  const finalMastery = Math.max(0, Math.min(100, baseScore + adjustment));
  
  logger.debug('MASTERY', 'Calcul mastery', { score: analysis.score, mastery: finalMastery });
  
  return Math.round(finalMastery);
}

// Version du validateur pour traçabilité
const VALIDATOR_VERSION = '2.1.0';

/**
 * Extrait les types d'erreurs depuis les erreurs détectées
 * @param {Array} errors - Erreurs détectées
 * @returns {string[]} Types d'erreurs uniques
 */
function extractErrorTypes(errors) {
  if (!errors || !Array.isArray(errors)) return [];
  
  const types = new Set();
  
  for (const error of errors) {
    if (error.type) {
      types.add(error.type);
    }
    // Extraire des types supplémentaires depuis les détails
    if (error.details?.missingFunction) {
      types.add('fonction_manquante');
    }
    if (error.details?.wrongFunction) {
      types.add('fonction_incorrecte');
    }
    if (error.details?.rangeError) {
      types.add('plage_incorrecte');
    }
    if (error.details?.syntaxError) {
      types.add('erreur_syntaxe');
    }
    if (error.details?.referenceError) {
      types.add('reference_incorrecte');
    }
    if (error.details?.valueError) {
      types.add('valeur_incorrecte');
    }
  }
  
  return Array.from(types);
}

/**
 * Extrait les indices utilisés depuis les résultats de validation
 * @param {Array} checkpointsDetail - Détails des checkpoints
 * @returns {string[]} Indices utilisés
 */
function extractHintsUsed(checkpointsDetail) {
  if (!checkpointsDetail || !Array.isArray(checkpointsDetail)) return [];
  
  const hints = [];
  
  for (const cp of checkpointsDetail) {
    if (cp.hintUsed && cp.indice) {
      hints.push(cp.indice);
    }
    if (cp.hintsRequested > 0 && cp.hints) {
      hints.push(...cp.hints.slice(0, cp.hintsRequested));
    }
  }
  
  return hints;
}

/**
 * Enregistre dans exercise_history avec données enrichies
 * @param {Object} options - Options d'enregistrement
 * @param {string} options.userId - ID utilisateur
 * @param {string} options.exerciseId - ID exercice
 * @param {number} options.score - Score (0-10)
 * @param {boolean} options.success - Réussi ou non
 * @param {string[]} options.competencesTested - Compétences testées
 * @param {string[]} options.competencesValidated - Compétences validées
 * @param {Array} options.errors - Erreurs détectées
 * @param {string} options.feedback - Feedback textuel
 * @param {Array} options.checkpointsDetail - Détails des checkpoints (nouveau)
 * @param {Object} options.formulasSubmitted - Formules soumises (nouveau)
 * @param {number} options.attemptDuration - Durée en ms (nouveau)
 * @param {string} options.exerciseGeneratedAt - Date génération exercice (nouveau)
 */
async function saveToHistory(options) {
  const {
    userId,
    exerciseId,
    score,
    success,
    competencesTested = [],
    competencesValidated = [],
    errors = [],
    feedback = '',
    checkpointsDetail = null,
    formulasSubmitted = null,
    attemptDuration = null,
    exerciseGeneratedAt = null
  } = options;
  
  // Guard: vérifier que Supabase est configuré
  if (!supabaseAdmin) {
    logger.warn('HISTORY', 'Supabase non configuré, skip enregistrement');
    return null;
  }
  
  try {
    // Extraire les types d'erreurs
    const errorTypes = extractErrorTypes(errors);
    
    // Extraire les indices utilisés
    const hintsUsed = extractHintsUsed(checkpointsDetail);
    
    // Préparer les données enrichies
    const insertData = {
      user_id: userId,
      exercise_id: exerciseId,
      score: score,
      passed: success, // Renommé pour cohérence avec migration
      competences_tested: competencesTested,
      competences_validated: competencesValidated,
      errors_detected: errors,
      feedback_text: feedback,
      completed_at: new Date().toISOString(),
      
      // Nouvelles colonnes enrichies
      checkpoints_detail: checkpointsDetail,
      hints_used: hintsUsed.length > 0 ? hintsUsed : null,
      attempt_duration: attemptDuration,
      formulas_submitted: formulasSubmitted,
      error_types: errorTypes.length > 0 ? errorTypes : null,
      exercise_generated_at: exerciseGeneratedAt,
      validator_version: VALIDATOR_VERSION
    };
    
    // Nettoyer les valeurs null pour éviter des erreurs avec colonnes non nullables
    Object.keys(insertData).forEach(key => {
      if (insertData[key] === undefined) {
        delete insertData[key];
      }
    });
    
    const { data, error } = await supabaseAdmin
      .from('exercise_history')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      logger.error('HISTORY', 'Erreur enregistrement', { error: error.message });
      return null;
    }
    
    logger.debug('HISTORY', 'Exercice enregistré', { 
      id: data.id,
      errorTypes: errorTypes.length,
      hintsUsed: hintsUsed.length,
      hasCheckpoints: !!checkpointsDetail
    });
    
    return data;
    
  } catch (error) {
    logger.error('HISTORY', 'Exception', { error: error.message });
    return null;
  }
}