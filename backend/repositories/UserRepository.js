import { supabase } from '@/lib/supabase';

export class UserRepository {
  async getProfile(userId) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [UserRepo] Supabase non configuré');
      return null;
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }
    return data;
  }

  async createProfile(userId, profileData) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [UserRepo] Supabase non configuré');
      return { user_id: userId, ...profileData };
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        niveau: profileData.niveau,
        contexte_metier: profileData.contexteMetier,
        objectif: profileData.objectif,
        score_granulaire: 0,
        xp_points: 0,
        streak_days: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(userId, updates) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [UserRepo] Supabase non configuré');
      return { user_id: userId, ...updates };
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOrCreateProfile(userId) {
    let profile = await this.getProfile(userId);
    
    if (!profile) {
      profile = await this.createProfile(userId, {
        niveau: null,
        contexteMetier: null,
        objectif: null,
      });
    }
    return profile;
  }

  async updateCompetence(userId, competenceName, maitrise) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [UserRepo] Supabase non configuré');
      return null;
    }
    
    // Récupérer l'ID de la compétence
    const { data: competence } = await supabase
      .from('competences')
      .select('id')
      .eq('nom', competenceName)
      .single();

    if (!competence) return null;

    // Upsert dans user_competences
    const { data, error } = await supabase
      .from('user_competences')
      .upsert({
        user_id: userId,
        competence_id: competence.id,
        maitrise: maitrise,
        validated: maitrise >= 80,
        last_attempt_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,competence_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserCompetences(userId) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [UserRepo] Supabase non configuré');
      return [];
    }
    
    const { data, error } = await supabase
      .from('user_competences')
      .select(`
        *,
        competence:competences(nom, categorie)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  async deleteProfile(userId) {
    // Guard: vérifier que Supabase est configuré
    if (!supabase) {
      console.warn('⚠️ [UserRepo] Supabase non configuré');
      return true;
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }
}