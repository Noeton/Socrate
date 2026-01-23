/**
 * VisualValidationService.js
 * 
 * Service de validation visuelle pour les exercices nécessitant une vérification
 * par capture d'écran : graphiques et mise en forme conditionnelle (MFC).
 * 
 * Utilise Claude Vision API pour analyser les screenshots et valider
 * les éléments visuels contre les critères attendus.
 * 
 * TODO [LIMITE] : Ce service est fonctionnel mais non intégré au frontend :
 *   1. Le frontend doit implémenter l'upload de screenshot (tâche T3.3.6)
 *   2. L'API /api/correct-exercise doit accepter les images en base64
 *   3. Le coût Claude Vision doit être pris en compte (images = tokens)
 *   4. Tests E2E non effectués avec de vrais screenshots Excel
 * 
 * @version 1.0.0
 * @phase T3.3
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Limites images
  maxImageSize: 5 * 1024 * 1024, // 5MB
  supportedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  
  // Modèle Claude Vision
  defaultModel: 'claude-sonnet-4-20250514',
  maxTokens: 2000,
  
  // Scoring
  scoring: {
    graph: {
      type_correct: 30,
      title_present: 15,
      title_relevant: 10,
      legend_present: 15,
      series_correct: 15,
      categories_correct: 15
    },
    mfc: {
      detected: 20,
      type_correct: 30,
      colors_correct: 20,
      location_correct: 15,
      coherence: 15
    }
  },
  
  // Tolérance
  tolerance: {
    categories_count: 2,
    series_count: 1
  }
};

// ============================================================================
// TYPES DE GRAPHIQUES
// ============================================================================

const GRAPH_TYPES = {
  histogram: ['histogramme', 'histogram', 'bar', 'barres', 'colonnes', 'column'],
  pie: ['camembert', 'pie', 'secteurs', 'circulaire', 'donut'],
  line: ['courbe', 'line', 'lignes', 'ligne', 'evolution'],
  scatter: ['nuage', 'scatter', 'points', 'xy'],
  area: ['aire', 'area', 'surface'],
  combo: ['mixte', 'combo', 'combiné', 'combined']
};

// ============================================================================
// TYPES DE MFC
// ============================================================================

const MFC_TYPES = {
  color_scale: ['échelle de couleurs', 'color scale', 'dégradé', 'gradient'],
  databar: ['barres de données', 'databar', 'data bar', 'barres'],
  iconset: ['jeu d\'icônes', 'iconset', 'icon set', 'icônes', 'flèches', 'feux'],
  cell_value: ['valeur cellule', 'cell value', 'surbrillance', 'highlight'],
  top10: ['top 10', 'top10', 'meilleures valeurs', 'top values'],
  unique_values: ['valeurs uniques', 'unique values', 'doublons', 'duplicates'],
  formula: ['formule', 'formula', 'règle personnalisée']
};

// ============================================================================
// COULEURS RECONNUES
// ============================================================================

const COLOR_MAPPINGS = {
  // Français → Anglais normalisé
  'vert': 'green',
  'rouge': 'red',
  'bleu': 'blue',
  'jaune': 'yellow',
  'orange': 'orange',
  'violet': 'purple',
  'rose': 'pink',
  'gris': 'gray',
  'noir': 'black',
  'blanc': 'white',
  'cyan': 'cyan',
  'magenta': 'magenta',
  // Anglais direct
  'green': 'green',
  'red': 'red',
  'blue': 'blue',
  'yellow': 'yellow'
};

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

class VisualValidationService {
  
  constructor(claudeClient = null) {
    this.claude = claudeClient;
    this.config = CONFIG;
  }
  
  // ==========================================================================
  // MÉTHODES PUBLIQUES PRINCIPALES
  // ==========================================================================
  
  /**
   * Valide tous les checkpoints visuels d'un exercice
   * @param {Array} checkpoints - Checkpoints de type graphique ou format
   * @param {string} screenshotBase64 - Image en base64
   * @param {Object} context - Contexte de l'exercice
   * @returns {Promise<Object>} Résultats de validation
   */
  async validateAll(checkpoints, screenshotBase64, context = {}) {
    const visualCheckpoints = checkpoints.filter(
      cp => ['graphique', 'format'].includes(cp.type)
    );
    
    if (visualCheckpoints.length === 0) {
      return { checkpoints: [], hasVisualValidation: false };
    }
    
    // Prétraiter l'image
    const processedImage = await this.preprocessImage(screenshotBase64);
    
    if (!processedImage.valid) {
      return {
        checkpoints: visualCheckpoints.map(cp => ({
          ...cp,
          valid: false,
          score: 0,
          error: processedImage.error,
          status: 'image_error'
        })),
        hasVisualValidation: true,
        imageError: processedImage.error
      };
    }
    
    // Valider chaque checkpoint
    const results = await Promise.all(
      visualCheckpoints.map(cp => this.validateVisualCheckpoint(cp, processedImage.base64, context))
    );
    
    return {
      checkpoints: results,
      hasVisualValidation: true,
      globalVisualScore: this.computeGlobalScore(results)
    };
  }
  
  /**
   * Valide un checkpoint visuel unique
   * @param {Object} checkpoint - Checkpoint à valider
   * @param {string} screenshotBase64 - Image en base64
   * @param {Object} context - Contexte
   * @returns {Promise<Object>} Résultat de validation
   */
  async validateVisualCheckpoint(checkpoint, screenshotBase64, context = {}) {
    try {
      if (checkpoint.type === 'graphique') {
        return await this.validateGraph(screenshotBase64, checkpoint.expected || checkpoint, context);
      } else if (checkpoint.type === 'format') {
        // Vérifier si c'est un checkpoint MFC (subtype commence par 'mfc' ou description contient des keywords)
        if (checkpoint.subtype?.startsWith('mfc') || checkpoint.subtype === 'mfc' || this.isMFCCheckpoint(checkpoint)) {
          return await this.validateMFC(screenshotBase64, checkpoint.expected || checkpoint, context);
        }
        // Format simple (couleur, bordure) - validation basique
        return await this.validateBasicFormat(screenshotBase64, checkpoint.expected || checkpoint, context);
      }
      
      return {
        ...checkpoint,
        valid: false,
        score: 0,
        error: 'Type de checkpoint visuel non reconnu'
      };
    } catch (error) {
      console.error('Erreur validation visuelle:', error);
      return {
        ...checkpoint,
        valid: false,
        score: 0,
        error: error.message,
        status: 'validation_error'
      };
    }
  }
  
  // ==========================================================================
  // VALIDATION GRAPHIQUES (T3.3.2)
  // ==========================================================================
  
  /**
   * Valide un graphique dans le screenshot
   * @param {string} screenshotBase64 - Image
   * @param {Object} expectedConfig - Configuration attendue
   * @param {Object} context - Contexte
   * @returns {Promise<Object>} Résultat
   */
  async validateGraph(screenshotBase64, expectedConfig, context = {}) {
    const prompt = this.buildGraphPrompt(expectedConfig, context);
    const analysis = await this.analyzeWithVision(screenshotBase64, prompt);
    
    if (!analysis || analysis.error) {
      return {
        type: 'graphique',
        valid: false,
        score: 0,
        error: analysis?.error || 'Erreur analyse Vision',
        analysis: null
      };
    }
    
    return this.evaluateGraphAnalysis(analysis, expectedConfig);
  }
  
  /**
   * Construit le prompt pour l'analyse de graphique
   */
  buildGraphPrompt(expectedConfig, context = {}) {
    const expectedType = expectedConfig.graph_type || 'quelconque';
    
    return `Tu es un expert Excel qui analyse des captures d'écran.
Analyse cette image qui devrait contenir un graphique Excel.

CONTEXTE:
- Type de graphique attendu: ${expectedType}
- L'utilisateur devait créer un graphique montrant des données

ANALYSE DEMANDÉE:
Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de commentaires).
Sois précis et factuel.

{
  "graph_detected": true ou false,
  "graph_type": "histogramme" | "camembert" | "courbe" | "nuage" | "aire" | "mixte" | "autre" | "aucun",
  "has_title": true ou false,
  "title_text": "texte du titre ou null",
  "has_legend": true ou false,
  "legend_items": ["item1", "item2"] ou [],
  "data_series_count": nombre de séries de données visibles,
  "categories_count": nombre de catégories/points approximatif,
  "categories_visible": ["Cat1", "Cat2"] si lisibles,
  "axis_labels": {
    "x": "label axe X ou null",
    "y": "label axe Y ou null"
  },
  "colors_used": ["couleur1", "couleur2"],
  "data_visible": true si des données sont affichées,
  "confidence": 0.0 à 1.0,
  "issues": ["problème1", "problème2"] ou []
}`;
  }
  
  /**
   * Évalue l'analyse du graphique contre les attentes
   */
  evaluateGraphAnalysis(analysis, expectedConfig) {
    const scoring = this.config.scoring.graph;
    const tolerance = this.config.tolerance;
    
    let score = 0;
    const checks = [];
    const feedback = [];
    
    // 1. Graphique détecté
    if (!analysis.graph_detected) {
      return {
        type: 'graphique',
        valid: false,
        score: 0,
        checks: [{ name: 'graph_detected', passed: false, points: 0 }],
        feedback: ['Aucun graphique détecté dans l\'image.'],
        analysis
      };
    }
    
    // 2. Type de graphique correct
    const expectedType = this.normalizeGraphType(expectedConfig.graph_type);
    const actualType = this.normalizeGraphType(analysis.graph_type);
    
    if (expectedType && actualType) {
      const typeMatch = expectedType === actualType || actualType === 'autre';
      checks.push({ name: 'type_correct', passed: typeMatch, points: typeMatch ? scoring.type_correct : 0 });
      if (typeMatch) {
        score += scoring.type_correct;
      } else {
        feedback.push(`Type de graphique incorrect : attendu "${expectedConfig.graph_type}", trouvé "${analysis.graph_type}".`);
      }
    }
    
    // 3. Titre présent
    if (expectedConfig.has_title !== false) {
      const titlePresent = analysis.has_title === true;
      checks.push({ name: 'title_present', passed: titlePresent, points: titlePresent ? scoring.title_present : 0 });
      if (titlePresent) {
        score += scoring.title_present;
        
        // 4. Titre pertinent (si mot-clé attendu)
        if (expectedConfig.title_contains && analysis.title_text) {
          const titleRelevant = analysis.title_text.toLowerCase().includes(expectedConfig.title_contains.toLowerCase());
          checks.push({ name: 'title_relevant', passed: titleRelevant, points: titleRelevant ? scoring.title_relevant : 0 });
          if (titleRelevant) {
            score += scoring.title_relevant;
          } else {
            feedback.push(`Le titre devrait contenir "${expectedConfig.title_contains}".`);
          }
        }
      } else {
        feedback.push('Le graphique devrait avoir un titre.');
      }
    }
    
    // 5. Légende présente
    if (expectedConfig.has_legend !== false) {
      const legendPresent = analysis.has_legend === true;
      checks.push({ name: 'legend_present', passed: legendPresent, points: legendPresent ? scoring.legend_present : 0 });
      if (legendPresent) {
        score += scoring.legend_present;
      } else if (expectedConfig.data_series > 1) {
        feedback.push('Une légende est recommandée pour les graphiques avec plusieurs séries.');
      }
    }
    
    // 6. Nombre de séries correct
    if (expectedConfig.data_series) {
      const seriesDiff = Math.abs((analysis.data_series_count || 0) - expectedConfig.data_series);
      const seriesMatch = seriesDiff <= tolerance.series_count;
      checks.push({ name: 'series_correct', passed: seriesMatch, points: seriesMatch ? scoring.series_correct : 0 });
      if (seriesMatch) {
        score += scoring.series_correct;
      } else {
        feedback.push(`Nombre de séries incorrect : attendu ${expectedConfig.data_series}, trouvé ${analysis.data_series_count}.`);
      }
    }
    
    // 7. Nombre de catégories correct
    if (expectedConfig.categories_count) {
      const catDiff = Math.abs((analysis.categories_count || 0) - expectedConfig.categories_count);
      const catMatch = catDiff <= tolerance.categories_count;
      checks.push({ name: 'categories_correct', passed: catMatch, points: catMatch ? scoring.categories_correct : 0 });
      if (catMatch) {
        score += scoring.categories_correct;
      } else {
        feedback.push(`Nombre de catégories incorrect : attendu ~${expectedConfig.categories_count}, trouvé ~${analysis.categories_count}.`);
      }
    }
    
    // Calcul score final
    const maxScore = Object.values(scoring).reduce((a, b) => a + b, 0);
    const scorePercent = Math.round((score / maxScore) * 100);
    const valid = scorePercent >= 70; // Seuil de validation
    
    return {
      type: 'graphique',
      valid,
      score: scorePercent,
      checks,
      feedback: feedback.length > 0 ? feedback : ['Graphique correct !'],
      analysis,
      confidence: analysis.confidence || 0.8
    };
  }
  
  /**
   * Normalise le type de graphique pour comparaison
   */
  normalizeGraphType(type) {
    if (!type) return null;
    const typeLower = type.toLowerCase();
    
    for (const [normalized, variants] of Object.entries(GRAPH_TYPES)) {
      if (variants.some(v => typeLower.includes(v))) {
        return normalized;
      }
    }
    return 'autre';
  }
  
  // ==========================================================================
  // VALIDATION MFC (T3.3.3)
  // ==========================================================================
  
  /**
   * Valide une mise en forme conditionnelle
   * @param {string} screenshotBase64 - Image
   * @param {Object} expectedConfig - Configuration attendue
   * @param {Object} context - Contexte
   * @returns {Promise<Object>} Résultat
   */
  async validateMFC(screenshotBase64, expectedConfig, context = {}) {
    const prompt = this.buildMFCPrompt(expectedConfig, context);
    const analysis = await this.analyzeWithVision(screenshotBase64, prompt);
    
    if (!analysis || analysis.error) {
      return {
        type: 'format',
        subtype: 'mfc',
        valid: false,
        score: 0,
        error: analysis?.error || 'Erreur analyse Vision',
        analysis: null
      };
    }
    
    return this.evaluateMFCAnalysis(analysis, expectedConfig);
  }
  
  /**
   * Construit le prompt pour l'analyse MFC
   */
  buildMFCPrompt(expectedConfig, context = {}) {
    const expectedType = expectedConfig.mfc_type || 'quelconque';
    const targetColumn = expectedConfig.target_column || 'non spécifiée';
    
    return `Tu es un expert Excel qui analyse des captures d'écran.
Analyse cette image pour détecter la mise en forme conditionnelle (MFC) Excel.

CONTEXTE:
- Type de MFC attendu: ${expectedType}
- Colonne cible: ${targetColumn}

TYPES DE MFC À DÉTECTER:
- color_scale: dégradé de couleurs (ex: vert → jaune → rouge)
- databar: barres de données horizontales dans les cellules
- iconset: icônes (flèches, feux tricolores, étoiles, drapeaux)
- cell_value: cellules colorées selon une condition (ex: >100 = vert)
- top10: mise en évidence des N meilleures/pires valeurs
- unique_values: mise en évidence des doublons ou valeurs uniques

ANALYSE DEMANDÉE:
Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de commentaires).

{
  "mfc_detected": true ou false,
  "mfc_types": [
    {
      "type": "color_scale" | "databar" | "iconset" | "cell_value" | "top10" | "unique_values" | "formula" | "autre",
      "location": "colonne ou plage approximative (ex: D, E2:E50)",
      "details": {
        "colors": ["couleur1", "couleur2"] si applicable,
        "gradient_visible": true/false pour color_scale,
        "bar_color": "couleur" pour databar,
        "bars_visible": true/false,
        "icons_type": "arrows" | "traffic_lights" | "flags" | "stars" | "autre" pour iconset,
        "icons_count": nombre d'icônes différentes,
        "highlight_color": "couleur" pour cell_value,
        "highlighted_cells_count": nombre approximatif de cellules mises en évidence
      }
    }
  ],
  "cells_formatted_count": nombre approximatif de cellules avec MFC,
  "columns_with_mfc": ["D", "E"],
  "confidence": 0.0 à 1.0,
  "issues": ["problème1"] ou []
}`;
  }
  
  /**
   * Évalue l'analyse MFC contre les attentes
   */
  evaluateMFCAnalysis(analysis, expectedConfig) {
    const scoring = this.config.scoring.mfc;
    
    let score = 0;
    const checks = [];
    const feedback = [];
    
    // 1. MFC détectée
    if (!analysis.mfc_detected || !analysis.mfc_types || analysis.mfc_types.length === 0) {
      return {
        type: 'format',
        subtype: 'mfc',
        valid: false,
        score: 0,
        checks: [{ name: 'mfc_detected', passed: false, points: 0 }],
        feedback: ['Aucune mise en forme conditionnelle détectée.'],
        analysis
      };
    }
    
    checks.push({ name: 'mfc_detected', passed: true, points: scoring.detected });
    score += scoring.detected;
    
    // Trouver la MFC qui correspond le mieux à l'attendue
    const expectedType = this.normalizeMFCType(expectedConfig.mfc_type);
    const matchingMFC = analysis.mfc_types.find(
      mfc => this.normalizeMFCType(mfc.type) === expectedType
    ) || analysis.mfc_types[0];
    
    // 2. Type correct
    const actualType = this.normalizeMFCType(matchingMFC.type);
    const typeMatch = expectedType === actualType;
    checks.push({ name: 'type_correct', passed: typeMatch, points: typeMatch ? scoring.type_correct : 0 });
    if (typeMatch) {
      score += scoring.type_correct;
    } else {
      feedback.push(`Type de MFC incorrect : attendu "${expectedConfig.mfc_type}", trouvé "${matchingMFC.type}".`);
    }
    
    // 3. Couleurs correctes (selon le type)
    const colorsMatch = this.checkMFCColors(matchingMFC, expectedConfig);
    checks.push({ name: 'colors_correct', passed: colorsMatch, points: colorsMatch ? scoring.colors_correct : 0 });
    if (colorsMatch) {
      score += scoring.colors_correct;
    } else if (expectedConfig.color_scale || expectedConfig.databar || expectedConfig.cell_value) {
      feedback.push('Les couleurs de la mise en forme ne correspondent pas à l\'attendu.');
    }
    
    // 4. Emplacement correct
    const locationMatch = this.checkMFCLocation(matchingMFC, expectedConfig);
    checks.push({ name: 'location_correct', passed: locationMatch, points: locationMatch ? scoring.location_correct : 0 });
    if (locationMatch) {
      score += scoring.location_correct;
    } else if (expectedConfig.target_column) {
      feedback.push(`La MFC devrait être appliquée sur la colonne ${expectedConfig.target_column}.`);
    }
    
    // 5. Cohérence (icônes, barres, etc.)
    const coherenceMatch = this.checkMFCCoherence(matchingMFC, expectedConfig);
    checks.push({ name: 'coherence', passed: coherenceMatch, points: coherenceMatch ? scoring.coherence : 0 });
    if (coherenceMatch) {
      score += scoring.coherence;
    }
    
    // Calcul score final
    const maxScore = Object.values(scoring).reduce((a, b) => a + b, 0);
    const scorePercent = Math.round((score / maxScore) * 100);
    const valid = scorePercent >= 60; // Seuil de validation MFC
    
    return {
      type: 'format',
      subtype: 'mfc',
      valid,
      score: scorePercent,
      checks,
      feedback: feedback.length > 0 ? feedback : ['Mise en forme conditionnelle correcte !'],
      analysis,
      matchingMFC,
      confidence: analysis.confidence || 0.75
    };
  }
  
  /**
   * Normalise le type de MFC
   */
  normalizeMFCType(type) {
    if (!type) return null;
    const typeLower = type.toLowerCase();
    
    for (const [normalized, variants] of Object.entries(MFC_TYPES)) {
      if (variants.some(v => typeLower.includes(v))) {
        return normalized;
      }
    }
    return 'autre';
  }
  
  /**
   * Vérifie la correspondance des couleurs MFC
   */
  checkMFCColors(mfcAnalysis, expectedConfig) {
    if (!mfcAnalysis.details) return true; // Pas de détails = on accepte
    
    // Pour color_scale
    if (expectedConfig.color_scale) {
      const expected = expectedConfig.color_scale;
      const actual = mfcAnalysis.details.colors || [];
      
      if (expected.min_color && actual.length > 0) {
        const minMatch = this.colorsMatch(actual[0], expected.min_color);
        const maxMatch = actual.length > 1 && expected.max_color ? 
          this.colorsMatch(actual[actual.length - 1], expected.max_color) : true;
        return minMatch && maxMatch;
      }
    }
    
    // Pour databar
    if (expectedConfig.databar) {
      const expected = expectedConfig.databar;
      const actual = mfcAnalysis.details.bar_color;
      if (expected.color && actual) {
        return this.colorsMatch(actual, expected.color);
      }
    }
    
    // Pour cell_value
    if (expectedConfig.cell_value) {
      const expected = expectedConfig.cell_value;
      const actual = mfcAnalysis.details.highlight_color;
      if (expected.format?.background && actual) {
        return this.colorsMatch(actual, expected.format.background);
      }
    }
    
    return true; // Par défaut, on accepte
  }
  
  /**
   * Compare deux couleurs (avec normalisation)
   */
  colorsMatch(color1, color2) {
    if (!color1 || !color2) return false;
    const norm1 = COLOR_MAPPINGS[color1.toLowerCase()] || color1.toLowerCase();
    const norm2 = COLOR_MAPPINGS[color2.toLowerCase()] || color2.toLowerCase();
    return norm1 === norm2;
  }
  
  /**
   * Vérifie l'emplacement de la MFC
   */
  checkMFCLocation(mfcAnalysis, expectedConfig) {
    if (!expectedConfig.target_column) return true;
    
    const expected = expectedConfig.target_column.toUpperCase();
    const location = (mfcAnalysis.location || '').toUpperCase();
    
    // Vérifie si la colonne attendue est dans la location
    return location.includes(expected);
  }
  
  /**
   * Vérifie la cohérence des détails MFC
   */
  checkMFCCoherence(mfcAnalysis, expectedConfig) {
    if (!mfcAnalysis.details) return true;
    
    // Pour iconset
    if (expectedConfig.iconset) {
      const expected = expectedConfig.iconset;
      const actual = mfcAnalysis.details;
      
      if (expected.type && actual.icons_type) {
        // Vérifier le type d'icônes (arrows, traffic_lights, etc.)
        return actual.icons_type.toLowerCase().includes(expected.type.toLowerCase());
      }
      if (expected.count && actual.icons_count) {
        return actual.icons_count === expected.count;
      }
    }
    
    return true;
  }
  
  /**
   * Détermine si un checkpoint est de type MFC
   */
  isMFCCheckpoint(checkpoint) {
    const description = (checkpoint.description || '').toLowerCase();
    const keywords = ['mise en forme conditionnelle', 'mfc', 'échelle de couleurs', 'barres de données', 
                      'icônes', 'surbrillance', 'conditional formatting', 'color scale', 'databar'];
    return keywords.some(kw => description.includes(kw));
  }
  
  // ==========================================================================
  // VALIDATION FORMAT BASIQUE
  // ==========================================================================
  
  /**
   * Valide un formatage basique (couleur, bordure)
   */
  async validateBasicFormat(screenshotBase64, expectedConfig, context = {}) {
    const prompt = `Tu es un expert Excel qui analyse des captures d'écran.
Analyse cette image pour vérifier le formatage des cellules.

ÉLÉMENTS À VÉRIFIER:
${expectedConfig.description || 'Formatage général'}

Réponds UNIQUEMENT en JSON valide:
{
  "formatting_detected": true ou false,
  "details": {
    "colors_found": ["couleur1", "couleur2"],
    "borders_visible": true/false,
    "alignment": "gauche" | "centre" | "droite" | "mixte",
    "bold_text": true/false,
    "merged_cells": true/false
  },
  "matches_expected": true/false,
  "confidence": 0.0 à 1.0,
  "issues": []
}`;

    const analysis = await this.analyzeWithVision(screenshotBase64, prompt);
    
    if (!analysis || analysis.error) {
      return {
        type: 'format',
        valid: false,
        score: 0,
        error: analysis?.error || 'Erreur analyse',
        analysis: null
      };
    }
    
    const valid = analysis.matches_expected !== false;
    return {
      type: 'format',
      valid,
      score: valid ? 100 : 50,
      analysis,
      confidence: analysis.confidence || 0.7
    };
  }
  
  // ==========================================================================
  // MÉTHODES UTILITAIRES
  // ==========================================================================
  
  /**
   * Prétraite l'image avant analyse
   */
  async preprocessImage(base64Data) {
    try {
      // Vérifier la présence de données
      if (!base64Data) {
        return { valid: false, error: 'Aucune image fournie' };
      }
      
      // Extraire le type MIME si présent
      let imageData = base64Data;
      let mimeType = 'image/png'; // Par défaut
      
      if (base64Data.includes('data:')) {
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          imageData = matches[2];
        }
      }
      
      // Vérifier le format
      if (!this.config.supportedFormats.includes(mimeType)) {
        return { 
          valid: false, 
          error: `Format non supporté: ${mimeType}. Formats acceptés: PNG, JPEG, WebP, GIF` 
        };
      }
      
      // Vérifier la taille (approximation base64)
      const sizeBytes = (imageData.length * 3) / 4;
      if (sizeBytes > this.config.maxImageSize) {
        return { 
          valid: false, 
          error: `Image trop grande (${Math.round(sizeBytes / 1024 / 1024)}MB). Maximum: 5MB` 
        };
      }
      
      return {
        valid: true,
        base64: imageData,
        mimeType,
        sizeBytes
      };
    } catch (error) {
      return { valid: false, error: `Erreur prétraitement: ${error.message}` };
    }
  }
  
  /**
   * Appelle Claude Vision pour analyser l'image
   */
  async analyzeWithVision(imageBase64, prompt) {
    try {
      // Si pas de client Claude, simuler pour les tests
      if (!this.claude) {
        console.warn('VisualValidationService: Pas de client Claude, retour mock');
        return this.getMockAnalysis(prompt);
      }
      
      const response = await this.claude.messages.create({
        model: this.config.defaultModel,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      });
      
      // Parser la réponse JSON
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent) {
        return { error: 'Pas de réponse texte' };
      }
      
      return this.parseVisionResponse(textContent.text);
    } catch (error) {
      console.error('Erreur Claude Vision:', error);
      return { error: error.message };
    }
  }
  
  /**
   * Parse la réponse JSON de Vision
   */
  parseVisionResponse(responseText) {
    try {
      // Nettoyer le texte (enlever markdown si présent)
      let cleanText = responseText.trim();
      
      // Enlever les blocs de code markdown
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      
      cleanText = cleanText.trim();
      
      // Parser le JSON
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Erreur parsing réponse Vision:', error);
      console.error('Texte reçu:', responseText);
      return { 
        error: 'Réponse non JSON',
        rawText: responseText 
      };
    }
  }
  
  /**
   * Retourne une analyse mock pour les tests
   */
  getMockAnalysis(prompt) {
    if (prompt.includes('graphique')) {
      return {
        graph_detected: true,
        graph_type: 'histogramme',
        has_title: true,
        title_text: 'Ventes par région',
        has_legend: true,
        legend_items: ['2024', '2025'],
        data_series_count: 2,
        categories_count: 4,
        categories_visible: ['Nord', 'Sud', 'Est', 'Ouest'],
        axis_labels: { x: 'Région', y: 'CA (€)' },
        colors_used: ['bleu', 'orange'],
        data_visible: true,
        confidence: 0.85,
        issues: []
      };
    } else if (prompt.includes('MFC') || prompt.includes('conditionnelle')) {
      return {
        mfc_detected: true,
        mfc_types: [
          {
            type: 'color_scale',
            location: 'D2:D100',
            details: {
              colors: ['vert', 'jaune', 'rouge'],
              gradient_visible: true
            }
          }
        ],
        cells_formatted_count: 98,
        columns_with_mfc: ['D'],
        confidence: 0.80,
        issues: []
      };
    }
    
    return {
      formatting_detected: true,
      details: {
        colors_found: ['bleu', 'blanc'],
        borders_visible: true,
        alignment: 'centre',
        bold_text: false,
        merged_cells: false
      },
      matches_expected: true,
      confidence: 0.75,
      issues: []
    };
  }
  
  /**
   * Calcule le score global des validations visuelles
   */
  computeGlobalScore(results) {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    return Math.round(totalScore / results.length);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  VisualValidationService,
  CONFIG,
  GRAPH_TYPES,
  MFC_TYPES,
  COLOR_MAPPINGS
};
