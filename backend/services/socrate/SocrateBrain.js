import logger from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase.js';

/**
 * SOCRATE BRAIN - Cerveau central de Socrate
 * 
 * Responsabilités :
 * 1. Charger l'état pédagogique complet d'un utilisateur
 * 2. Générer un parcours adapté (prochains exercices)
 * 3. Mettre à jour l'état après chaque interaction
 */
class SocrateBrain {
  
  /**
   * Charge l'état pédagogique complet d'un utilisateur
   */
  async loadLearnerState(userId) {
    if (!userId) {
      console.warn('⚠️ [BRAIN] Pas de userId, état vide');
      return this.getEmptyState();
    }

    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.warn('⚠️ [BRAIN] Supabase non configuré, état vide');
      return this.getEmptyState();
    }

    try {
      const [
        profileResult,
        competencesResult,
        errorsResult,
        velocityResult,
        recentAttemptsResult,
        proposalsResult
      ] = await Promise.all([
        supabaseAdmin.from('user_profiles').select('*').eq('user_id', userId).single(),
        supabaseAdmin.from('user_competences').select('competence_id, maitrise, validated, nb_attempts, last_attempt_at').eq('user_id', userId),
        supabaseAdmin.from('user_error_patterns').select('error_type, competence_id, occurrence_count, context_data').eq('user_id', userId).eq('resolved', false).order('occurrence_count', { ascending: false }).limit(10),
        supabaseAdmin.from('user_learning_velocity').select('competence_id, avg_score, trend, mastery_level, avg_time_seconds').eq('user_id', userId),
        supabaseAdmin.from('exercise_attempts').select('exercise_id, checkpoint_results, hints_requested, adjusted_score, submitted_at').eq('user_id', userId).order('submitted_at', { ascending: false }).limit(10),
        supabaseAdmin.from('exercise_proposals').select('exercise_id, recommendation_reason, target_competences, proposed_at').eq('user_id', userId).eq('was_completed', false).order('proposed_at', { ascending: false }).limit(5)
      ]);

      const state = {
        userId,
        profile: profileResult.data || {},
        competences: this.formatCompetences(competencesResult.data || []),
        frictionPoints: this.extractFrictionPoints(errorsResult.data || []),
        learningVelocity: this.formatVelocity(velocityResult.data || []),
        recentPerformance: this.analyzeRecentPerformance(recentAttemptsResult.data || []),
        pendingExercises: proposalsResult.data || [],
        metrics: this.calculateMetrics(competencesResult.data || [], recentAttemptsResult.data || [], errorsResult.data || [])
      };

      console.log('🧠 [BRAIN] État chargé pour', userId, {
        niveau: state.profile.niveau,
        competencesCount: Object.keys(state.competences).length,
        frictionPointsCount: state.frictionPoints.length
      });

      return state;

    } catch (error) {
      console.error('❌ [BRAIN] Erreur chargement état:', error);
      return this.getEmptyState();
    }
  }

  /**
   * Génère le parcours adapté : les N prochains exercices recommandés
   */
  async generateAdaptivePath(learnerState, options = {}) {
    const { maxExercises = 5 } = options;
    const path = [];
    const { profile, competences, frictionPoints, recentPerformance, metrics } = learnerState;

    // 1. Si friction points non résolus → exercice ciblé
    if (frictionPoints.length > 0) {
      path.push({
        type: 'remediation',
        reason: `Corriger: ${frictionPoints[0].type}`,
        targetCompetences: [frictionPoints[0].competenceId],
        difficulty: 'easier',
        priority: 1
      });
    }

    // 2. Compétences en cours (pas encore validées)
    const inProgress = Object.entries(competences)
      .filter(([_, d]) => !d.validated && d.maitrise > 0 && d.maitrise < 80)
      .sort((a, b) => b[1].maitrise - a[1].maitrise);

    for (const [compId, data] of inProgress.slice(0, 2)) {
      path.push({
        type: 'consolidation',
        reason: `Consolider ${compId} (${data.maitrise}%)`,
        targetCompetences: [compId],
        difficulty: 'same',
        priority: 2
      });
    }

    // 3. Si bonne performance récente → nouvelle compétence
    if (recentPerformance.avgScore > 75 && recentPerformance.trend === 'up') {
      const next = this.suggestNextCompetence(competences, profile.niveau);
      if (next) {
        path.push({
          type: 'discovery',
          reason: `Découvrir ${next}`,
          targetCompetences: [next],
          difficulty: 'slightly_harder',
          priority: 3
        });
      }
    }

    // 4. Si dépendance aux indices élevée → exercice autonomie
    if (metrics.hintsDependency > 0.5) {
      path.push({
        type: 'autonomy',
        reason: 'Exercice autonomie',
        targetCompetences: this.getStrongestCompetences(competences, 2),
        difficulty: 'easier',
        priority: 2,
        config: { hintsDisabled: true }
      });
    }

    path.sort((a, b) => a.priority - b.priority);
    return path.slice(0, maxExercises);
  }

  /**
   * Génère le contexte pour Claude (injection dans le prompt)
   */
  generateContextForClaude(learnerState) {
    const { profile, competences, frictionPoints, recentPerformance, metrics } = learnerState;

    const mastered = Object.entries(competences).filter(([_, d]) => d.validated).map(([id]) => id);
    const inProgress = Object.entries(competences).filter(([_, d]) => !d.validated && d.maitrise > 0).map(([id, d]) => `${id} (${d.maitrise}%)`);
    const frictions = frictionPoints.slice(0, 3).map(f => `${f.type} (${f.count}x)`);

    return `
## ÉTAT PÉDAGOGIQUE

**Profil :** Niveau ${profile.niveau || 'non défini'}, Métier ${profile.contexte_metier || 'non défini'}
**Compétences maîtrisées :** ${mastered.length > 0 ? mastered.join(', ') : 'Aucune'}
**En cours :** ${inProgress.length > 0 ? inProgress.join(', ') : 'Aucune'}
**Points de friction :** ${frictions.length > 0 ? frictions.join(', ') : 'Aucun'}
**Performance :** Score ${recentPerformance.avgScore}%, Tendance ${recentPerformance.trend}
**Recommandation :** ${this.generateRecommendation(learnerState)}
`.trim();
  }

  /**
   * Met à jour l'état après une tentative d'exercice
   */
  async updateAfterAttempt(userId, attemptData) {
    const { exerciseId, checkpointResults, hintsUsed, score, errorsDetected } = attemptData;

    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.warn('⚠️ [BRAIN] Supabase non configuré, skip updateAfterAttempt');
      return;
    }

    try {
      const attemptNumber = await this.getNextAttemptNumber(userId, exerciseId);
      
      await supabaseAdmin.from('exercise_attempts').insert({
        user_id: userId,
        exercise_id: exerciseId,
        attempt_number: attemptNumber,
        checkpoint_results: checkpointResults,
        hints_requested: { count: hintsUsed, details: [] },
        raw_score: score,
        adjusted_score: this.calculateAdjustedScore(score, hintsUsed),
        submitted_at: new Date().toISOString()
      });

      for (const error of errorsDetected || []) {
        await this.updateErrorPattern(userId, error);
      }

      await this.updateGlobalStats(userId, score);
      console.log('✅ [BRAIN] État mis à jour');

    } catch (error) {
      console.error('❌ [BRAIN] Erreur update:', error);
    }
  }

  // === HELPERS ===

  formatCompetences(data) {
    const map = {};
    for (const c of data) {
      map[c.competence_id] = { 
        maitrise: c.maitrise || 0, 
        validated: c.validated || false, 
        attempts: c.nb_attempts || 0,
        lastAttempt: c.last_attempt_at
      };
    }
    return map;
  }

  extractFrictionPoints(errors) {
    return errors.map(e => ({ 
      type: e.error_type, 
      competenceId: e.competence_id, 
      count: e.occurrence_count,
      context: e.context_data
    }));
  }

  formatVelocity(data) {
    const map = {};
    for (const v of data) {
      map[v.competence_id] = { 
        avgScore: v.avg_score, 
        trend: v.trend, 
        masteryLevel: v.mastery_level,
        avgTime: v.avg_time_seconds
      };
    }
    return map;
  }

  analyzeRecentPerformance(attempts) {
    if (attempts.length === 0) {
      return { avgScore: 0, trend: 'none', hintsUsed: 0 };
    }
    
    const scores = attempts.map(a => a.adjusted_score || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    let trend = 'stable';
    if (scores.length >= 4) {
      const recent = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const older = scores.slice(3, 6).reduce((a, b) => a + b, 0) / Math.min(3, scores.length - 3);
      if (recent > older + 5) trend = 'up';
      else if (recent < older - 5) trend = 'down';
    }
    
    const hintsUsed = attempts.reduce((s, a) => s + (a.hints_requested?.count || 0), 0);
    
    return { avgScore, trend, hintsUsed };
  }

  calculateMetrics(competences, attempts, errors) {
    let hintsDependency = 0;
    if (attempts.length > 0) {
      hintsDependency = attempts.filter(a => (a.hints_requested?.count || 0) > 0).length / attempts.length;
    }
    
    const validated = competences.filter(c => c.validated).length;
    const validationRate = competences.length > 0 ? validated / competences.length : 0;
    
    return { 
      hintsDependency, 
      validationRate, 
      activeErrors: errors.filter(e => !e.resolved).length 
    };
  }

  suggestNextCompetence(competences, niveau) {
    const progressions = {
      debutant: ['SOMME', 'MOYENNE', 'MIN', 'MAX', 'SI', 'NB', 'NB.SI'],
      intermediaire: ['RECHERCHEV', 'INDEX', 'EQUIV', 'SI.CONDITIONS', 'SOMME.SI', 'NB.SI.ENS'],
      avance: ['RECHERCHEX', 'FILTRE', 'UNIQUE', 'TRIER', 'LET', 'LAMBDA']
    };
    const path = progressions[niveau] || progressions.debutant;
    
    for (const comp of path) {
      if (!competences[comp] || !competences[comp].validated) return comp;
    }
    return null;
  }

  getStrongestCompetences(competences, count) {
    return Object.entries(competences)
      .filter(([_, d]) => d.validated || d.maitrise > 60)
      .sort((a, b) => b[1].maitrise - a[1].maitrise)
      .slice(0, count)
      .map(([id]) => id);
  }

  generateRecommendation(state) {
    const { frictionPoints, recentPerformance, metrics } = state;
    
    if (frictionPoints.length > 0) return `Retravailler "${frictionPoints[0].type}"`;
    if (metrics.hintsDependency > 0.6) return `Exercice autonomie recommandé`;
    if (recentPerformance.trend === 'up') return `Excellente progression !`;
    if (recentPerformance.trend === 'down') return `Consolider les acquis`;
    return `Continuer la progression`;
  }

  async getNextAttemptNumber(userId, exerciseId) {
    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      return 1;
    }
    
    const { data } = await supabaseAdmin
      .from('exercise_attempts')
      .select('attempt_number')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('attempt_number', { ascending: false })
      .limit(1);
    return (data?.[0]?.attempt_number || 0) + 1;
  }

  calculateAdjustedScore(rawScore, hintsUsed) {
    return Math.max(0, rawScore - (hintsUsed * 5));
  }

  async updateErrorPattern(userId, error) {
    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.warn('⚠️ [BRAIN] Supabase non configuré, skip updateErrorPattern');
      return;
    }
    
    const { type, competenceId, context } = error;
    
    const { data: existing } = await supabaseAdmin
      .from('user_error_patterns')
      .select('id, occurrence_count')
      .eq('user_id', userId)
      .eq('error_type', type)
      .eq('resolved', false)
      .single();

    if (existing) {
      await supabaseAdmin.from('user_error_patterns').update({
        occurrence_count: existing.occurrence_count + 1,
        last_occurrence: new Date().toISOString(),
        context_data: context
      }).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('user_error_patterns').insert({
        user_id: userId,
        error_type: type,
        competence_id: competenceId,
        occurrence_count: 1,
        context_data: context
      });
    }
  }

  async updateGlobalStats(userId, score) {
    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.warn('⚠️ [BRAIN] Supabase non configuré, skip updateGlobalStats');
      return;
    }
    
    const success = score >= 70;
    
    // On utilise un update simple car raw() peut ne pas être supporté
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('total_exercises_attempted, total_exercises_completed')
      .eq('user_id', userId)
      .single();
    
    if (profile) {
      await supabaseAdmin.from('user_profiles').update({
        total_exercises_attempted: (profile.total_exercises_attempted || 0) + 1,
        total_exercises_completed: success 
          ? (profile.total_exercises_completed || 0) + 1 
          : profile.total_exercises_completed || 0,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
    }
  }

  getEmptyState() {
    return {
      userId: null,
      profile: {},
      competences: {},
      frictionPoints: [],
      learningVelocity: {},
      recentPerformance: { avgScore: 0, trend: 'none', hintsUsed: 0 },
      pendingExercises: [],
      metrics: { hintsDependency: 0, validationRate: 0, activeErrors: 0 }
    };
  }
}

export default new SocrateBrain();