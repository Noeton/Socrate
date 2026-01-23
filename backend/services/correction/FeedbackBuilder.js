/**
 * MODULE FEEDBACK BUILDER
 * Construit feedback socratique structuré avec indices progressifs
 */
class FeedbackBuilder {
  
    /**
     * Construit le feedback Mastermind (checkpoint par checkpoint)
     * @param {Object} checkpointResults - Résultats validation {passed: [], failed: []}
     * @param {number} attemptNumber - Numéro de tentative (1, 2, 3...)
     * @param {Object} previousHints - Indices déjà vus {cellule: hint_level}
     * @returns {Object} Feedback structuré
     */
    static buildSocraticFeedback(checkpointResults, attemptNumber, previousHints) {
      const { passed, failed, scorePercent } = checkpointResults;
      
      // Message global
      const totalCheckpoints = passed.length + failed.length;
      const globalMessage = scorePercent >= 90 
        ? `🎉 Excellent ! Tu as validé ${passed.length}/${totalCheckpoints} checkpoints.`
        : `Tu as validé ${passed.length}/${totalCheckpoints} checkpoints. Continue !`;
  
      // Construction détails par checkpoint
      const checkpointsFeedback = [];
      
      // Checkpoints réussis
      for (const passedItem of passed) {
        checkpointsFeedback.push({
          cellule: passedItem.checkpoint.cellule,
          status: 'success',
          points: `${passedItem.result.score}/${passedItem.checkpoint.points}`,
          message: '✅ Parfait !',
          description: passedItem.checkpoint.description
        });
      }
      
      // Checkpoints échoués avec indices
      for (const failedItem of failed) {
        const cellule = failedItem.checkpoint.cellule;
        const previousHintLevel = previousHints[cellule] || 0;
        const nextHintLevel = Math.min(previousHintLevel + 1, 3);
        
        // Sélectionner l'indice selon niveau et tentative
        const indices = failedItem.checkpoint.indices || [];
        const hintText = nextHintLevel > indices.length
          ? 'Consulte la feuille Instructions pour la formule complète.'
          : indices[nextHintLevel - 1];
        
        checkpointsFeedback.push({
          cellule: cellule,
          status: 'failed',
          points: `${failedItem.result.score}/${failedItem.checkpoint.points}`,
          message: failedItem.result.feedback?.[0] || '❌ Formule incorrecte',
          description: failedItem.checkpoint.description,
          hint_available: true,
          hint_level: nextHintLevel,
          hint_text: hintText
        });
      }
  
      // Calculer score ajusté
      const { raw_score, adjusted_score, penalty } = this.calculateAdjustedScore(
        checkpointResults, 
        previousHints
      );
  
      return {
        feedbackType: 'socratic',
        globalMessage: globalMessage,
        scoreBreakdown: {
          raw_score: raw_score,
          max_score: 100,
          adjusted_score: adjusted_score,
          hints_penalty: penalty
        },
        checkpoints: checkpointsFeedback,
        nextSteps: scorePercent >= 90 
          ? 'Exercice réussi ! Passe au suivant.'
          : 'Corrige les checkpoints échoués et re-soumets ton fichier.'
      };
    }
  
    /**
     * Calcule le score ajusté selon les indices utilisés
     * @param {Object} checkpointResults - Résultats validation
     * @param {Object} hintsUsed - Indices utilisés {cellule: hint_level}
     * @returns {Object} {raw_score, adjusted_score, penalty}
     */
    static calculateAdjustedScore(checkpointResults, hintsUsed) {
      const { passed, failed, maxScore } = checkpointResults;
      
      let totalAdjusted = 0;
      let totalRaw = 0;
      
      // Facteurs de pondération
      const HINT_FACTORS = {
        0: 1.00,  // Aucun indice
        1: 0.90,  // Indice 1
        2: 0.75,  // Indice 2
        3: 0.50   // Indice 3
      };
  
      // Checkpoints réussis
      for (const passedItem of passed) {
        const cellule = passedItem.checkpoint.cellule;
        const pointsEarned = passedItem.result.score;
        const hintLevel = hintsUsed[cellule] || 0;
        const factor = HINT_FACTORS[hintLevel] || 1.0;
        
        totalRaw += pointsEarned;
        totalAdjusted += pointsEarned * factor;
      }
  
      // Normaliser sur 100
      const rawScore = maxScore > 0 ? Math.round((totalRaw / maxScore) * 100) : 0;
      const adjustedScore = maxScore > 0 ? Math.round((totalAdjusted / maxScore) * 100) : 0;
      const penalty = rawScore - adjustedScore;
  
      return {
        raw_score: rawScore,
        adjusted_score: adjustedScore,
        penalty: penalty
      };
    }
  
    /**
 * Sélectionne les indices à afficher selon tentative (niveau 1 → 2 → 3)
 * @param {Array} failedCheckpoints - Checkpoints échoués
 * @param {number} attemptNumber - Numéro de tentative
 * @param {Object} previousHints - Indices déjà vus {cellule: hint_level}
 * @returns {Object} {cellule: hint_level_to_show}
 */
static selectHintsToShow(failedCheckpoints, attemptNumber, previousHints) {
    const hintsToShow = {};
  
    for (const failedItem of failedCheckpoints) {
      const cellule = failedItem.checkpoint.cellule;
      const previousLevel = previousHints[cellule] || 0;
  
      // Logique progression indices :
      // Tentative 1 : niveau 1
      // Tentative 2 : niveau 2
      // Tentative 3+ : niveau 3 (max)
      let nextLevel = attemptNumber;
      
      // Ne jamais descendre en dessous du niveau précédent
      nextLevel = Math.max(nextLevel, previousLevel + 1);
      nextLevel = Math.min(nextLevel, 3); // Max 3 indices par checkpoint
  
      hintsToShow[cellule] = nextLevel;
    }
  
    return hintsToShow;
  }
  
  }
  
  export default FeedbackBuilder;
  