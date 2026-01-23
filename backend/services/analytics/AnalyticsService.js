/**
 * AnalyticsService.js
 * 
 * Service de calcul des analytics utilisateur pour Socrate.
 * Fournit des métriques de progression, erreurs fréquentes,
 * et statistiques de performance.
 * 
 * @version 1.0.0
 * @phase T3.4
 */

import { COMPETENCES_EXCEL } from '@/shared/data/competencesExcel';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Seuil de maîtrise d'une compétence (nb exercices réussis)
  masteryThreshold: 5,
  
  // Périodes supportées
  periods: {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'all': 365 * 10 // 10 ans (= tout)
  },
  
  // Limites pour les requêtes
  maxErrorTypes: 10,
  maxCompetencesPerCategory: 50,
  
  // Cache TTL (ms)
  cacheTTL: 5 * 60 * 1000 // 5 minutes
};

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class AnalyticsService {
  
  constructor(supabaseClient = null) {
    this.supabase = supabaseClient;
    this.config = CONFIG;
    this.cache = new Map();
  }
  
  /**
   * Initialise le client Supabase si non fourni
   * @returns {Object|null} Client Supabase ou null
   */
  async ensureSupabase() {
    if (!this.supabase) {
      // Essayer d'importer depuis lib/supabase
      try {
        const { supabaseAdmin } = await import('@/lib/supabase');
        this.supabase = supabaseAdmin;
      } catch (e) {
        console.warn('⚠️ [ANALYTICS] Impossible de charger Supabase');
      }
    }
    return this.supabase;
  }
  
  // ==========================================================================
  // MÉTHODE PRINCIPALE
  // ==========================================================================
  
  /**
   * Récupère toutes les analytics pour un utilisateur
   * @param {string} userId - ID utilisateur
   * @param {Object} options - Options de requête
   * @returns {Promise<Object>} Analytics complètes
   */
  async getUserAnalytics(userId, options = {}) {
    const { period = '30d', competenceId = null, useCache = true } = options;
    
    // Vérifier le cache
    const cacheKey = `${userId}-${period}-${competenceId || 'all'}`;
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTTL) {
        return cached.data;
      }
    }
    
    // Récupérer l'historique
    const history = await this.getHistory(userId, period, competenceId);
    
    // Calculer toutes les métriques
    const analytics = {
      summary: this.computeSummary(history, userId),
      competences: this.computeCompetences(history),
      errors: this.computeErrors(history),
      progression: this.computeProgression(history, period),
      performance: this.computePerformance(history),
      recommendations: this.computeRecommendations(history),
      metadata: {
        userId,
        period,
        competenceFilter: competenceId,
        generatedAt: new Date().toISOString(),
        historyCount: history.length
      }
    };
    
    // Mettre en cache
    this.cache.set(cacheKey, { data: analytics, timestamp: Date.now() });
    
    return analytics;
  }
  
  // ==========================================================================
  // RÉCUPÉRATION DES DONNÉES
  // ==========================================================================
  
  /**
   * Récupère l'historique des exercices
   */
  async getHistory(userId, period, competenceId = null) {
    await this.ensureSupabase();
    
    // Guard: vérifier que Supabase est configuré
    if (!this.supabase) {
      console.warn('⚠️ [ANALYTICS] Supabase non configuré, retour historique vide');
      return [];
    }
    
    const startDate = this.getStartDate(period);
    
    let query = this.supabase
      .from('exercise_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (competenceId) {
      query = query.eq('competence_id', competenceId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erreur récupération historique:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Calcule la date de début selon la période
   */
  getStartDate(period) {
    const days = this.config.periods[period] || this.config.periods['30d'];
    const now = new Date();
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  
  // ==========================================================================
  // CALCUL DU RÉSUMÉ
  // ==========================================================================
  
  /**
   * Calcule le résumé global
   */
  computeSummary(history, userId) {
    const total = history.length;
    const passed = history.filter(h => h.passed).length;
    const scores = history.map(h => h.score).filter(s => s !== null && s !== undefined);
    const durations = history.map(h => h.attempt_duration).filter(d => d && d > 0);
    
    return {
      total_exercises: total,
      total_passed: passed,
      total_failed: total - passed,
      success_rate: total > 0 ? this.round((passed / total) * 100, 1) : 0,
      average_score: scores.length > 0 
        ? this.round(scores.reduce((a, b) => a + b, 0) / scores.length, 1) 
        : 0,
      max_score: scores.length > 0 ? Math.max(...scores) : 0,
      min_score: scores.length > 0 ? Math.min(...scores) : 0,
      total_time_spent_ms: durations.reduce((acc, d) => acc + d, 0),
      total_time_spent_formatted: this.formatDuration(durations.reduce((acc, d) => acc + d, 0)),
      current_streak: this.computeStreak(history)
    };
  }
  
  /**
   * Calcule le streak actuel (jours consécutifs avec exercice réussi)
   */
  computeStreak(history) {
    if (history.length === 0) return 0;
    
    // Extraire les dates uniques avec au moins un exercice réussi
    const passedDates = new Set(
      history
        .filter(h => h.passed)
        .map(h => h.created_at.split('T')[0])
    );
    
    if (passedDates.size === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Vérifier si exercice aujourd'hui, sinon commencer par hier
    const todayStr = currentDate.toISOString().split('T')[0];
    if (!passedDates.has(todayStr)) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Compter les jours consécutifs
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (passedDates.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }
  
  // ==========================================================================
  // CALCUL PAR COMPÉTENCE
  // ==========================================================================
  
  /**
   * Calcule les statistiques par compétence
   */
  computeCompetences(history) {
    const byCompetence = {};
    
    // Grouper par compétence
    history.forEach(h => {
      const compId = h.competence_id;
      if (!byCompetence[compId]) {
        byCompetence[compId] = { 
          passed: 0, 
          failed: 0, 
          scores: [], 
          lastAttempt: null,
          hintsUsed: 0,
          totalAttempts: 0
        };
      }
      
      const comp = byCompetence[compId];
      if (h.passed) comp.passed++;
      else comp.failed++;
      if (h.score !== null) comp.scores.push(h.score);
      comp.totalAttempts++;
      if (h.hints_used) comp.hintsUsed += h.hints_used.length;
      if (!comp.lastAttempt || h.created_at > comp.lastAttempt) {
        comp.lastAttempt = h.created_at;
      }
    });
    
    // Classifier les compétences
    const mastered = [];
    const inProgress = [];
    const struggling = [];
    const notStarted = [];
    
    COMPETENCES_EXCEL.forEach(comp => {
      const data = byCompetence[comp.id];
      
      if (!data) {
        notStarted.push({ 
          id: comp.id, 
          nom: comp.nom, 
          categorie: comp.categorie,
          niveau: comp.niveau 
        });
        return;
      }
      
      const avgScore = data.scores.length > 0 
        ? this.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length, 1)
        : 0;
      
      const compInfo = {
        id: comp.id,
        nom: comp.nom,
        categorie: comp.categorie,
        niveau: comp.niveau,
        exercises_passed: data.passed,
        exercises_failed: data.failed,
        total_attempts: data.totalAttempts,
        average_score: avgScore,
        last_score: data.scores.length > 0 ? data.scores[0] : 0, // Le plus récent
        last_attempt: data.lastAttempt,
        hints_used: data.hintsUsed,
        success_rate: this.round((data.passed / data.totalAttempts) * 100, 1)
      };
      
      if (data.passed >= this.config.masteryThreshold) {
        mastered.push(compInfo);
      } else if (data.failed > data.passed && data.totalAttempts >= 3) {
        // Plus d'échecs que de réussites après 3 tentatives = difficulté
        struggling.push(compInfo);
      } else if (data.totalAttempts > 0) {
        inProgress.push(compInfo);
      }
    });
    
    // Trier par niveau
    const sortByLevel = (a, b) => a.niveau - b.niveau;
    
    return {
      mastered: mastered.sort((a, b) => b.exercises_passed - a.exercises_passed),
      in_progress: inProgress.sort(sortByLevel),
      struggling: struggling.sort((a, b) => a.success_rate - b.success_rate),
      not_started: notStarted.sort(sortByLevel).slice(0, this.config.maxCompetencesPerCategory),
      summary: {
        total_competences: COMPETENCES_EXCEL.length,
        mastered_count: mastered.length,
        in_progress_count: inProgress.length,
        struggling_count: struggling.length,
        not_started_count: notStarted.length,
        mastery_percentage: this.round((mastered.length / COMPETENCES_EXCEL.length) * 100, 1)
      }
    };
  }
  
  // ==========================================================================
  // CALCUL DES ERREURS
  // ==========================================================================
  
  /**
   * Calcule les statistiques d'erreurs
   */
  computeErrors(history) {
    const errorCounts = {};
    const errorsByCompetence = {};
    const errorExamples = {};
    
    history.forEach(h => {
      const errors = h.error_types || [];
      const compId = h.competence_id;
      
      errors.forEach(errType => {
        // Comptage global
        errorCounts[errType] = (errorCounts[errType] || 0) + 1;
        
        // Par compétence
        if (!errorsByCompetence[compId]) {
          errorsByCompetence[compId] = {};
        }
        errorsByCompetence[compId][errType] = (errorsByCompetence[compId][errType] || 0) + 1;
        
        // Exemple (premier checkpoint échoué)
        if (!errorExamples[errType] && h.checkpoints_detail) {
          const failedCp = h.checkpoints_detail.find(cp => cp.error_type === errType);
          if (failedCp) {
            errorExamples[errType] = {
              user_formula: failedCp.user_formula,
              expected_formula: failedCp.expected_formula,
              description: failedCp.description
            };
          }
        }
      });
    });
    
    const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
    
    // Top erreurs
    const mostFrequent = Object.entries(errorCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalErrors > 0 ? this.round((count / totalErrors) * 100, 1) : 0,
        label: this.getErrorLabel(type),
        severity: this.getErrorSeverity(type),
        example: errorExamples[type] || null
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, this.config.maxErrorTypes);
    
    // Par compétence (top 3 erreurs par compétence)
    const byCompetence = {};
    Object.entries(errorsByCompetence).forEach(([compId, errors]) => {
      const topErrors = Object.entries(errors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => ({ type, count, label: this.getErrorLabel(type) }));
      byCompetence[compId] = topErrors;
    });
    
    return {
      total_errors: totalErrors,
      unique_error_types: Object.keys(errorCounts).length,
      most_frequent: mostFrequent,
      by_competence: byCompetence,
      error_rate: history.length > 0 
        ? this.round(history.filter(h => (h.error_types || []).length > 0).length / history.length * 100, 1)
        : 0
    };
  }
  
  /**
   * Retourne un label lisible pour un type d'erreur
   */
  getErrorLabel(errorType) {
    const labels = {
      'MISSING_FUNCTION': 'Fonction manquante',
      'WRONG_FUNCTION': 'Mauvaise fonction',
      'FUNCTION_TYPO': 'Faute de frappe dans la fonction',
      'MISSING_EQUALS': 'Signe = manquant',
      'UNBALANCED_PARENS': 'Parenthèses non équilibrées',
      'WRONG_SEPARATOR': 'Mauvais séparateur (virgule/point-virgule)',
      'MISSING_QUOTES': 'Guillemets manquants',
      'RANGE_TOO_SHORT': 'Plage trop courte',
      'WRONG_COLUMN': 'Mauvaise colonne',
      'CIRCULAR_REFERENCE': 'Référence circulaire',
      'MISSING_ABSOLUTE': 'Référence absolue manquante',
      'UNNECESSARY_ABSOLUTE': 'Référence absolue inutile',
      'MISSING_CRITERIA_QUOTES': 'Critère sans guillemets',
      'OPERATOR_OUTSIDE_QUOTES': 'Opérateur mal placé',
      'WRONG_VALUE': 'Valeur incorrecte',
      'CLOSE_VALUE': 'Valeur proche mais incorrecte',
      'WRONG_TYPE': 'Type de données incorrect',
      'NA_ERROR': 'Erreur #N/A',
      'REF_ERROR': 'Erreur #REF!',
      'VALUE_ERROR': 'Erreur #VALEUR!'
    };
    return labels[errorType] || errorType;
  }
  
  /**
   * Retourne la sévérité d'une erreur
   */
  getErrorSeverity(errorType) {
    const highSeverity = ['CIRCULAR_REFERENCE', 'REF_ERROR', 'WRONG_FUNCTION'];
    const lowSeverity = ['FUNCTION_TYPO', 'WRONG_SEPARATOR', 'UNNECESSARY_ABSOLUTE'];
    
    if (highSeverity.includes(errorType)) return 'high';
    if (lowSeverity.includes(errorType)) return 'low';
    return 'medium';
  }
  
  // ==========================================================================
  // CALCUL DE LA PROGRESSION
  // ==========================================================================
  
  /**
   * Calcule la progression temporelle
   */
  computeProgression(history, period) {
    const byDate = {};
    
    history.forEach(h => {
      const date = h.created_at.split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { 
          exercises: 0, 
          passed: 0, 
          failed: 0,
          scores: [],
          duration: 0
        };
      }
      byDate[date].exercises++;
      if (h.passed) byDate[date].passed++;
      else byDate[date].failed++;
      if (h.score !== null) byDate[date].scores.push(h.score);
      if (h.attempt_duration) byDate[date].duration += h.attempt_duration;
    });
    
    const data = Object.entries(byDate)
      .map(([date, stats]) => ({
        date,
        exercises: stats.exercises,
        passed: stats.passed,
        failed: stats.failed,
        success_rate: stats.exercises > 0 ? this.round((stats.passed / stats.exercises) * 100, 0) : 0,
        avg_score: stats.scores.length > 0
          ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
          : 0,
        total_duration_minutes: Math.round(stats.duration / 60000)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculer les tendances
    const trend = this.computeTrend(data);
    
    return { 
      period, 
      data,
      trend,
      active_days: data.length,
      most_active_day: data.length > 0 
        ? data.reduce((max, d) => d.exercises > max.exercises ? d : max, data[0])
        : null
    };
  }
  
  /**
   * Calcule la tendance (amélioration ou régression)
   */
  computeTrend(progressionData) {
    if (progressionData.length < 7) {
      return { direction: 'neutral', confidence: 'low' };
    }
    
    // Comparer la moyenne des 7 derniers jours vs les 7 jours précédents
    const recent = progressionData.slice(-7);
    const previous = progressionData.slice(-14, -7);
    
    if (previous.length < 3) {
      return { direction: 'neutral', confidence: 'low' };
    }
    
    const recentAvg = recent.reduce((sum, d) => sum + d.avg_score, 0) / recent.length;
    const previousAvg = previous.reduce((sum, d) => sum + d.avg_score, 0) / previous.length;
    
    const diff = recentAvg - previousAvg;
    
    if (diff > 5) return { direction: 'improving', confidence: 'high', diff: this.round(diff, 1) };
    if (diff > 2) return { direction: 'improving', confidence: 'medium', diff: this.round(diff, 1) };
    if (diff < -5) return { direction: 'declining', confidence: 'high', diff: this.round(diff, 1) };
    if (diff < -2) return { direction: 'declining', confidence: 'medium', diff: this.round(diff, 1) };
    
    return { direction: 'stable', confidence: 'medium', diff: this.round(diff, 1) };
  }
  
  // ==========================================================================
  // CALCUL DES PERFORMANCES
  // ==========================================================================
  
  /**
   * Calcule les métriques de performance
   */
  computePerformance(history) {
    const durations = history.map(h => h.attempt_duration).filter(d => d && d > 0);
    const attempts = history.map(h => h.attempt_number).filter(a => a && a > 0);
    const withHints = history.filter(h => (h.hints_used || []).length > 0);
    const hintsTotal = history.reduce((sum, h) => sum + (h.hints_used || []).length, 0);
    
    // Calcul par quartile de durée
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const q1 = sortedDurations[Math.floor(sortedDurations.length * 0.25)] || 0;
    const median = sortedDurations[Math.floor(sortedDurations.length * 0.5)] || 0;
    const q3 = sortedDurations[Math.floor(sortedDurations.length * 0.75)] || 0;
    
    return {
      duration: {
        average_ms: durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0,
        average_formatted: this.formatDuration(
          durations.length > 0 
            ? durations.reduce((a, b) => a + b, 0) / durations.length 
            : 0
        ),
        median_ms: median,
        median_formatted: this.formatDuration(median),
        fastest_ms: sortedDurations[0] || 0,
        slowest_ms: sortedDurations[sortedDurations.length - 1] || 0,
        quartiles: { q1, median, q3 }
      },
      attempts: {
        average: attempts.length > 0
          ? this.round(attempts.reduce((a, b) => a + b, 0) / attempts.length, 1)
          : 1,
        max: attempts.length > 0 ? Math.max(...attempts) : 1,
        first_try_success_rate: history.length > 0
          ? this.round(history.filter(h => h.passed && h.attempt_number === 1).length / history.length * 100, 1)
          : 0
      },
      hints: {
        usage_rate: history.length > 0
          ? this.round((withHints.length / history.length) * 100, 1)
          : 0,
        average_per_exercise: history.length > 0
          ? this.round(hintsTotal / history.length, 1)
          : 0,
        exercises_without_hints: history.length - withHints.length,
        success_rate_without_hints: history.length > 0
          ? this.round(
              history.filter(h => h.passed && (h.hints_used || []).length === 0).length / 
              history.filter(h => (h.hints_used || []).length === 0).length * 100, 
              1
            ) || 0
          : 0
      }
    };
  }
  
  // ==========================================================================
  // RECOMMANDATIONS
  // ==========================================================================
  
  /**
   * Génère des recommandations personnalisées
   */
  computeRecommendations(history) {
    const recommendations = [];
    
    // Analyser les compétences
    const competenceData = this.computeCompetences(history);
    const errorData = this.computeErrors(history);
    const perfData = this.computePerformance(history);
    
    // Recommandation 1: Compétences en difficulté
    if (competenceData.struggling.length > 0) {
      const top = competenceData.struggling[0];
      recommendations.push({
        type: 'focus_competence',
        priority: 'high',
        title: `Renforcer "${top.nom}"`,
        description: `Tu as ${top.success_rate}% de réussite sur cette compétence. Concentre-toi dessus !`,
        competence_id: top.id,
        action: 'practice'
      });
    }
    
    // Recommandation 2: Erreurs fréquentes
    if (errorData.most_frequent.length > 0) {
      const topError = errorData.most_frequent[0];
      if (topError.count >= 3) {
        recommendations.push({
          type: 'fix_error',
          priority: 'high',
          title: `Attention à : ${topError.label}`,
          description: `Cette erreur revient souvent (${topError.count} fois). Prends le temps de comprendre pourquoi.`,
          error_type: topError.type,
          action: 'review'
        });
      }
    }
    
    // Recommandation 3: Progression
    if (competenceData.in_progress.length > 0) {
      const almostMastered = competenceData.in_progress.find(
        c => c.exercises_passed >= this.config.masteryThreshold - 1
      );
      if (almostMastered) {
        recommendations.push({
          type: 'almost_mastered',
          priority: 'medium',
          title: `Plus qu'un effort sur "${almostMastered.nom}" !`,
          description: `Tu es à ${almostMastered.exercises_passed}/${this.config.masteryThreshold} exercices réussis pour la maîtrise.`,
          competence_id: almostMastered.id,
          action: 'practice'
        });
      }
    }
    
    // Recommandation 4: Utilisation des indices
    if (perfData.hints.usage_rate > 50) {
      recommendations.push({
        type: 'reduce_hints',
        priority: 'low',
        title: 'Essaie sans les indices',
        description: `Tu utilises les indices dans ${perfData.hints.usage_rate}% des exercices. Essaie de t'en passer pour progresser !`,
        action: 'challenge'
      });
    }
    
    // Recommandation 5: Nouvelles compétences
    if (competenceData.mastered.length >= 3 && competenceData.not_started.length > 0) {
      const next = competenceData.not_started[0];
      recommendations.push({
        type: 'new_competence',
        priority: 'medium',
        title: `Découvre "${next.nom}"`,
        description: `Tu maîtrises déjà ${competenceData.mastered.length} compétences. Prêt pour la suite ?`,
        competence_id: next.id,
        action: 'explore'
      });
    }
    
    // Recommandation 6: Streak
    if (history.length > 0) {
      const streak = this.computeStreak(history);
      if (streak === 0) {
        recommendations.push({
          type: 'start_streak',
          priority: 'low',
          title: 'Lance ton streak !',
          description: 'Réussis un exercice aujourd\'hui pour commencer une série de jours consécutifs.',
          action: 'practice'
        });
      } else if (streak >= 3) {
        recommendations.push({
          type: 'keep_streak',
          priority: 'medium',
          title: `🔥 Streak de ${streak} jours !`,
          description: 'Continue comme ça, ne casse pas ta série !',
          action: 'maintain'
        });
      }
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  // ==========================================================================
  // UTILITAIRES
  // ==========================================================================
  
  /**
   * Arrondit un nombre
   */
  round(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  /**
   * Formate une durée en ms en texte lisible
   */
  formatDuration(ms) {
    if (!ms || ms <= 0) return '0 min';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    if (minutes > 0) {
      return `${minutes} min ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
  
  /**
   * Vide le cache
   * @param {string} userId - Si fourni, vide uniquement le cache de cet utilisateur
   */
  clearCache(userId = null) {
    if (userId) {
      // Supprimer toutes les entrées de cache pour cet utilisateur
      for (const key of this.cache.keys()) {
        if (key.startsWith(userId)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Vider tout le cache
      this.cache.clear();
    }
  }
  
  /**
   * Récupère les analytics pour une compétence spécifique
   */
  async getCompetenceAnalytics(userId, competenceId, period = '30d') {
    return this.getUserAnalytics(userId, { period, competenceId });
  }
  
  /**
   * Récupère uniquement le résumé (rapide)
   * @param {string} userId - ID utilisateur
   * @param {string} period - Période ('7d', '30d', '90d', 'all')
   */
  async getQuickSummary(userId, period = '30d') {
    const history = await this.getHistory(userId, period);
    return {
      ...this.computeSummary(history, userId),
      competences_mastered: history.length > 0 
        ? this.computeCompetences(history).mastered.length 
        : 0,
      period: period
    };
  }
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default AnalyticsService;
