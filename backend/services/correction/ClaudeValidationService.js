/**
 * CLAUDE VALIDATION SERVICE - v1.0
 * 
 * Service de validation hybride pour les checkpoints nécessitant Claude.
 * Complète CheckpointValidator (validation auto) et VisualValidationService (screenshots).
 * 
 * PRINCIPE : Validation intelligente basée sur le type de checkpoint
 * - full_auto : CheckpointValidator seul
 * - semi_auto + screenshot : VisualValidationService
 * - claude_required : Ce service
 * 
 * @version 1.0.0
 */

import logger from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 2000,
  confidenceThreshold: 0.7
};

// Compétences nécessitant un screenshot (graphiques, MFC, TCD, tri, filtres)
const VISUAL_COMPETENCE_IDS = [2, 7, 8, 10, 21, 23, 26, 31, 32, 40, 45, 52, 57];

// ═══════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

class ClaudeValidationService {
  
  constructor(claudeClient = null) {
    this.claude = claudeClient;
    this.config = CONFIG;
  }
  
  setClient(client) {
    this.claude = client;
  }
  
  // ==========================================================================
  // CATÉGORISATION DES CHECKPOINTS
  // ==========================================================================
  
  /**
   * Catégorise les checkpoints d'un exercice par type de validation
   */
  categorizeCheckpoints(exercise) {
    const checkpoints = exercise.checkpoints || [];
    
    const autoCheckpoints = [];      // Validables automatiquement
    const visualCheckpoints = [];    // Nécessitent screenshot
    const claudeCheckpoints = [];    // Nécessitent Claude sans screenshot
    
    for (const cp of checkpoints) {
      if (cp.validation === 'claude' || cp.requires_claude) {
        claudeCheckpoints.push(cp);
      } else if (this.isVisualCheckpoint(cp)) {
        visualCheckpoints.push(cp);
      } else if (['formule', 'valeur', 'donnees', 'texte_contient'].includes(cp.type)) {
        autoCheckpoints.push(cp);
      } else if (!cp.expected_value && !cp.expected_formula && !cp.expected) {
        claudeCheckpoints.push(cp);
      } else {
        autoCheckpoints.push(cp);
      }
    }
    
    return {
      autoCheckpoints,
      visualCheckpoints,
      claudeCheckpoints,
      needsScreenshot: visualCheckpoints.length > 0,
      summary: {
        total: checkpoints.length,
        auto: autoCheckpoints.length,
        visual: visualCheckpoints.length,
        claude: claudeCheckpoints.length
      }
    };
  }
  
  /**
   * Vérifie si un checkpoint est visuel
   */
  isVisualCheckpoint(checkpoint) {
    const visualTypes = ['graphique', 'graph', 'chart', 'format', 'mfc', 
                        'format_conditionnel', 'tcd', 'pivot', 'tri', 'sort', 'filtre', 'filter'];
    
    return (checkpoint.type && visualTypes.some(t => checkpoint.type.toLowerCase().includes(t))) ||
           checkpoint.validation_type === 'visual' || 
           checkpoint.requires_screenshot;
  }
  
  /**
   * Vérifie si une compétence nécessite un screenshot
   */
  competenceNeedsScreenshot(competenceId) {
    return VISUAL_COMPETENCE_IDS.includes(parseInt(competenceId));
  }
  
  /**
   * Vérifie si un exercice nécessite un screenshot
   */
  exerciseNeedsScreenshot(exercise) {
    // Vérifier les checkpoints
    const { visualCheckpoints } = this.categorizeCheckpoints(exercise);
    if (visualCheckpoints.length > 0) return true;
    
    // Vérifier les compétences
    // Vérifier les compétences (chercher les deux variantes de nom)
    const competenceIds = exercise.competence_ids || exercise.competences_ids || [];
    return competenceIds.some(id => this.competenceNeedsScreenshot(id));
  }
  
  // ==========================================================================
  // VALIDATION AVEC CLAUDE
  // ==========================================================================
  
