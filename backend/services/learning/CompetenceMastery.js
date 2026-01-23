import { getSupabaseAdmin } from '@/lib/config';
import logger from '@/lib/logger';

const supabase = getSupabaseAdmin();

/**
 * MODULE COMPETENCE MASTERY
 * Gère le tracking et la validation des compétences Excel
 */
class CompetenceMastery {
  
  /**
   * Met à jour la maîtrise d'une compétence après un exercice
   * @param {string} userId - ID utilisateur
   * @param {Array<string>} competences - Liste compétences de l'exercice
   * @param {number} adjustedScore - Score pondéré (0-100)
   * @param {number} hintsUsed - Nombre total d'indices utilisés
   * @returns {Promise<void>}
   */
  static async updateMastery(userId, competences, adjustedScore, hintsUsed) {
    if (!competences || competences.length === 0) {
      logger.warn('COMPETENCE-MASTERY', 'Aucune compétence à mettre à jour');
      return;
    }

    for (const competenceId of competences) {
      try {
        // Récupérer record existant
        const { data: existing, error: fetchError } = await supabase
          .from('competence_mastery')
          .select('*')
          .eq('user_id', userId)
          .eq('competence_id', competenceId)
          .single();

        let newMasteryLevel = 0;
        let exercisesCompleted = 1;
        let exercisesWithoutHints = hintsUsed === 0 ? 1 : 0;

        if (!fetchError || fetchError.code === 'PGRST116') {  // OK ou no row (normal)
          const currentLevel = existing?.mastery_level || 0;
          let delta = 0;
        
          if (adjustedScore >= 90 && hintsUsed === 0) {
            delta = 15;
          } else if (adjustedScore >= 80 && hintsUsed <= 1) {
            delta = 10; // Bonne performance avec peu d'aide
          } else if (adjustedScore < 70) {
            delta = -5; // Échec, régression
          } else {
            delta = 5; // Performance moyenne
          }

          newMasteryLevel = Math.max(0, Math.min(100, currentLevel + delta));
          exercisesCompleted = (existing.exercises_completed || 0) + 1;
          exercisesWithoutHints = (existing.exercises_without_hints || 0) + (hintsUsed === 0 ? 1 : 0);
        } else {
          // Nouveau record : initialiser
          if (adjustedScore >= 90 && hintsUsed === 0) {
            newMasteryLevel = 20;
          } else if (adjustedScore >= 70) {
            newMasteryLevel = 15;
          } else {
            newMasteryLevel = 5;
          }
        }

        // Vérifier validation
        const validatedAt = (newMasteryLevel >= 85 && exercisesWithoutHints >= 2)
          ? new Date().toISOString()
          : existing?.validated_at || null;

        // Upsert
        const { error: upsertError } = await supabase
          .from('competence_mastery')
          .upsert({
            user_id: userId,
            competence_id: competenceId,
            mastery_level: newMasteryLevel,
            exercises_completed: exercisesCompleted,
            exercises_without_hints: exercisesWithoutHints,
            last_score: adjustedScore,
            validated_at: validatedAt,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,competence_id'
          });

        if (upsertError) {
          logger.error('COMPETENCE-MASTERY', `Erreur update ${competenceId}`, { error: upsertError.message });
        } else {
          logger.info('COMPETENCE-MASTERY', `${competenceId}: ${newMasteryLevel}/100`, { exercisesCompleted });
          if (validatedAt && !existing?.validated_at) {
            logger.info('COMPETENCE-MASTERY', `Compétence ${competenceId} VALIDÉE !`);
          }
        }
      } catch (error) {
        logger.error('COMPETENCE-MASTERY', `Exception update ${competenceId}`, { error: error.message });
      }
    }
  }

  /**
   * Vérifie si une compétence est validée
   * @param {string} userId - ID utilisateur
   * @param {string} competenceId - ID compétence
   * @returns {Promise<boolean>}
   */
  static async isCompetenceValidated(userId, competenceId) {
    try {
      const { data, error } = await supabase
        .from('competence_mastery')
        .select('validated_at')
        .eq('user_id', userId)
        .eq('competence_id', competenceId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.validated_at !== null;
    } catch (error) {
      logger.error('COMPETENCE-MASTERY', 'Exception isValidated', { error: error.message });
      return false;
    }
  }

  /**
   * Retourne les compétences faibles à travailler
   * @param {string} userId - ID utilisateur
   * @returns {Promise<Array>} Compétences avec mastery < 50
   */
  static async getWeakCompetences(userId) {
    try {
      const { data, error } = await supabase
        .from('competence_mastery')
        .select('*')
        .eq('user_id', userId)
        .lt('mastery_level', 50)
        .order('mastery_level', { ascending: true });

      if (error) {
        logger.error('COMPETENCE-MASTERY', 'Erreur getWeak', { error: error.message });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('COMPETENCE-MASTERY', 'Exception getWeak', { error: error.message });
      return [];
    }
  }
}

export default CompetenceMastery;