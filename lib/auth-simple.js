import { supabaseAdmin } from './supabase';
import { randomUUID } from 'crypto';

export async function getOrCreateGuestUser() {
  const userId = randomUUID();
  console.log(`✅ [AUTH] User guest créé: ${userId.substring(0, 8)}...`);
  return { userId, isGuest: true };
}

export async function loginUser(email) {
  // Guard: vérifier que Supabase est configuré
  if (!supabaseAdmin) {
    console.warn('⚠️ [AUTH] Supabase non configuré, login impossible');
    return { success: false, error: 'Service non disponible' };
  }
  
  try {
    // Correction: destructuration { data, error }
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      // Correction: destructuration { data, error }
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert([{ 
          email: email,
          full_name: email.split('@')[0],
        }])
        .select()
        .single();

      if (createError) throw createError;
      return { success: true, user: newUser };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}
