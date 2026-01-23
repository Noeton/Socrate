import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/config';
import logger from '@/lib/logger';
import { sanitizeString } from '@/lib/validators';

const supabase = getSupabaseAdmin();

/**
 * GET /api/streak?userId=xxx
 * Récupère le streak actuel de l'utilisateur
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = sanitizeString(searchParams.get('userId'));

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      logger.warn('STREAK', 'Supabase non configuré');
      return NextResponse.json({
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        streak_freeze_available: 1,
        is_active_today: false,
        warning: 'Supabase non configuré'
      });
    }

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('STREAK', 'Erreur GET', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si pas de streak existant, retourner valeurs par défaut
    if (!data) {
      return NextResponse.json({
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        streak_freeze_available: 1,
        is_active_today: false
      });
    }

    // Vérifier si actif aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const isActiveToday = data.last_activity_date === today;

    return NextResponse.json({
      ...data,
      is_active_today: isActiveToday
    });

  } catch (error) {
    logger.error('STREAK', 'Erreur GET', { error: error.message });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/streak
 * Met à jour le streak (appelé à chaque activité)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const userId = sanitizeString(body.userId);

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      logger.warn('STREAK', 'Supabase non configuré');
      return NextResponse.json({
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: new Date().toISOString().split('T')[0],
        is_active_today: true,
        warning: 'Supabase non configuré - données non persistées'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Récupérer le streak actuel
    const { data: existingStreak, error: fetchError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('STREAK', 'Erreur fetch', { error: fetchError.message });
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let newStreak = 1;
    let longestStreak = 1;

    if (existingStreak) {
      const lastDate = existingStreak.last_activity_date;

      // Si déjà actif aujourd'hui, ne rien faire
      if (lastDate === today) {
        return NextResponse.json({
          ...existingStreak,
          is_active_today: true,
          message: 'Déjà actif aujourd\'hui'
        });
      }

      // Si actif hier, incrémenter le streak
      if (lastDate === yesterday) {
        newStreak = existingStreak.current_streak + 1;
      } else {
        // Streak cassé
        newStreak = 1;
      }

      longestStreak = Math.max(newStreak, existingStreak.longest_streak);
    }

    // Upsert
    const { data: updatedStreak, error: upsertError }= await supabase
      .from('user_streaks')
      .upsert({
        user_id: userId,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        streak_freeze_available: existingStreak?.streak_freeze_available ?? 1
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (upsertError) {
      logger.error('STREAK', 'Erreur upsert', { error: upsertError.message });
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    logger.info('STREAK', 'Mis à jour', { userId: userId.substring(0, 8), streak: newStreak });

    return NextResponse.json({
      ...updatedStreak,
      is_active_today: true,
      was_incremented: existingStreak?.last_activity_date === yesterday
    });

  } catch (error) {
    logger.error('STREAK', 'Erreur POST', { error: error.message });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PUT /api/streak (Use Streak Freeze)
 * Utilise un freeze pour sauver le streak
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const userId = sanitizeString(body.userId);

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      logger.warn('STREAK', 'Supabase non configuré');
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const { data: streak, error: fetchError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Streak introuvable' }, { status: 404 });
    }

    if (streak.streak_freeze_available <= 0) {
      return NextResponse.json({ error: 'Aucun freeze disponible' }, { status: 400 });
    }

    // Utiliser le freeze (étendre last_activity_date à aujourd'hui)
    const today = new Date().toISOString().split('T')[0];

    const { data: updated, error: updateError } = await supabase
      .from('user_streaks')
      .update({
        last_activity_date: today,
        streak_freeze_available: streak.streak_freeze_available - 1
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      logger.error('STREAK', 'Erreur freeze', { error: updateError.message });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    logger.info('STREAK', 'Freeze utilisé', { userId: userId.substring(0, 8) });

    return NextResponse.json({
      ...updated,
      message: 'Streak sauvé avec un freeze !'
    });

  } catch (error) {
    logger.error('STREAK', 'Erreur PUT', { error: error.message });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}