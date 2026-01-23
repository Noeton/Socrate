import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserProfile, saveUserProfile } from '@/shared/utils/userProfilesStore';
import { getLessonById } from '@/shared/data/learningPath';
import { findCompetenceById } from '@/shared/data/competencesExcel';

/**
 * GET: Récupérer la progression Learn d'un utilisateur
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [LEARN-PROGRESS] Supabase non configuré');
      return NextResponse.json({
        progress: {
          user_id: userId,
          completed_lessons: [],
          total_xp: 0,
          streak: 0,
          last_activity: null
        }
      });
    }

    // Essayer de récupérer depuis Supabase
    const { data, error } = await supabase
      .from('learn_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [LEARN-PROGRESS] Erreur Supabase:', error);
    }

    // Si pas de données Supabase, essayer localStorage côté client
    // (sera géré côté frontend)
    
    return NextResponse.json({
      progress: data || {
        user_id: userId,
        completed_lessons: [],
        total_xp: 0,
        streak: 0,
        last_activity: null
      }
    });

  } catch (error) {
    console.error('❌ [LEARN-PROGRESS] Erreur GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST: Sauvegarder la progression et synchroniser avec userProfile
 */
export async function POST(request) {
  try {
    const { userId, lessonId, xpEarned, completed } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [LEARN-PROGRESS] Supabase non configuré, skip sauvegarde');
      return NextResponse.json({
        success: true,
        progress: {
          completed_lessons: [],
          total_xp: xpEarned || 0,
          streak: 1,
          last_activity: new Date().toISOString()
        },
        warning: 'Données non persistées (Supabase non configuré)'
      });
    }

    // 1. Récupérer la progression actuelle
    const { data: currentProgress } = await supabase
      .from('learn_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    const progress = currentProgress || {
      user_id: userId,
      completed_lessons: [],
      total_xp: 0,
      streak: 0
    };

    // 2. Mettre à jour si leçon complétée
    if (completed && lessonId && !progress.completed_lessons.includes(lessonId)) {
      progress.completed_lessons.push(lessonId);
      progress.total_xp += xpEarned || 0;
      
      // Vérifier/màj streak
      const today = new Date().toDateString();
      const lastActivity = progress.last_activity ? new Date(progress.last_activity).toDateString() : null;
      
      if (lastActivity !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActivity === yesterday.toDateString()) {
          progress.streak += 1;
        } else if (lastActivity !== today) {
          progress.streak = 1;
        }
      }
      
      progress.last_activity = new Date().toISOString();
    }

    // 3. Sauvegarder dans Supabase
    const { error: upsertError } = await supabase
      .from('learn_progress')
      .upsert({
        user_id: userId,
        completed_lessons: progress.completed_lessons,
        total_xp: progress.total_xp,
        streak: progress.streak,
        last_activity: progress.last_activity,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('❌ [LEARN-PROGRESS] Erreur upsert:', upsertError);
      // Continuer quand même pour la synchro userProfile
    }

    // 4. SYNCHRONISER avec userProfile.competences (mode Ask)
    if (completed && lessonId) {
      try {
        const lesson = getLessonById(lessonId);
        if (lesson && lesson.competenceId) {
          const competence = findCompetenceById(lesson.competenceId);
          if (competence) {
            const userProfile = await getUserProfile(userId);
            
            // Marquer la compétence comme acquise
            userProfile.updateCompetence(competence.nom, {
              score: 0.7, // Score intermédiaire pour leçon complétée
              lastPracticed: new Date().toISOString(),
              source: 'learn_mode'
            });
            
            await saveUserProfile(userId, userProfile);
            console.log(`✅ [LEARN-PROGRESS] Compétence ${competence.nom} synchronisée`);
          }
        }
      } catch (syncError) {
        console.error('⚠️ [LEARN-PROGRESS] Erreur sync compétences:', syncError);
        // Ne pas bloquer la réponse
      }
    }

    return NextResponse.json({
      success: true,
      progress: {
        completed_lessons: progress.completed_lessons,
        total_xp: progress.total_xp,
        streak: progress.streak,
        last_activity: progress.last_activity
      }
    });

  } catch (error) {
    console.error('❌ [LEARN-PROGRESS] Erreur POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE: Réinitialiser la progression (pour tests)
 */
export async function DELETE(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [LEARN-PROGRESS] Supabase non configuré');
      return NextResponse.json({ success: true, warning: 'Supabase non configuré' });
    }

    await supabase
      .from('learn_progress')
      .delete()
      .eq('user_id', userId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [LEARN-PROGRESS] Erreur DELETE:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}