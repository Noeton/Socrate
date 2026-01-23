import { NextResponse } from 'next/server';
import SocrateBrain from '@/backend/services/socrate/SocrateBrain';
import DynamicExerciseGenerator from '@/backend/services/exercises/DynamicExerciseGeneratorV2';
import AdaptiveEngine from '@/backend/services/socrate/AdaptiveEngine';

/**
 * API Route : Génération d'exercices dynamiques personnalisés
 * POST /api/generate-dynamic-exercise
 * 
 * Body: {
 *   userId: string,
 *   competence?: string,     // Si spécifié, force cette compétence
 *   type?: string,           // 'discovery' | 'consolidation' | 'remediation' | 'autonomy'
 *   forceNew?: boolean       // Si true, ignore les exercices en attente
 * }
 * 
 * Response: {
 *   exercise: Object,        // Exercice complet avec données
 *   learnerContext: string,  // Contexte pour Claude
 *   adaptivePath: Array      // Prochains exercices suggérés
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, competence, type, forceNew = false } = body;

    console.log('📥 [DYNAMIC-EXERCISE] Demande:', { userId, competence, type });

    // 1. Charger l'état pédagogique de l'apprenant
    const learnerState = await SocrateBrain.loadLearnerState(userId);

    // 2. Déterminer la compétence et le type si non spécifiés
    let targetCompetence = competence;
    let targetType = type;

    if (!targetCompetence || !targetType) {
      // Générer le parcours adapté
      const adaptivePath = await SocrateBrain.generateAdaptivePath(learnerState);
      
      if (adaptivePath.length > 0 && !forceNew) {
        // Prendre le premier exercice du parcours
        const nextExercise = adaptivePath[0];
        targetCompetence = targetCompetence || nextExercise.targetCompetences[0];
        targetType = targetType || nextExercise.type;
      } else {
        // Fallback: utiliser l'AdaptiveEngine existant
        const recommendation = await AdaptiveEngine.selectNextExercise({
          niveau: learnerState.profile.niveau || 'debutant',
          competences: learnerState.competences,
          progression: {
            streakReussites: learnerState.recentPerformance.trend === 'up' ? 3 : 0,
            exercicesReussis: Math.round(learnerState.metrics.validationRate * 10),
            exercicesEchoues: Math.round((1 - learnerState.metrics.validationRate) * 10),
            topicsVus: Object.keys(learnerState.competences)
          },
          comportement: {
            vitesseComprehension: learnerState.learningVelocity.avgTime < 300 ? 'rapide' : 'normale',
            modePrefere: 'learning'
          }
        });
        
        targetCompetence = targetCompetence || recommendation.competencesToWork[0] || 'SOMME';
        targetType = targetType || 'consolidation';
      }
    }

    console.log('🎯 [DYNAMIC-EXERCISE] Cible:', { targetCompetence, targetType });

    // 3. Générer l'exercice dynamique (choisit automatiquement Claude ou standard)
    const exercise = await DynamicExerciseGenerator.generateSmart({
      userId,
      competence: targetCompetence,
      type: targetType
    });

    // 4. Générer le contexte pour Claude
    const learnerContext = SocrateBrain.generateContextForClaude(learnerState);

    // 5. Générer le parcours adapté complet (pour affichage)
    const adaptivePath = await SocrateBrain.generateAdaptivePath(learnerState);

    // 6. Enregistrer la proposition d'exercice
    await recordExerciseProposal(userId, exercise, targetType, targetCompetence);

    console.log('✅ [DYNAMIC-EXERCISE] Exercice généré:', exercise.id);

    return NextResponse.json({
      success: true,
      exercise,
      learnerContext,
      adaptivePath,
      meta: {
        competence: targetCompetence,
        type: targetType,
        datasetSource: exercise.dataset_source,
        rowCount: exercise.donnees.rows.length,
        checkpointCount: exercise.checkpoints.length
      }
    });

  } catch (error) {
    console.error('❌ [DYNAMIC-EXERCISE] Erreur:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la génération' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET : Récupère le parcours adapté sans générer d'exercice
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId requis' },
        { status: 400 }
      );
    }

    // Charger l'état et générer le parcours
    const learnerState = await SocrateBrain.loadLearnerState(userId);
    const adaptivePath = await SocrateBrain.generateAdaptivePath(learnerState);
    const learnerContext = SocrateBrain.generateContextForClaude(learnerState);

    return NextResponse.json({
      success: true,
      learnerState: {
        niveau: learnerState.profile.niveau,
        metier: learnerState.profile.contexte_metier,
        competences: Object.keys(learnerState.competences).length,
        frictionPoints: learnerState.frictionPoints.length,
        recentPerformance: learnerState.recentPerformance
      },
      adaptivePath,
      learnerContext
    });

  } catch (error) {
    console.error('❌ [DYNAMIC-EXERCISE] Erreur GET:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Enregistre la proposition d'exercice dans Supabase
 */
async function recordExerciseProposal(userId, exercise, type, competence) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    // Guard: vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.warn('⚠️ [DYNAMIC-EXERCISE] Supabase non configuré, skip enregistrement');
      return;
    }
    
    await supabaseAdmin
      .from('exercise_proposals')
      .insert({
        user_id: userId,
        exercise_id: exercise.id,
        proposed_by: 'socrate_brain',
        recommendation_reason: `Type: ${type}, Compétence: ${competence}`,
        user_niveau: exercise.niveau,
        target_competences: exercise.competences,
        was_completed: false,
        proposed_at: new Date().toISOString()
      });

  } catch (error) {
    console.warn('⚠️ [DYNAMIC-EXERCISE] Erreur enregistrement proposal:', error.message);
    // Non bloquant
  }
}