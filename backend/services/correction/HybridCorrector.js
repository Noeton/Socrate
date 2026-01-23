import ExcelPreAnalyzer from './ExcelPreAnalyzer.js';
// ValidationChecker: validation runtime des cellules Excel (utilisé pour feuille _socrate)
// CheckpointValidator: validation des checkpoints depuis JSON (utilisé par route API)
import ValidationChecker from './ValidationChecker.js';
import FeedbackBuilder from './FeedbackBuilder.js';
import AttemptTracker from '../learning/AttemptTracker.js';
import logger from '@/lib/logger';

/**
 * CORRECTEUR HYBRIDE INTELLIGENT
 * 
 * Orchestration :
 * 1. Pré-analyse locale (0 tokens)
 * 2. Décision intelligente (skip Claude si erreurs critiques)
 * 3. Analyse Claude optimisée (50% moins de tokens)
 */

class HybridCorrector {
  /**
   * Lit les checkpoints depuis la feuille _socrate
   */
  static readSocrateSheet(workbook) {
    try {
      const socrateSheet = workbook.getWorksheet('_socrate');
      
      if (!socrateSheet) {
        logger.warn('HYBRID-CORRECTOR', 'Aucune feuille _socrate trouvée');
        return null;
      }

      logger.debug('HYBRID-CORRECTOR', 'Lecture feuille _socrate');

      const metadata = {};
      const checkpoints = [];

      // Lire metadata (lignes 3-7)
      metadata.version = socrateSheet.getCell('B3').value;
      metadata.exerciseId = socrateSheet.getCell('B4').value;
      metadata.niveau = socrateSheet.getCell('B5').value;
      metadata.nbLignesDonnees = socrateSheet.getCell('B6').value;
      metadata.totalPoints = socrateSheet.getCell('B7').value;

      // Lire checkpoints (à partir de ligne 10)
      let row = 11;
      while (true) {
        const cellule = socrateSheet.getCell(row, 1).value;
        if (!cellule) break;

        const checkpoint = {
          cellule: cellule,
          type: socrateSheet.getCell(row, 2).value,
          description: socrateSheet.getCell(row, 3).value || '',
          fonction: socrateSheet.getCell(row, 4).value || null,
          pattern: socrateSheet.getCell(row, 5).value || null,
          recopie_jusqua: socrateSheet.getCell(row, 6).value || null,
          points: socrateSheet.getCell(row, 7).value || 0,
          indices: [
            socrateSheet.getCell(row, 8).value || '',
            socrateSheet.getCell(row, 9).value || '',
            socrateSheet.getCell(row, 10).value || ''
          ]
        };

        // Convertir pattern string → array
        if (checkpoint.pattern && typeof checkpoint.pattern === 'string') {
          checkpoint.pattern = checkpoint.pattern.split('||');
        }

        checkpoints.push(checkpoint);
        row++;
      }

      logger.info('HYBRID-CORRECTOR', 'Checkpoints lus', { count: checkpoints.length });
      return { metadata, checkpoints };

    } catch (error) {
      logger.error('HYBRID-CORRECTOR', 'Erreur lecture _socrate', { error: error.message });
      return null;
    }
  }
  /**
   * Valide tous les checkpoints
   */
  static async validateCheckpoints(worksheet, checkpoints) {
    const results = {
      score: 0,
      maxScore: 0,
      passed: [],
      failed: [],
      feedback: []
    };

    if (!checkpoints || checkpoints.length === 0) {
      logger.warn('HYBRID-CORRECTOR', 'Aucun checkpoint à valider');
      return results;
    }

    logger.debug('HYBRID-CORRECTOR', 'Validation checkpoints', { count: checkpoints.length });

    for (const checkpoint of checkpoints) {
      results.maxScore += checkpoint.points;

      let cell;
      try {
        cell = worksheet.getCell(checkpoint.cellule);
      } catch (error) {
        logger.warn('HYBRID-CORRECTOR', 'Cellule inaccessible', { cellule: checkpoint.cellule, error: error.message });
        results.failed.push({
          checkpoint,
          result: {
            success: false,
            score: 0,
            maxScore: checkpoint.points,
            feedback: [`❌ Cellule ${checkpoint.cellule} introuvable`]
          },
          indices: checkpoint.indices
        });
        continue;
      }
      
      let validationResult;

      if (checkpoint.type === 'formule') {
        validationResult = ValidationChecker.validateFormulaCheckpoint(
          cell, 
          checkpoint, 
          worksheet
        );
      } else if (checkpoint.type === 'validation') {
        validationResult = ValidationChecker.validateDataValidationCheckpoint(
          cell, 
          checkpoint, 
          worksheet
        );
      } else {
        logger.warn('HYBRID-CORRECTOR', 'Type checkpoint inconnu', { type: checkpoint.type });
        continue;
      }

      results.score += validationResult.score;
      
      if (validationResult.success) {
        results.passed.push({
          checkpoint,
          result: validationResult
        });
      } else {
        results.failed.push({
          checkpoint,
          result: validationResult,
          indices: checkpoint.indices
        });
      }

      results.feedback.push(...validationResult.feedback);
    }

    results.scorePercent = results.maxScore > 0 
      ? Math.round((results.score / results.maxScore) * 100) 
      : 0;

      logger.info('HYBRID-CORRECTOR', 'Score checkpoints', { score: results.scorePercent, passed: results.passed.length, total: checkpoints.length });

    return results;
  }

