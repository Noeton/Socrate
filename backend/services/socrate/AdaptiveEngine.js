import logger from '@/lib/logger';
import PatternDetector from '../learning/PatternDetector';

class AdaptiveEngine {
  /**
   * Sélectionne le prochain exercice optimal pour un utilisateur
   * @param {Object} userProfile - Profil complet de l'utilisateur
   * @returns {Object} - { exerciseType, difficulty, topics, reasoning }
   */
  async selectNextExercise(userProfile) {
    const { niveau, competences, progression, comportement } = userProfile;
    
    // 1. Analyser les compétences maîtrisées vs à travailler
    const competencesToWork = this.identifyWeakCompetences(competences);
    
    // 2. Récupérer les patterns d'erreurs
    const userId = userProfile.userId || userProfile.sessionId || null;
    const patterns = userId ? await PatternDetector.getRecurringPatterns(userId) : [];
    
    // 3. Calculer difficulté optimale (Flow Theory: défi légèrement > compétence)
    const optimalDifficulty = this.calculateOptimalDifficulty(
      niveau,
      progression,
      comportement
    );
    
    // 4. Sélectionner topics selon contexte
    const topics = this.selectTopics(
      competencesToWork,
      patterns,
      progression.topicsVus
    );
    
    console.log('🎯 [ADAPTIVE] Exercice sélectionné:', {
      niveau,
      difficulty: optimalDifficulty,
      topics,
      competencesToWork: competencesToWork.slice(0, 3)
    });
    
    return {
      exerciseType: this.mapDifficultyToType(optimalDifficulty),
      difficulty: optimalDifficulty,
      topics,
      competencesToWork,
      reasoning: this.explainSelection(optimalDifficulty, topics, patterns)
    };
  }
  
  /**
   * Identifie les compétences les moins maîtrisées
   */
  identifyWeakCompetences(competences) {
    if (!competences || Object.keys(competences).length === 0) {
      return ['SOMME', 'MOYENNE', 'MIN/MAX']; // Défaut débutant
    }
    
    // Trier par maîtrise croissante
    const sorted = Object.entries(competences)
      .map(([nom, data]) => ({
        nom,
        maitrise: data.maitrise || 0,
        derniereUtilisation: data.derniereUtilisation
      }))
      .sort((a, b) => a.maitrise - b.maitrise);
    
    // Retourner les 3 moins maîtrisées
    return sorted.slice(0, 3).map(c => c.nom);
  }
  
  /**
   * Calcule la difficulté optimale selon Flow Theory
   * Sweet spot: 110-120% du niveau actuel
   */
  calculateOptimalDifficulty(niveau, progression, comportement) {
    const baseLevel = {
      'debutant': 1,
      'intermediaire': 5,
      'avance': 8,
      'expert': 10
    }[niveau] || 1;
    
    // Ajustements selon comportement
    let adjustment = 0;
    
    // Vitesse compréhension
    if (comportement.vitesseComprehension === 'rapide') {
      adjustment += 1;
    } else if (comportement.vitesseComprehension === 'lente') {
      adjustment -= 1;
    }
    
    // Taux réussite récent
    if (progression.streakReussites >= 3) {
      adjustment += 0.5; // En confiance, on challenge
    } else if (progression.exercicesEchoues > progression.exercicesReussis) {
      adjustment -= 0.5; // En difficulté, on ralentit
    }
    
    // Mode work = défis plus rapides
    if (comportement.modePrefere === 'work') {
      adjustment += 0.5;
    }
    
    const finalDifficulty = Math.max(1, Math.min(10, baseLevel + adjustment));
    
    return Math.round(finalDifficulty * 10) / 10; // Arrondi 1 décimale
  }
  
  /**
   * Sélectionne les topics à travailler
   */
  selectTopics(competencesToWork, patterns, topicsVus) {
    const topics = [];
    
    // 1. Compétences faibles prioritaires
    topics.push(...competencesToWork.slice(0, 2));
    
    // 2. Patterns récurrents (erreurs à corriger)
    if (patterns.length > 0) {
      const topPattern = patterns[0].error_type;
      topics.push(`correction_${topPattern}`);
    }
    
    // 3. Nouveau topic (si user progresse bien)
    const commonTopics = ['SOMME', 'MOYENNE', 'SI simple', 'RECHERCHEV', 'NB.SI'];
    const unseenTopics = commonTopics.filter(t => !topicsVus.includes(t));
    if (unseenTopics.length > 0) {
      topics.push(unseenTopics[0]);
    }
    
    return [...new Set(topics)].slice(0, 3); // Max 3 topics
  }
  
