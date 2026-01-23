import { getSupabaseAdmin } from '@/lib/config';
import ExerciseLibrary from '../exercises/ExerciseLibrary.js';
import logger from '@/lib/logger';

const supabase = getSupabaseAdmin();

/**
 * SPACED REPETITION - Singleton
 * Algorithme 2-3-5-7 jours (inspiré de la courbe d'Ebbinghaus)
 */
class SpacedRepetition {
  constructor() {
    if (SpacedRepetition.instance) {
      return SpacedRepetition.instance;
    }
    SpacedRepetition.instance = this;
  }

  /**
   * Calcule la prochaine date de révision selon le niveau de maîtrise
   * @param {Number} masteryLevel - Niveau de maîtrise 0-100
   * @param {Date} lastCompletedAt - Date de dernière complétion
   * @returns {Object} {nextReviewAt, intervalDays}
   */
  calculateNextReview(masteryLevel, lastCompletedAt = new Date()) {
    let intervalDays;
    
    // Algorithme 2-3-5-7
    // Algorithme 1-2-3-5-7
    if (masteryLevel < 30) {
      intervalDays = 1; // Échec → révision demain
    } else if (masteryLevel < 60) {
      intervalDays = 2; // Révision rapide si faible maîtrise
    } else if (masteryLevel < 80) {
      intervalDays = 3; // Révision moyenne
    } else if (masteryLevel < 95) {
      intervalDays = 5; // Révision espacée
    } else {
      intervalDays = 7; // Révision longue si excellente maîtrise
    }
    
    const nextReviewAt = new Date(lastCompletedAt);
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);
    
    logger.debug('SPACED-REP', `Maîtrise ${masteryLevel}% → Révision dans ${intervalDays} jours`);
    
