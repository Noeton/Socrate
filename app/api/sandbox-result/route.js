import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/config';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/sandbox-result
 * 
 * Enregistre le résultat d'un exercice sandbox interactif.
 * Ces données alimentent SocrateBrain pour personnaliser le parcours.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId,
      exerciseId,
      competence,
      competenceId,
      success,
      formula,
      expectedFormula,
      hintsUsed = 0,
      attempts = 1,
      skipped = false  // NOUVEAU : l'utilisateur a sauté la sandbox
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      logger.warn('SANDBOX-RESULT', 'Supabase non configuré, skip enregistrement');
      return NextResponse.json({
        success: true,
        score: 0,
        competenceMaitrise: 'skipped',
        warning: 'Données non enregistrées (Supabase non configuré)'
      });
    }

    logger.info('SANDBOX-RESULT', 'Enregistrement', {
      userId: userId.substring(0, 8),
      competence,
      success,
      skipped,
      hintsUsed
    });

    // 1. Enregistrer dans exercise_history
    // Score : skipped = 0, échec = 3, réussi = 6-10 selon indices
    const score = skipped ? 0 : (success ? (hintsUsed === 0 ? 10 : Math.max(6, 10 - hintsUsed)) : 3);
    
    const historyData = {
      user_id: userId,
      exercise_id: exerciseId,
      score: score,
      passed: success && !skipped,
      competences_tested: competence ? [competence] : [],
      competences_validated: (success && !skipped) ? (competence ? [competence] : []) : [],
      feedback_text: skipped 
        ? `Sandbox skippée - l'élève est allé directement sur Socrate`
        : (success 
            ? `Exercice sandbox réussi avec la formule ${formula}` 
            : `Exercice sandbox non complété`),
      hints_used: hintsUsed > 0 ? [`${hintsUsed} indices utilisés`] : null,
      formulas_submitted: formula ? { sandbox: formula } : null,
      validator_version: 'sandbox-1.0',
      completed_at: new Date().toISOString()
    };

    const { error: historyError } = await supabaseAdmin
      .from('exercise_history')
      .insert(historyData);

    if (historyError) {
      logger.warn('SANDBOX-RESULT', 'Erreur exercise_history', { error: historyError.message });
    }

    // 2. Mettre à jour user_competences si competenceId fourni
    if (competenceId) {
      // Récupérer l'état actuel
      const { data: existing } = await supabaseAdmin
        .from('user_competences')
        .select('maitrise, nb_attempts, validated')
        .eq('user_id', userId)
        .eq('competence_id', competenceId)
        .single();

      const currentMaitrise = existing?.maitrise || 0;
      const currentAttempts = existing?.nb_attempts || 0;
      
      // Calculer nouvelle maîtrise
      // Skipped = +5% (a vu le contenu), réussi = +15%, échoué = +5%
      const bonus = skipped ? 5 : (success ? 15 : 5);
      const newMaitrise = Math.min(100, currentMaitrise + bonus);
      const isValidated = newMaitrise >= 80 && success && !skipped;

      if (existing) {
        await supabaseAdmin
          .from('user_competences')
          .update({
            maitrise: newMaitrise,
            nb_attempts: currentAttempts + (skipped ? 0 : 1), // Skip ne compte pas comme tentative
            validated: existing.validated || isValidated,
            last_attempt_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('competence_id', competenceId);
      } else {
        await supabaseAdmin
          .from('user_competences')
          .insert({
            user_id: userId,
            competence_id: competenceId,
            maitrise: newMaitrise,
            nb_attempts: skipped ? 0 : 1,
            validated: isValidated,
            last_attempt_at: new Date().toISOString()
          });
      }

      logger.info('SANDBOX-RESULT', 'Compétence mise à jour', {
        competenceId,
        maitrise: `${currentMaitrise} → ${newMaitrise}`,
        skipped
      });
    }

    // 3. Enregistrer les erreurs si échec (pas si skipped)
    if (!success && !skipped && competenceId) {
      const errorType = formula 
        ? (formula.toUpperCase().includes(expectedFormula?.toUpperCase() || '') 
            ? 'syntaxe_incorrecte' 
            : 'fonction_incorrecte')
        : 'pas_de_formule';

      // Vérifier si ce type d'erreur existe déjà
      const { data: existingError } = await supabaseAdmin
        .from('user_error_patterns')
        .select('id, occurrence_count')
        .eq('user_id', userId)
        .eq('competence_id', competenceId)
        .eq('error_type', errorType)
        .single();

      if (existingError) {
        await supabaseAdmin
          .from('user_error_patterns')
          .update({
            occurrence_count: existingError.occurrence_count + 1,
            last_occurrence: new Date().toISOString()
          })
          .eq('id', existingError.id);
      } else {
        await supabaseAdmin
          .from('user_error_patterns')
          .insert({
            user_id: userId,
            competence_id: competenceId,
            error_type: errorType,
            occurrence_count: 1,
            context_data: { formula, expectedFormula, exerciseId },
            resolved: false
          });
      }
    }

    return NextResponse.json({
      success: true,
      score,
      competenceMaitrise: competenceId ? 'updated' : 'skipped'
    });

  } catch (error) {
    logger.error('SANDBOX-RESULT', 'Erreur', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