  /**
   * Map difficulté numérique vers type d'exercice
   */
  mapDifficultyToType(difficulty) {
    if (difficulty <= 3) return 'debutant';
    if (difficulty <= 6) return 'intermediaire';
    if (difficulty <= 9) return 'avance';
    return 'expert';
  }
  
  /**
   * Explique pourquoi cet exercice a été choisi
   */
  explainSelection(difficulty, topics, patterns) {
    let reason = `Exercice niveau ${difficulty}/10. `;
    
    if (topics.length > 0) {
      reason += `Focus sur : ${topics.join(', ')}. `;
    }
    
    if (patterns.length > 0) {
      reason += `Inclut correction de tes erreurs fréquentes. `;
    }
    
    return reason;
  }
  
  /**
   * Décide si intervention immédiate nécessaire
   * @param {Array} errors - Erreurs détectées
   * @param {Object} userProfile - Profil utilisateur
   * @returns {Boolean} - true si intervention immédiate
   */
  shouldIntervenImmediately(errors, userProfile) {
    // Cas d'intervention immédiate
    
    // 1. Débutant bloqué (>2 erreurs critiques)
    if (userProfile.niveau === 'debutant') {
      const criticalErrors = errors.filter(e => e.severity === 'critical').length;
      if (criticalErrors >= 2) {
        console.log('🚨 [ADAPTIVE] Intervention immédiate: débutant bloqué');
        return true;
      }
    }
    
    // 2. Même erreur 3+ fois (pattern fort)
    const errorCounts = {};
    errors.forEach(e => {
      errorCounts[e.type] = (errorCounts[e.type] || 0) + 1;
    });
    
    if (Object.values(errorCounts).some(count => count >= 3)) {
      console.log('🚨 [ADAPTIVE] Intervention immédiate: pattern récurrent détecté');
      return true;
    }
    
    // 3. Utilisateur en mode "learning" et confus (beaucoup d'erreurs différentes)
    if (userProfile.comportement?.modePrefere === 'learning' && errors.length >= 5) {
      console.log('🚨 [ADAPTIVE] Intervention immédiate: confusion détectée');
      return true;
    }
    
    // Sinon, laisser finir l'exercice
    return false;
  }
  
  /**
   * Ajuste le ton du feedback selon la progression
   * @param {Object} userProfile - Profil utilisateur
   * @returns {String} - Ton recommandé ('encourageant', 'neutre', 'challengeant')
   */
  adjustFeedbackTone(userProfile) {
    const { progression, comportement } = userProfile;
    
    // Débutant toujours encourageant
    if (userProfile.niveau === 'debutant') {
      return 'encourageant';
    }
    
    // En difficulté → encourageant
    if (progression.exercicesEchoues > progression.exercicesReussis) {
      return 'encourageant';
    }
    
    // Streak réussites → challengeant
    if (progression.streakReussites >= 3) {
      return 'challengeant';
    }
    
    // Mode work → neutre/direct
    if (comportement.modePrefere === 'work') {
      return 'neutre';
    }
    
    // Défaut
    return 'neutre';
  }
  
  /**
   * Calcule le niveau de détail optimal du feedback
   * @param {Object} userProfile - Profil utilisateur
   * @returns {String} - 'minimal', 'moderate', 'detailed'
   */
  calculateFeedbackDetail(userProfile) {
    const { niveau, comportement } = userProfile;
    
    // Mode work → minimal
    if (comportement.modePrefere === 'work') {
      return 'minimal';
    }
    
    // Vitesse rapide → moderate
    if (comportement.vitesseComprehension === 'rapide') {
      return 'moderate';
    }
    
    // Débutant ou lent → detailed
    if (niveau === 'debutant' || comportement.vitesseComprehension === 'lente') {
      return 'detailed';
    }
    
    return 'moderate';
  }
}

export default new AdaptiveEngine();