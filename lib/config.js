/**
 * CONFIGURATION CENTRALISÉE
 * Gestion centralisée des variables d'environnement et clients externes
 */
import { createClient } from '@supabase/supabase-js';

// Client Supabase singleton (réutilisable)
let supabaseAdminInstance = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      // Retourner null pendant le build au lieu de throw
      console.warn('Configuration Supabase incomplète - skip pendant le build');
      return null;
    }
    
    supabaseAdminInstance = createClient(url, key);
  }
  return supabaseAdminInstance;
}

// Configuration Anthropic
export function getAnthropicConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Retourner null pendant le build au lieu de throw
    console.warn('ANTHROPIC_API_KEY non configurée - skip pendant le build');
    return null;
  }
  return {
    apiKey,
    apiVersion: '2023-06-01',
    defaultModel: 'claude-sonnet-4-20250514',
    defaultMaxTokens: 2048,
    defaultTemperature: 0.3,
  };
}

// Configuration générale
export const config = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};
