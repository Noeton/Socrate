/**
 * STORE CENTRALISÉ DES PROFILS UTILISATEURS (Supabase)
 */
import UserProfile from './userProfile.js';
import { UserRepository } from '@/backend/repositories/UserRepository';
import { getOrCreateGuestUser } from '@/lib/auth-simple';

const userRepo = new UserRepository();

export async function getUserProfile(userId) {
  try {
    // Si pas d'userId fourni, en créer un nouveau
    if (!userId) {
      const auth = await getOrCreateGuestUser();
      if (!auth || !auth.userId) {
        console.warn('⚠️ [STORE] Impossible de créer session');
        return new UserProfile();
      }
      userId = auth.userId;
    }
    
    // Récupérer profil en BDD
    let dbProfile = await userRepo.getProfile(userId);
    
    if (!dbProfile) {
      dbProfile = await userRepo.createProfile(userId, {
        niveau: null,
        contexteMetier: null,
        objectif: null,
      });
      console.log(`🆕 [STORE] Nouveau profil: ${userId.substring(0, 8)}...`);
    }
    
    const userProfile = new UserProfile();
    
    if (dbProfile.niveau) {
      userProfile.setNiveau(dbProfile.niveau);
    }
    
    userProfile.contexteMetier = dbProfile.contexte_metier;
    userProfile.objectif = dbProfile.objectif;
    userProfile.scoreGranulaire = dbProfile.score_granulaire || 0;
    
    return userProfile;
    
  } catch (error) {
    console.error('❌ [STORE] Erreur:', error);
    return new UserProfile();
  }
}



export async function saveUserProfile(userId, userProfile) {
  if (!userId) return false;
  
  try {
    await userRepo.updateProfile(userId, {
      niveau: userProfile.niveau,
      contexte_metier: userProfile.contexteMetier,
      objectif: userProfile.objectif,
      score_granulaire: userProfile.scoreGranulaire,
      xp_points: userProfile.xp || 0,
      current_level: userProfile.niveau_actuel || 1,
      streak_days: userProfile.streakDays || 0,
    });
    
    return true;
  } catch (error) {
    console.error('❌ [STORE] Erreur sauvegarde:', error);
    return false;
  }
}


export async function deleteUserProfile(userId) {
  if (!userId) return false;
  
  try {
    await userRepo.deleteProfile(userId);
    console.log(`🗑️ [STORE] Profil supprimé: ${userId.substring(0, 8)}...`);
    return true;
  } catch (error) {
    console.error('❌ [STORE] Erreur suppression:', error);
    return false;
  }
}




export default {
  getUserProfile,
  saveUserProfile,
  deleteUserProfile
};