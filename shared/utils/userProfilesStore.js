/**
 * STORE CENTRALISÉ DES PROFILS UTILISATEURS
 */

import UserProfile from './userProfile.js';

const userProfiles = new Map();

export function getUserProfile(sessionId) {
  if (!sessionId) {
    console.warn('⚠️ [STORE] getUserProfile appelé sans sessionId');
    return new UserProfile();
  }

  if (!userProfiles.has(sessionId)) {
    const profile = new UserProfile();
    userProfiles.set(sessionId, profile);
    console.log(`🆕 [STORE] Nouveau profil: ${sessionId.substring(0, 8)}...`);
    return profile;
  }

  return userProfiles.get(sessionId);
}

export function deleteUserProfile(sessionId) {
  if (!sessionId) {
    console.warn('⚠️ [STORE] deleteUserProfile appelé sans sessionId');
    return false;
  }

  const deleted = userProfiles.delete(sessionId);
  if (deleted) {
    console.log(`🗑️ [STORE] Profil supprimé: ${sessionId.substring(0, 8)}...`);
  }
  return deleted;
}

export default {
  getUserProfile,
  deleteUserProfile
};