  /**
   * Correction complète d'un exercice Excel
   * @param {Object} worksheet - Feuille ExcelJS
   * @param {Object} exercise - Exercice attendu (null si fichier random)
   * @param {Object} userFormulas - Formules extraites
   * @param {Object} userValues - Valeurs extraites
   * @returns {Object} Rapport de correction complet
   */
  static async correct({ worksheet, exercise, userFormulas, userValues = null, workbook, userId = 'unknown', exerciseId = 'unknown' }) {

    
    logger.info('HYBRID-CORRECTOR', 'Démarrage correction hybride');

    // PHASE 1 : Pré-analyse locale
    const preAnalysis = ExcelPreAnalyzer.analyze(worksheet, exercise);

    // PHASE 2 : Décision - Skip Claude ?
    if (preAnalysis.shouldSkipClaude) {
      logger.info('HYBRID-CORRECTOR', 'Claude skippé', { reason: preAnalysis.skipReason });
      
      return {
        success: false,
        score: Math.round(preAnalysis.preliminaryScore / 10), // Conversion sur 10
        masteryLevel: preAnalysis.preliminaryScore,
        feedback: preAnalysis.skipReason,
        errors: preAnalysis.criticalErrors.map(e => ({
          cellule: e.cell,
          type: 'erreur_critique',
          gravite: 'critique',
          description: `Erreur ${e.type} détectée`,
          correction_suggeree: this.getErrorFix(e.type)
        })),
        competencesValidated: [],
        competencesTested: exercise?.competences || [],
        skippedClaude: true,
        preAnalysisScore: preAnalysis.preliminaryScore
      };
    }
    // PHASE 2.2 : Lire checkpoints depuis _socrate
const socrateData = this.readSocrateSheet(workbook);

if (socrateData && socrateData.checkpoints && socrateData.checkpoints.length > 0) {
  
  logger.debug('HYBRID-CORRECTOR', 'Checkpoints détectés, validation locale');
  // PHASE 2.1 : Récupération historique tentatives
  const attemptNumber = await AttemptTracker.getAttemptCount(userId, exerciseId) + 1;
  const previousHints = await AttemptTracker.getUsedHints(userId, exerciseId);
  logger.info('HYBRID-CORRECTOR', 'Tentative', { attemptNumber, previousHintsCount: Object.keys(previousHints).length });

  // PHASE 2.3 : Validation locale des checkpoints
  const checkpointResults = await this.validateCheckpoints(
    worksheet,
    socrateData.checkpoints
  );

  // Score excellent (≥ 90%) → Skip Claude
  if (checkpointResults.scorePercent >= 90) {
    logger.info('HYBRID-CORRECTOR', 'Excellent score, Claude skippé');
    return {
      success: true,
      score: 10,
      masteryLevel: checkpointResults.scorePercent,
      feedback: `🎉 Excellent ! ${checkpointResults.passed.length}/${socrateData.checkpoints.length} checkpoints réussis.`,
      errors: [],
      competencesValidated: exercise?.competences || [],
      competencesTested: exercise?.competences || [],
      checkpointsPassed: checkpointResults.passed.length,
      checkpointsTotal: socrateData.checkpoints.length,
      skippedClaude: true,
      checkpointScore: checkpointResults.scorePercent,
      attemptNumber: attemptNumber,
      totalHintsUsed: Object.keys(previousHints).length
    };
  }
  
  logger.debug('HYBRID-CORRECTOR', 'Score < 90%, génération feedback socratique');
      // Construire feedback socratique (pas besoin de Claude)
      const socraticFeedback = FeedbackBuilder.buildSocraticFeedback(
        checkpointResults,
        attemptNumber,
        previousHints
      );
  
      // Calcul adjusted_score
      const scoreData = FeedbackBuilder.calculateAdjustedScore(checkpointResults, previousHints);
  
      // Enregistrer tentative
      await AttemptTracker.saveAttempt(userId, exerciseId, {
        attemptNumber: attemptNumber,
        checkpointResults: {
          passed: checkpointResults.passed.length,
          failed: checkpointResults.failed.length,
          scorePercent: checkpointResults.scorePercent
        },
        hintsRequested: FeedbackBuilder.selectHintsToShow(checkpointResults.failed, attemptNumber, previousHints),
        rawScore: scoreData.raw_score,
        adjustedScore: scoreData.adjusted_score
      });
  
      // Retour immédiat avec feedback socratique
      return {
        success: scoreData.adjusted_score >= 70,
        score: Math.round(scoreData.adjusted_score / 10),
        masteryLevel: scoreData.adjusted_score,
        feedback: socraticFeedback.globalMessage,
        detailedFeedback: socraticFeedback,
        errors: checkpointResults.failed.map(f => ({
          cellule: f.checkpoint.cellule,
          type: 'checkpoint_echoue',
          gravite: 'importante',
          description: f.result.feedback?.[0] || 'Erreur détectée',
          hint_available: true,
          hint_level: previousHints[f.checkpoint.cellule] ? previousHints[f.checkpoint.cellule] + 1 : 1
        })),
        competencesValidated: scoreData.adjusted_score >= 90 ? (exercise?.competences || []) : [],
        competencesTested: exercise?.competences || [],
        checkpointsPassed: checkpointResults.passed.length,
        checkpointsTotal: checkpointResults.passed.length + checkpointResults.failed.length,
        skippedClaude: true,
        checkpointScore: checkpointResults.scorePercent,
        attemptNumber: attemptNumber,
        totalHintsUsed: Object.keys(previousHints).length + Object.keys(FeedbackBuilder.selectHintsToShow(checkpointResults.failed, attemptNumber, previousHints)).length
      };
  
}


    // PHASE 3 : Analyse Claude optimisée
    logger.info('HYBRID-CORRECTOR', 'Appel Claude avec contexte optimisé');
    
    const claudeAnalysis = await this.analyzeWithClaudeOptimized(
      exercise,
      preAnalysis,
      userFormulas
    );

    // PHASE 4 : Fusion des résultats
    const finalScore = this.mergeScores(preAnalysis.preliminaryScore, claudeAnalysis.score_adjustment);
    const masteryLevel = this.calculateMasteryLevel(finalScore, claudeAnalysis);

    logger.info('HYBRID-CORRECTOR', 'Correction terminée', { finalScore });

    return {
      success: finalScore >= 70,
      score: Math.round(finalScore / 10), // Score sur 10
      masteryLevel: finalScore,
      feedback: claudeAnalysis.feedback,
      errors: [
        ...preAnalysis.criticalErrors.map(e => ({
          cellule: e.cell,
          type: 'erreur_excel',
          gravite: 'critique',
          description: `Erreur ${e.type}`,
          correction_suggeree: this.getErrorFix(e.type)
        })),
        ...claudeAnalysis.logic_errors || [],
        ...claudeAnalysis.interpretation_errors?.map(desc => ({
          type: 'interpretation',
          gravite: 'importante',
          description: desc
        })) || []
      ],
      competencesValidated: claudeAnalysis.competences_validated || [],
      competencesTested: exercise?.competences || preAnalysis.detectedFunctions,
      preAnalysisScore: preAnalysis.preliminaryScore,
      claudeAdjustment: claudeAnalysis.score_adjustment
    };
  }

