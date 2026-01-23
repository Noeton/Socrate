import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/config';
import logger from '@/lib/logger';
import { sanitizeString } from '@/lib/validators';
import { checkRateLimit, getRateLimitHeaders, rateLimitExceededResponse } from '@/lib/rateLimit';
import AnalyticsService from '@/backend/services/analytics/AnalyticsService';

const supabaseAdmin = getSupabaseAdmin();
const analyticsService = new AnalyticsService(supabaseAdmin);

/**
 * API Analytics - Récupération des statistiques utilisateur
 * 
 * GET /api/analytics
 * Query params:
 *   - userId: string (requis)
 *   - period: '7d' | '30d' | '90d' | 'all' (optionnel, défaut: '30d')
 *   - competenceId: number (optionnel, pour filtrer par compétence)
 *   - type: 'full' | 'summary' | 'competence' (optionnel, défaut: 'full')
 * 
 * Réponse:
 *   - 200: { success: true, data: {...}, meta: {...} }
 *   - 400: { error: string }
 *   - 429: Rate limit exceeded
 *   - 500: { error: string }
 */
export async function GET(request) {
  try {
    // Extraire les paramètres de requête
    const { searchParams } = new URL(request.url);
    const userId = sanitizeString(searchParams.get('userId'));
    const period = searchParams.get('period') || '30d';
    const competenceId = searchParams.get('competenceId') 
      ? parseInt(searchParams.get('competenceId')) 
      : null;
    const type = searchParams.get('type') || 'full';
    
    logger.info('ANALYTICS', 'Requête analytics', { 
      userId: userId?.substring(0, 8),
      period,
      competenceId,
      type
    });
    
    // Rate limiting (plus permissif pour les analytics - 30 req/min)
    const rateLimit = await checkRateLimit(
      userId || 'anonymous', 
      '/api/analytics',
      { maxRequests: 30, windowMs: 60000 }
    );
    
    if (!rateLimit.allowed) {
      logger.warn('ANALYTICS', 'Rate limit atteint', { userId });
      return rateLimitExceededResponse(rateLimit);
    }
    
    // Validation des inputs
    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }
    
    // Valider la période
    const validPeriods = ['7d', '30d', '90d', 'all'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Période invalide. Valeurs acceptées: ${validPeriods.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Valider le type
    const validTypes = ['full', 'summary', 'competence'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type invalide. Valeurs acceptées: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Récupérer les analytics selon le type demandé
    let data;
    const startTime = Date.now();
    
    switch (type) {
      case 'summary':
        // Mode rapide : résumé uniquement
        data = await analyticsService.getQuickSummary(userId, period);
        break;
        
      case 'competence':
        // Analytics pour une compétence spécifique
        if (!competenceId) {
          return NextResponse.json(
            { error: 'competenceId est requis pour type=competence' },
            { status: 400 }
          );
        }
        data = await analyticsService.getCompetenceAnalytics(userId, competenceId, period);
        break;
        
      default:
        // Mode complet (défaut)
        data = await analyticsService.getUserAnalytics(userId, period, competenceId);
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('ANALYTICS', 'Analytics générées', { 
      userId: userId.substring(0, 8),
      type,
      duration: `${duration}ms`,
      exercisesCount: data.summary?.total_exercises || 0
    });
    
    // Construire la réponse avec métadonnées
    return NextResponse.json({
      success: true,
      data: data,
      meta: {
        userId: userId,
        period: period,
        type: type,
        competenceId: competenceId,
        generatedAt: new Date().toISOString(),
        queryDuration: duration
      }
    }, {
      headers: getRateLimitHeaders(rateLimit)
    });
    
  } catch (error) {
    logger.error('ANALYTICS', 'Erreur récupération analytics', { error: error.message });
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des analytics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/invalidate
 * Invalide le cache analytics pour un utilisateur
 * (Utilisé après une soumission d'exercice pour forcer le rafraîchissement)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const userId = sanitizeString(body.userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }
    
    // Invalider le cache
    analyticsService.clearCache(userId);
    
    logger.info('ANALYTICS', 'Cache invalidé', { userId: userId.substring(0, 8) });
    
    return NextResponse.json({
      success: true,
      message: 'Cache analytics invalidé'
    });
    
  } catch (error) {
    logger.error('ANALYTICS', 'Erreur invalidation cache', { error: error.message });
    
    return NextResponse.json(
      { error: 'Erreur lors de l\'invalidation du cache' },
      { status: 500 }
    );
  }
}
