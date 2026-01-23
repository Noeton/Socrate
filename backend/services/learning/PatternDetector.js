import { supabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';

class PatternDetector {
  /**
   * Track une erreur utilisateur en BDD
   */
  async trackError(userId, errorData) {
    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      logger.warn('PATTERN', 'Supabase non configuré, skip tracking');
      return null;
    }
    
    try {
      const { type, cell, formula, context, competenceId, exerciseId } = errorData;
      
      // Check si pattern existe déjà
      const { data: existing } = await supabaseAdmin
        .from('user_error_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('error_type', type)
        .eq('resolved', false)
        .single();

      if (existing) {
        // Incrémenter occurrence
        await supabaseAdmin
          .from('user_error_patterns')
          .update({
            occurrence_count: existing.occurrence_count + 1,
            last_occurrence: new Date().toISOString(),
            context_data: {
              ...existing.context_data,
              latest: { cell, formula, context }
            }
          })
          .eq('id', existing.id);
        
        logger.info('PATTERN', `Erreur récurrente détectée: ${type}`, { count: existing.occurrence_count + 1 });
        return { recurring: true, count: existing.occurrence_count + 1 };
      } else {
        // Créer nouveau pattern
        await supabaseAdmin
          .from('user_error_patterns')
          .insert({
            user_id: userId,
            error_type: type,
            competence_id: competenceId || null,
            exercise_id: exerciseId || null,
            occurrence_count: 1,
            context_data: { cell, formula, context }
          });
        
        logger.info('PATTERN', `Nouvelle erreur trackée: ${type}`);
        return { recurring: false, count: 1 };
      }
    } catch (error) {
      logger.error('PATTERN', 'Erreur tracking', { error: error.message });
      return null;
    }
  }

  /**
   * Récupère les patterns récurrents d'un user
   */
  async getRecurringPatterns(userId, minOccurrences = 2) {
    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      logger.warn('PATTERN', 'Supabase non configuré');
      return [];
    }
    
    try {
      const { data, error } = await supabaseAdmin
        .from('user_error_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('resolved', false)
        .gte('occurrence_count', minOccurrences)
        .order('occurrence_count', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      logger.error('PATTERN', 'Erreur récupération', { error: error.message });
      return [];
    }
  }

  /**
   * Marquer un pattern comme résolu
   */
  async resolvePattern(userId, errorType) {
    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      logger.warn('PATTERN', 'Supabase non configuré');
      return;
    }
    
    try {
      await supabaseAdmin
        .from('user_error_patterns')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('error_type', errorType)
        .eq('resolved', false);
      
      logger.info('PATTERN', `Pattern résolu: ${errorType}`);
    } catch (error) {
      logger.error('PATTERN', 'Erreur résolution', { error: error.message });
    }
  }

  /**
   * Classifier type d'erreur
   */
  classifyErrorType(error) {
    const { error: errorCode, formula } = error;
    
    // Erreurs natives Excel
    if (errorCode === '#DIV/0!') return 'division_par_zero';
    if (errorCode === '#REF!') return 'reference_invalide';
    if (errorCode === '#NAME?') return 'nom_fonction_inconnu';
    if (errorCode === '#VALUE!') return 'type_donnees_incorrect';
    
    // Erreurs qualité formule
    if (formula && this.hasHardcodedValue(formula)) return 'formule_hardcodee';
    if (formula && this.isManualSum(formula)) return 'formule_non_optimale';
    if (formula && !this.hasAbsoluteReference(formula) && this.shouldHaveAbsolute(formula)) {
      return 'reference_absolue_oubliee';
    }
    
    return 'erreur_generale';
  }

  // Utils
  hasHardcodedValue(formula) {
    return /\d+\.?\d*/.test(formula);
  }

  isManualSum(formula) {
    return (formula.match(/\+/g) || []).length >= 3;
  }

  hasAbsoluteReference(formula) {
    return /\$[A-Z]+\$\d+/.test(formula);
  }

  shouldHaveAbsolute(formula) {
    // Heuristique : formules avec multiplication/division devraient souvent avoir références absolues
    return /[*/]/.test(formula);
  }
}

export default new PatternDetector();