import { getUserProfile } from '@/shared/utils/userProfilesStore';
import { supabase } from '@/lib/supabase';

// GET : Récupérer le profil utilisateur
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId requis' }, { status: 400 });
    }

    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [API] Supabase non configuré');
      return Response.json({ 
        profile: {
          user_id: userId,
          name: null,
          niveau: 'debutant',
          score_granulaire: 0,
          total_exercises_completed: 0
        }
      });
    }

    // Récupérer depuis Supabase
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, c'est OK pour un nouvel utilisateur
      console.error('❌ [API] Erreur Supabase:', error);
      return Response.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return Response.json({ 
      profile: profile || {
        user_id: userId,
        name: null,
        niveau: 'debutant',
        score_granulaire: 0,
        total_exercises_completed: 0
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur user-profile GET:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST : Récupérer profil + badges
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return Response.json({ error: 'userId requis' }, { status: 400 });
    }

    const userProfile = await getUserProfile(userId);
    
    // TODO: Implémenter le système de badges plus tard
    const badges = [];

    return Response.json({ 
      profile: userProfile.getProfile(),
      badges: badges
    });

  } catch (error) {
    console.error('❌ [API] Erreur user-profile POST:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}