  /**
   * Valide des checkpoints complexes avec Claude
   */
  async validateWithClaude(exercise, checkpoints, extractedData) {
    if (!this.claude) {
      logger.warn('CLAUDE_VALIDATOR', 'Client non configuré');
      return this.getFallbackResults(checkpoints, 'Client Claude non disponible');
    }
    
    if (checkpoints.length === 0) {
      return { results: [], totalScore: 0, maxScore: 0 };
    }
    
    logger.info('CLAUDE_VALIDATOR', 'Validation', { count: checkpoints.length });
    
    try {
      const prompt = this.buildValidationPrompt(exercise, checkpoints, extractedData);
      
      const response = await this.claude.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent) throw new Error('Pas de réponse');
      
      const parsed = this.parseResponse(textContent.text);
      return this.processResults(parsed, checkpoints);
      
    } catch (error) {
      logger.error('CLAUDE_VALIDATOR', 'Erreur', { error: error.message });
      return this.getFallbackResults(checkpoints, error.message);
    }
  }
  
  buildValidationPrompt(exercise, checkpoints, extractedData) {
    const cpList = checkpoints.map((cp, i) => `
${i + 1}. [${cp.id}] ${cp.description}
   Type: ${cp.type}, Points: ${cp.points || 10}
   ${cp.cellule ? `Cellule: ${cp.cellule}` : ''}`).join('');
    
    const dataStr = this.formatData(extractedData);
    
    return `Tu es un correcteur Excel. Valide ces checkpoints.

EXERCICE: ${exercise.titre || 'Exercice'}
CONTEXTE: ${typeof exercise.contexte === 'string' ? exercise.contexte : exercise.contexte?.situation || ''}

DONNÉES UTILISATEUR:
${dataStr}

CHECKPOINTS:
${cpList}

Réponds en JSON uniquement:
{
  "validations": [
    {"id": "...", "passed": true/false/null, "confidence": 0.0-1.0, "feedback": "..."}
  ]
}`;
  }
  
  formatData(data) {
    if (!data) return 'Aucune donnée';
    const parts = [];
    if (data.formulas) {
      const f = Object.entries(data.formulas).slice(0, 15).map(([c, v]) => `${c}: ${v}`).join('\n');
      parts.push(`FORMULES:\n${f}`);
    }
    if (data.values) {
      const v = Object.entries(data.values).slice(0, 20).map(([c, v]) => `${c}: ${v}`).join('\n');
      parts.push(`VALEURS:\n${v}`);
    }
    return parts.join('\n\n') || 'Données limitées';
  }
  
  parseResponse(text) {
    try {
      let clean = text.trim();
      if (clean.startsWith('```json')) clean = clean.slice(7);
      else if (clean.startsWith('```')) clean = clean.slice(3);
      if (clean.endsWith('```')) clean = clean.slice(0, -3);
      return JSON.parse(clean.trim());
    } catch (e) {
      return { validations: [] };
    }
  }
  
  processResults(parsed, checkpoints) {
    const validations = parsed.validations || [];
    
    const results = checkpoints.map(cp => {
      const v = validations.find(x => x.id === cp.id);
      if (!v) return { id: cp.id, passed: null, score: 0, feedback: 'Non évalué', checkpoint: cp };
      
      const passed = v.passed === true && (v.confidence || 1) >= this.config.confidenceThreshold;
      return {
        id: cp.id,
        passed,
        score: passed ? (cp.points || 10) : 0,
        confidence: v.confidence,
        feedback: v.feedback || '',
        checkpoint: cp
      };
    });
    
    const totalScore = results.reduce((s, r) => s + r.score, 0);
    const maxScore = checkpoints.reduce((s, cp) => s + (cp.points || 10), 0);
    
    return { results, totalScore, maxScore, percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0 };
  }
  
  getFallbackResults(checkpoints, error) {
    return {
      results: checkpoints.map(cp => ({
        id: cp.id, passed: null, score: 0, feedback: `Erreur: ${error}`, checkpoint: cp
      })),
      totalScore: 0,
      maxScore: checkpoints.reduce((s, cp) => s + (cp.points || 10), 0),
      error
    };
  }
  
  // ==========================================================================
  // LISTE DES COMPÉTENCES VISUELLES
  // ==========================================================================
  
  getVisualCompetenceIds() {
    return VISUAL_COMPETENCE_IDS;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const claudeValidator = new ClaudeValidationService();
export { ClaudeValidationService, CONFIG, VISUAL_COMPETENCE_IDS };
export default claudeValidator;