    return {
      nextReviewAt,
      intervalDays
    };
  }

  /**
   * Planifie ou met à jour une révision
   * @param {String} userId - UUID utilisateur
   * @param {String} exerciseId - ID de l'exercice
   * @param {Number} masteryLevel - Niveau de maîtrise 0-100
   * @param {Date} completedAt - Date de complétion
   */
  async scheduleReview(userId, exerciseId, masteryLevel, completedAt = new Date(), originalExercise = null) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      logger.warn('SPACED-REP', 'Supabase non configuré, skip scheduleReview');
      return null;
    }
    
    try {
      const { nextReviewAt, intervalDays } = this.calculateNextReview(masteryLevel, completedAt);
      
      // Déterminer si on propose un exercice similaire
      let similarExerciseId = null;
      let preActivateHintLevel = 0;
      
      if (masteryLevel < 50 && originalExercise) {
        const similarExercise = this.findSimilarExercise(originalExercise);
        if (similarExercise && similarExercise.id !== originalExercise.id) {
          similarExerciseId = similarExercise.id;
          preActivateHintLevel = 1;
          logger.info('SPACED-REP', `Échec sévère → Propose exercice similaire: ${similarExerciseId}`);
        }
      } else if (masteryLevel < 70 && originalExercise) {
        preActivateHintLevel = 1;
        logger.info('SPACED-REP', 'Échec modéré → Même exercice avec indice 1 pré-activé');
      }
      
      // Upsert (insert ou update si existe déjà)
      const { data, error } = await supabase
        .from('exercise_schedule')
        .upsert({
          user_id: userId,
          exercise_id: exerciseId,
          last_completed_at: completedAt.toISOString(),
          next_review_at: nextReviewAt.toISOString(),
          review_interval_days: intervalDays,
          mastery_level: masteryLevel,
          similar_exercise_id: similarExerciseId,
          pre_activate_hint_level: preActivateHintLevel
        }, {
          onConflict: 'user_id,exercise_id'
        })
        .select()
        .single();
      
      if (error) {
        logger.error('SPACED-REP', 'Erreur schedule', { error: error.message });
        return null;
      }
      
      logger.info('SPACED-REP', `Révision planifiée: ${exerciseId}`, { nextReviewAt: nextReviewAt.toISOString() });
      return data;
      
    } catch (error) {
      logger.error('SPACED-REP', 'Erreur', { error: error.message });
      return null;
    }
  }

  /**
   * Récupère les exercices dus pour révision
   * @param {String} userId - UUID utilisateur
   * @param {Date} currentDate - Date actuelle (default: now)
   * @returns {Array} Liste des exercices à réviser
   */
  async getDueExercises(userId, currentDate = new Date()) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      logger.warn('SPACED-REP', 'Supabase non configuré');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('exercise_schedule')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_at', currentDate.toISOString())
        .order('next_review_at', { ascending: true });
      
      if (error) {
        logger.error('SPACED-REP', 'Erreur getDueExercises', { error: error.message });
        return [];
      }
      
      logger.debug('SPACED-REP', `${data?.length || 0} exercices dus pour révision`);
      return data || [];
      
    } catch (error) {
      logger.error('SPACED-REP', 'Erreur', { error: error.message });
      return [];
    }
  }

  /**
   * Récupère le prochain exercice à réviser (le plus urgent)
   * @param {String} userId - UUID utilisateur
   * @returns {Object|null} Exercice à réviser ou null
   */
  async getNextReviewExercise(userId) {
    try {
      const dueExercises = await this.getDueExercises(userId);
      
      if (dueExercises.length === 0) {
        logger.debug('SPACED-REP', 'Aucune révision due');
        return null;
      }
      
      // Le premier est le plus urgent (tri par next_review_at ASC)
      const nextReview = dueExercises[0];
      
      logger.info('SPACED-REP', `Révision urgente: ${nextReview.exercise_id}`, { masteryLevel: nextReview.mastery_level });
      return nextReview;
      
    } catch (error) {
      logger.error('SPACED-REP', 'Erreur', { error: error.message });
      return null;
    }
  }

  /**
   * Récupère le calendrier de révisions à venir
   * @param {String} userId - UUID utilisateur
   * @param {Number} daysAhead - Nombre de jours à venir (default: 7)
   * @returns {Array} Liste des révisions planifiées
   */
  async getReviewCalendar(userId, daysAhead = 7) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      logger.warn('SPACED-REP', 'Supabase non configuré');
      return [];
    }
    
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);
      
      const { data, error } = await supabase
        .from('exercise_schedule')
        .select('*')
        .eq('user_id', userId)
        .gte('next_review_at', new Date().toISOString())
        .lte('next_review_at', endDate.toISOString())
        .order('next_review_at', { ascending: true });
      
      if (error) {
        logger.error('SPACED-REP', 'Erreur getReviewCalendar', { error: error.message });
        return [];
      }
      
      logger.debug('SPACED-REP', `${data?.length || 0} révisions dans les ${daysAhead} prochains jours`);
      return data || [];
      
    } catch (error) {
      logger.error('SPACED-REP', 'Erreur', { error: error.message });
      return [];
    }
  }

  /**
   * Statistiques de révision pour un utilisateur
   * @param {String} userId - UUID utilisateur
   * @returns {Object} Stats
   */
  async getReviewStats(userId) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      logger.warn('SPACED-REP', 'Supabase non configuré');
      return {
        total_scheduled: 0,
        due_now: 0,
        upcoming_7days: 0,
        avg_mastery: 0,
        next_review_date: null
      };
    }
    
    try {
      const { data, error } = await supabase
        .from('user_review_summary')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // Pas encore de révisions planifiées
        if (error.code === 'PGRST116') {
          return {
            total_scheduled: 0,
            due_now: 0,
            upcoming_7days: 0,
            avg_mastery: 0,
            next_review_date: null
          };
        }
        logger.error('SPACED-REP', 'Erreur getReviewStats', { error: error.message });
        return null;
      }
      
      logger.debug('SPACED-REP', `Stats: ${data.due_now} dus, ${data.upcoming_7days} à venir`);
      return data;
      
    } catch (error) {
      logger.error('SPACED-REP', 'Erreur', { error: error.message });
      return null;
    }
  }

  /**
   * Supprime une révision planifiée
   * @param {String} userId - UUID utilisateur
   * @param {String} exerciseId - ID exercice
   */
  async removeSchedule(userId, exerciseId) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      logger.warn('SPACED-REP', 'Supabase non configuré');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('exercise_schedule')
        .delete()
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId);
      
      if (error) {
        logger.error('SPACED-REP', 'Erreur removeSchedule', { error: error.message });
        return false;
      }
      
      logger.info('SPACED-REP', `Révision supprimée: ${exerciseId}`);
      return true;
      
    } catch (error) {
      logger.error('SPACED-REP', 'Erreur', { error: error.message });
      return false;
    }
  }

  /**
   * Trouve un exercice similaire (même compétence principale, même niveau)
   * @param {Object} originalExercise - Exercice échoué
   * @returns {Object} Exercice similaire
   */
  findSimilarExercise(originalExercise) {
    const targetCompetence = originalExercise?.competences?.[0]; // Compétence principale
    const targetLevel = originalExercise?.niveau;

    if (!targetCompetence || !targetLevel) {
      logger.warn('SPACED-REP', 'Exercice incomplet (compétence/niveau manquant)');
      return originalExercise;
    }

    const candidates = ExerciseLibrary.exercises.filter(ex => {
      return (
        ex.competences &&
        ex.competences.includes(targetCompetence) &&
        ex.niveau === targetLevel &&
        ex.id !== originalExercise.id
      );
    });

    if (candidates.length === 0) {
      logger.debug('SPACED-REP', 'Aucun exercice similaire trouvé, fallback même exercice');
      return originalExercise;
    }

    // Sélection aléatoire pour varier
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const similar = candidates[randomIndex];

    logger.info('SPACED-REP', `Exercice similaire trouvé: ${similar.id}`, { competence: targetCompetence });
    return similar;
  }
}

// Export singleton instance
const spacedRepInstance = new SpacedRepetition();
export default spacedRepInstance;