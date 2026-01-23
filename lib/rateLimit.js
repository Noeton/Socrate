/**
 * RATE LIMITER
 * Limite le nombre de requêtes par utilisateur
 * 
 * Utilise @vercel/kv si disponible, sinon fallback mémoire
 */

import logger from '@/lib/logger';

// Fallback en mémoire si KV non disponible
const memoryStore = new Map();

// Configuration par route
const RATE_LIMITS = {
  '/api/correct-exercise': { limit: 10, windowSeconds: 60 },   // 10 corrections/minute
  '/api/chat': { limit: 30, windowSeconds: 60 },               // 30 messages/minute
  '/api/generate-exercise': { limit: 5, windowSeconds: 60 },   // 5 générations/minute
  '/api/generate-exercise-file': { limit: 10, windowSeconds: 60 },
  'default': { limit: 60, windowSeconds: 60 }                  // 60 req/minute par défaut
};

/**
 * Vérifie si l'utilisateur a dépassé sa limite
 * @param {string} userId - ID utilisateur
 * @param {string} route - Route API (ex: '/api/correct-exercise')
 * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
 */
export async function checkRateLimit(userId, route = 'default') {
  const config = RATE_LIMITS[route] || RATE_LIMITS.default;
  const key = `rate:${route}:${userId}`;
  
  try {
    // Essayer d'utiliser Vercel KV
    const { kv } = await import('@vercel/kv');
    return await checkWithKV(kv, key, config);
  } catch (error) {
    // Fallback mémoire si KV non disponible
    logger.debug('RATE-LIMIT', 'KV non disponible, utilisation mémoire');
    return checkWithMemory(key, config);
  }
}

/**
 * Rate limiting avec Vercel KV
 */
async function checkWithKV(kv, key, config) {
  const now = Date.now();
  const windowStart = now - (config.windowSeconds * 1000);
  
  // Utiliser un sorted set pour tracker les requêtes
  // Score = timestamp, permet de supprimer les anciennes
  
  // Nettoyer les anciennes entrées
  await kv.zremrangebyscore(key, 0, windowStart);
  
  // Compter les requêtes dans la fenêtre
  const count = await kv.zcard(key);
  
  if (count >= config.limit) {
    // Trouver quand la fenêtre se réinitialise
    const oldestEntry = await kv.zrange(key, 0, 0, { withScores: true });
    const resetIn = oldestEntry.length > 0 
      ? Math.ceil((oldestEntry[0].score + config.windowSeconds * 1000 - now) / 1000)
      : config.windowSeconds;
    
    logger.warn('RATE-LIMIT', `Limite atteinte pour ${key}`, { count, limit: config.limit });
    
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      limit: config.limit
    };
  }
  
  // Ajouter cette requête
  await kv.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  await kv.expire(key, config.windowSeconds + 10); // TTL avec marge
  
  return {
    allowed: true,
    remaining: config.limit - count - 1,
    resetIn: config.windowSeconds,
    limit: config.limit
  };
}

/**
 * Rate limiting avec stockage mémoire (fallback)
 */
function checkWithMemory(key, config) {
  const now = Date.now();
  const windowStart = now - (config.windowSeconds * 1000);
  
  // Récupérer ou créer l'entrée
  if (!memoryStore.has(key)) {
    memoryStore.set(key, []);
  }
  
  const requests = memoryStore.get(key);
  
  // Nettoyer les anciennes requêtes
  const validRequests = requests.filter(ts => ts > windowStart);
  memoryStore.set(key, validRequests);
  
  if (validRequests.length >= config.limit) {
    const resetIn = Math.ceil((validRequests[0] + config.windowSeconds * 1000 - now) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      limit: config.limit
    };
  }
  
  // Ajouter cette requête
  validRequests.push(now);
  
  return {
    allowed: true,
    remaining: config.limit - validRequests.length,
    resetIn: config.windowSeconds,
    limit: config.limit
  };
}

/**
 * Middleware pour les routes API
 * @param {string} route - Route à protéger
 * @returns {Function} Middleware
 */
export function rateLimitMiddleware(route) {
  return async (request) => {
    // Extraire userId du body, query, ou header
    let userId = request.headers.get('x-user-id');
    
    if (!userId) {
      // Essayer de récupérer depuis le body pour POST
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        userId = body.userId;
      } catch {
        // Ignorer si pas de body JSON
      }
    }
    
    // Fallback sur IP si pas de userId
    if (!userId) {
      userId = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous';
    }
    
    const result = await checkRateLimit(userId, route);
    
    return {
      ...result,
      userId
    };
  };
}

/**
 * Headers de rate limit pour la réponse
 */
export function getRateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetIn.toString()
  };
}

/**
 * Réponse 429 Too Many Requests
 */
export function rateLimitExceededResponse(result) {
  return new Response(
    JSON.stringify({
      error: 'Trop de requêtes',
      message: `Limite de ${result.limit} requêtes par minute atteinte. Réessayez dans ${result.resetIn} secondes.`,
      retryAfter: result.resetIn
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.resetIn.toString(),
        ...getRateLimitHeaders(result)
      }
    }
  );
}

export default {
  checkRateLimit,
  rateLimitMiddleware,
  getRateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS
};