  /**
   * Analyse avec Claude - VERSION OPTIMISÉE (50% moins de tokens)
   */
  static async analyzeWithClaudeOptimized(exercise, preAnalysis, userFormulas) {
    try {
      // Extraire uniquement les formules clés
      const keyFormulas = ExcelPreAnalyzer.extractKeyFormulas(preAnalysis.allFormulas, exercise);
      
      // Construire prompt minimal
      const prompt = this.buildOptimizedPrompt(exercise, preAnalysis, keyFormulas);

      logger.debug('CLAUDE', 'Envoi formules clés', { sent: keyFormulas.length, total: preAnalysis.formulaCount });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500, // Réduit de 2048
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }],
          system: `Tu es un correcteur Excel expert et bienveillant. Tu analyses la LOGIQUE des formules, pas juste la syntaxe. Sois encourageant mais précis.`
        })
      });

      const data = await response.json();
      
      if (!data.content || !data.content[0]) {
        throw new Error('Réponse Claude vide');
      }

      const aiResponse = data.content[0].text;
      const jsonText = aiResponse.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(jsonText);

      logger.info('CLAUDE', 'Analyse terminée', { scoreAdjustment: analysis.score_adjustment });

      return analysis;

    } catch (error) {
      logger.error('CLAUDE', 'Erreur analyse', { error: error.message });
      
      // Fallback : pas d'ajustement
      return {
        logic_errors: [],
        interpretation_errors: [],
        score_adjustment: 0,
        feedback: 'Analyse automatique indisponible. Vérifie manuellement tes formules.',
        competences_validated: []
      };
    }
  }

  /**
   * Construit un prompt optimisé pour Claude (contexte minimal)
   */
  static buildOptimizedPrompt(exercise, preAnalysis, keyFormulas) {
    let prompt = '';

    if (exercise) {
      // CAS 1 : Exercice Socrate
      prompt = `EXERCICE : ${exercise.titre}

OBJECTIFS :
${exercise.objectifs?.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

COMPÉTENCES ATTENDUES : ${exercise.competences?.join(', ')}

PRÉ-ANALYSE (détection automatique) :
- ${preAnalysis.formulaCount} formules détectées
- Fonctions utilisées : ${preAnalysis.detectedFunctions.join(', ')}
- Fonctions manquantes : ${preAnalysis.missingFunctions.length > 0 ? preAnalysis.missingFunctions.join(', ') : 'aucune'}
- Erreurs Excel : ${preAnalysis.criticalErrors.length}

FORMULES CLÉS SOUMISES (${keyFormulas.length} sur ${preAnalysis.formulaCount}) :
${keyFormulas.map(f => `${f.cell}: ${f.formula}`).join('\n')}

MISSION :
1. Les formules sont-elles LOGIQUEMENT correctes pour atteindre les objectifs ?
2. Y a-t-il des erreurs SUBTILES (mauvaise plage, référence incorrecte, logique fausse) ?
3. L'élève a-t-il bien INTERPRÉTÉ les consignes ?

RÉPONSE JSON UNIQUEMENT :
{
  "logic_errors": [
    {
      "cellule": "E37",
      "probleme": "La formule calcule la moyenne de E2:E10 mais il y a 40 produits (devrait être E2:E41)",
      "correction_suggeree": "=MOYENNE(E2:E41)"
    }
  ],
  "interpretation_errors": [
    "L'exercice demande le prix TTC mais tu calcules seulement la TVA"
  ],
  "score_adjustment": -15,
  "feedback": "Tes formules sont syntaxiquement correctes mais certaines plages sont incomplètes. Vérifie bien le nombre de lignes de données.",
  "competences_validated": ["SOMME", "MOYENNE"]
}`;

    } else {
      // CAS 2 : Fichier random
      prompt = `ANALYSE D'UN FICHIER EXCEL (pas d'exercice prédéfini)

STRUCTURE DÉTECTÉE :
- ${preAnalysis.formulaCount} formules
- Fonctions utilisées : ${preAnalysis.detectedFunctions.join(', ')}

FORMULES PRINCIPALES :
${keyFormulas.map(f => `${f.cell}: ${f.formula}`).join('\n')}

MISSION :
1. Infère l'OBJECTIF probable du fichier
2. Évalue la COHÉRENCE logique
3. Détecte les erreurs ou incohérences
4. Suggère des AMÉLIORATIONS

RÉPONSE JSON UNIQUEMENT :
{
  "objectif_infere": "Calcul de salaires bruts/nets",
  "logic_errors": [],
  "interpretation_errors": [],
  "score_adjustment": 0,
  "feedback": "Le fichier est cohérent. Suggestion : ajouter des vérifications avec SIERREUR.",
  "competences_validated": ${JSON.stringify(preAnalysis.detectedFunctions)}
}`;
    }

    return prompt;
  }

  /**
   * Fusionne le score préliminaire + ajustement Claude
   */
  static mergeScores(preliminaryScore, claudeAdjustment) {
    const adjusted = preliminaryScore + (claudeAdjustment || 0);
    return Math.max(0, Math.min(100, adjusted));
  }

  /**
   * Calcule mastery level final
   */
  static calculateMasteryLevel(finalScore, claudeAnalysis) {
    let mastery = finalScore;

    // Bonus si compétences validées
    if (claudeAnalysis.competences_validated) {
      const validationBonus = claudeAnalysis.competences_validated.length * 2;
      mastery += validationBonus;
    }

    // Malus si erreurs d'interprétation
    if (claudeAnalysis.interpretation_errors && claudeAnalysis.interpretation_errors.length > 0) {
      mastery -= claudeAnalysis.interpretation_errors.length * 5;
    }

    return Math.max(0, Math.min(100, Math.round(mastery)));
  }

  /**
   * Suggestion de correction pour erreurs Excel courantes
   */
  static getErrorFix(errorType) {
    const fixes = {
      '#DIV/0!': 'Utilise =SIERREUR(ta_formule; 0) ou vérifie que le diviseur n\'est pas vide',
      '#REF!': 'Une cellule référencée a été supprimée. Recrée la formule avec les bonnes références',
      '#NAME?': 'Vérifie l\'orthographe de ta fonction (SOMME, MOYENNE, SI...)',
      '#VALUE!': 'Tu essaies de calculer avec du texte. Vérifie le type de données',
      '#N/A': 'Valeur non trouvée (RECHERCHEV). Utilise =SIERREUR(RECHERCHEV(...); "Non trouvé")',
      '#NULL!': 'Erreur d\'intersection. Vérifie les espaces dans ta formule (utilise : au lieu d\'espace)',
      '#NUM!': 'Valeur numérique invalide (ex: racine carrée d\'un nombre négatif)'
    };

    return fixes[errorType] || 'Corrige cette erreur avant de continuer';
  }
}

export default HybridCorrector;