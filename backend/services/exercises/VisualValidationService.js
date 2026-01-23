/**
 * VISUAL VALIDATION SERVICE - v1.0
 * 
 * Valide les éléments visuels (graphiques, MFC, tableaux de bord)
 * en utilisant Claude Vision pour analyser des screenshots.
 * 
 * FLUX :
 * 1. Recevoir screenshot (base64 ou URL)
 * 2. Construire prompt avec critères visuels attendus
 * 3. Appeler Claude Vision
 * 4. Parser la réponse structurée
 * 5. Retourner score + feedback détaillé
 */

// ═══════════════════════════════════════════════════════════════════════════
// CRITÈRES VISUELS PAR TYPE DE GRAPHIQUE
// ═══════════════════════════════════════════════════════════════════════════

const GRAPH_CRITERIA = {
    // Graphiques de base (compétence 21)
    camembert: {
      nom: 'Graphique en secteurs (camembert)',
      criteres_obligatoires: [
        { id: 'type_correct', description: 'Le graphique est bien un camembert/secteurs', points: 20 },
        { id: 'donnees_completes', description: 'Toutes les catégories sont représentées', points: 20 },
        { id: 'etiquettes', description: 'Les étiquettes de données sont visibles (% ou valeurs)', points: 15 },
        { id: 'legende', description: 'Une légende est présente et lisible', points: 15 },
        { id: 'titre', description: 'Le graphique a un titre descriptif', points: 15 }
      ],
      criteres_bonus: [
        { id: 'couleurs', description: 'Les couleurs sont distinctes et professionnelles', points: 5 },
        { id: 'mise_en_forme', description: 'La mise en forme est soignée (pas de chevauchement)', points: 5 },
        { id: 'explosion', description: 'Un secteur est mis en évidence si pertinent', points: 5 }
      ]
    },
    
    histogramme: {
      nom: 'Histogramme / Graphique en barres',
      criteres_obligatoires: [
        { id: 'type_correct', description: 'Le graphique est bien un histogramme ou barres', points: 20 },
        { id: 'axes_corrects', description: 'Les axes X et Y sont correctement définis', points: 15 },
        { id: 'donnees_completes', description: 'Toutes les données sont représentées', points: 20 },
        { id: 'echelle', description: "L'échelle de l'axe Y est appropriée", points: 15 },
        { id: 'titre', description: 'Le graphique a un titre descriptif', points: 15 }
      ],
      criteres_bonus: [
        { id: 'etiquettes_donnees', description: 'Les valeurs sont affichées sur les barres', points: 5 },
        { id: 'quadrillage', description: 'Le quadrillage aide à la lecture', points: 5 },
        { id: 'couleurs', description: 'Les couleurs sont cohérentes et professionnelles', points: 5 }
      ]
    },
    
    courbe: {
      nom: 'Graphique en courbes / lignes',
      criteres_obligatoires: [
        { id: 'type_correct', description: 'Le graphique est bien une courbe/ligne', points: 20 },
        { id: 'axes_corrects', description: 'Les axes sont correctement étiquetés', points: 15 },
        { id: 'tendance_visible', description: 'La tendance est clairement visible', points: 20 },
        { id: 'points_donnees', description: 'Les points de données sont identifiables', points: 15 },
        { id: 'titre', description: 'Le graphique a un titre descriptif', points: 15 }
      ],
      criteres_bonus: [
        { id: 'marqueurs', description: 'Les marqueurs sont visibles sur la courbe', points: 5 },
        { id: 'courbe_tendance', description: 'Une courbe de tendance est ajoutée si pertinent', points: 5 },
        { id: 'legende', description: 'La légende est claire pour plusieurs séries', points: 5 }
      ]
    },
    
    // Graphiques avancés (compétence 31)
    combine: {
      nom: 'Graphique combiné (barres + ligne)',
      criteres_obligatoires: [
        { id: 'deux_types', description: 'Le graphique combine bien 2 types (barres + ligne)', points: 25 },
        { id: 'axe_secondaire', description: "Un axe secondaire est utilisé si les échelles diffèrent", points: 20 },
        { id: 'lisibilite', description: 'Les deux séries sont clairement distinguables', points: 20 },
        { id: 'legende', description: 'La légende identifie chaque série', points: 15 },
        { id: 'titre', description: 'Le graphique a un titre descriptif', points: 10 }
      ],
      criteres_bonus: [
        { id: 'couleurs_contrastees', description: 'Les couleurs créent un bon contraste', points: 5 },
        { id: 'etiquettes', description: 'Les étiquettes de données sont présentes', points: 5 }
      ]
    },
    
    sparklines: {
      nom: 'Sparklines (mini-graphiques)',
      criteres_obligatoires: [
        { id: 'presence', description: 'Les sparklines sont présentes dans les cellules', points: 30 },
        { id: 'type_adapte', description: 'Le type de sparkline est adapté (ligne/colonne/win-loss)', points: 25 },
        { id: 'donnees_correctes', description: 'Les sparklines reflètent les bonnes données', points: 25 },
        { id: 'lisibilite', description: 'Les sparklines sont lisibles malgré leur taille', points: 20 }
      ],
      criteres_bonus: [
        { id: 'points_remarquables', description: 'Les points hauts/bas sont mis en évidence', points: 5 },
        { id: 'coherence', description: 'Toutes les sparklines ont le même style', points: 5 }
      ]
    },
    
    // Graphiques dynamiques (compétence 45)
    dynamique: {
      nom: 'Graphique dynamique avec contrôles',
      criteres_obligatoires: [
        { id: 'graphique_present', description: 'Un graphique est présent', points: 20 },
        { id: 'controles', description: 'Des contrôles de filtre sont visibles (segments, chronologie)', points: 25 },
        { id: 'interactivite', description: 'Le graphique semble lié à un tableau croisé dynamique', points: 25 },
        { id: 'lisibilite', description: 'Le graphique est lisible et professionnel', points: 15 },
        { id: 'titre', description: 'Le graphique a un titre descriptif', points: 10 }
      ],
      criteres_bonus: [
        { id: 'segments_multiples', description: 'Plusieurs segments permettent des filtres', points: 5 },
        { id: 'mise_en_page', description: 'La mise en page est professionnelle', points: 5 }
      ]
    }
  };
  
  // Critères pour Mise en Forme Conditionnelle (compétence 22/32)
  const MFC_CRITERIA = {
    basique: {
      nom: 'Mise en forme conditionnelle basique',
      criteres_obligatoires: [
        { id: 'presence', description: 'La MFC est appliquée sur les bonnes cellules', points: 25 },
        { id: 'regle_correcte', description: 'La règle appliquée correspond à la consigne', points: 30 },
        { id: 'couleurs_distinctes', description: 'Les couleurs distinguent bien les valeurs', points: 20 },
        { id: 'lisibilite', description: 'Le texte reste lisible avec la MFC', points: 15 }
      ],
      criteres_bonus: [
        { id: 'coherence', description: 'La MFC est cohérente sur toute la plage', points: 5 },
        { id: 'professionnalisme', description: 'Les couleurs sont professionnelles', points: 5 }
      ]
    },
    
    avancee: {
      nom: 'Mise en forme conditionnelle avancée',
      criteres_obligatoires: [
        { id: 'barres_donnees', description: 'Des barres de données ou jeux d\'icônes sont utilisés', points: 25 },
        { id: 'echelle_couleurs', description: "L'échelle de couleurs est appropriée", points: 25 },
        { id: 'regles_multiples', description: 'Plusieurs règles sont combinées si nécessaire', points: 20 },
        { id: 'priorite', description: 'La priorité des règles est correcte', points: 15 }
      ],
      criteres_bonus: [
        { id: 'formules', description: 'Des formules personnalisées sont utilisées', points: 10 },
        { id: 'icones', description: 'Les jeux d\'icônes sont pertinents', points: 5 }
      ]
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICE DE VALIDATION VISUELLE
  // ═══════════════════════════════════════════════════════════════════════════
  
  class VisualValidationService {
    constructor() {
      this.apiKey = process.env.ANTHROPIC_API_KEY;
    }
  
    /**
     * Valide un screenshot de graphique
     * 
     * @param {Object} options
     * @param {string} options.screenshotBase64 - Image en base64
     * @param {string} options.graphType - Type de graphique attendu (camembert, histogramme, etc.)
     * @param {Object} options.expectedData - Données attendues dans le graphique
     * @param {Array} options.customCriteria - Critères personnalisés additionnels
     * @returns {Promise<Object>} { score, passed, feedback, details }
     */
    async validateGraph(options) {
      const {
        screenshotBase64,
        graphType,
        expectedData = {},
        customCriteria = []
      } = options;
  
      if (!screenshotBase64) {
        return {
          score: 0,
          passed: false,
          feedback: "Aucun screenshot fourni. Pour valider un graphique, tu dois capturer une image de ton travail.",
          details: [],
          needsScreenshot: true
        };
      }
  
      // Récupérer les critères pour ce type de graphique
      const criteria = GRAPH_CRITERIA[graphType] || GRAPH_CRITERIA.histogramme;
      
      // Construire le prompt pour Claude Vision
      const prompt = this.buildValidationPrompt(criteria, expectedData, customCriteria);
      
      try {
        // Appeler Claude Vision
        const response = await this.callClaudeVision(screenshotBase64, prompt);
        
        // Parser la réponse
        return this.parseValidationResponse(response, criteria);
        
      } catch (error) {
        console.error('❌ [VisualValidation] Erreur:', error.message);
        return {
          score: 0,
          passed: false,
          feedback: `Erreur lors de l'analyse visuelle: ${error.message}`,
          details: [],
          error: true
        };
      }
    }
  
    /**
     * Valide une mise en forme conditionnelle
     */
    async validateMFC(options) {
      const {
        screenshotBase64,
        mfcType = 'basique',
        expectedRules = [],
        customCriteria = []
      } = options;
  
      if (!screenshotBase64) {
        return {
          score: 0,
          passed: false,
          feedback: "Aucun screenshot fourni. Pour valider la mise en forme conditionnelle, capture une image de ton tableau.",
          details: [],
          needsScreenshot: true
        };
      }
  
      const criteria = MFC_CRITERIA[mfcType] || MFC_CRITERIA.basique;
      const prompt = this.buildMFCPrompt(criteria, expectedRules, customCriteria);
      
      try {
        const response = await this.callClaudeVision(screenshotBase64, prompt);
        return this.parseValidationResponse(response, criteria);
      } catch (error) {
        console.error('❌ [VisualValidation] Erreur MFC:', error.message);
        return {
          score: 0,
          passed: false,
          feedback: `Erreur lors de l'analyse: ${error.message}`,
          details: [],
          error: true
        };
      }
    }
  
    /**
     * Construit le prompt de validation pour Claude Vision
     */
    buildValidationPrompt(criteria, expectedData, customCriteria) {
      const allCriteria = [
        ...criteria.criteres_obligatoires,
        ...criteria.criteres_bonus,
        ...customCriteria
      ];
  
      let prompt = `Tu es un expert Excel qui évalue un graphique créé par un apprenant.
  
  ## TYPE DE GRAPHIQUE ATTENDU
  ${criteria.nom}
  
  ## DONNÉES ATTENDUES
  ${expectedData.description || 'Non spécifiées'}
  ${expectedData.values ? `Valeurs clés : ${JSON.stringify(expectedData.values)}` : ''}
  ${expectedData.categories ? `Catégories : ${expectedData.categories.join(', ')}` : ''}
  
  ## CRITÈRES À ÉVALUER
  
  ${allCriteria.map((c, i) => `${i + 1}. **${c.description}** (${c.points} points)`).join('\n')}
  
  ## FORMAT DE RÉPONSE (JSON STRICT)
  
  Réponds UNIQUEMENT avec un JSON valide :
  
  \`\`\`json
  {
    "score_total": [0-100],
    "criteres": [
      {
        "id": "${allCriteria[0]?.id || 'critere_1'}",
        "valide": true/false,
        "points_obtenus": [0-${allCriteria[0]?.points || 20}],
        "commentaire": "Explication courte"
      }
    ],
    "feedback_global": "Feedback encourageant et constructif en 2-3 phrases",
    "points_forts": ["Point fort 1", "Point fort 2"],
    "ameliorations": ["Amélioration suggérée 1", "Amélioration suggérée 2"]
  }
  \`\`\`
  
  IMPORTANT :
  - Sois précis dans ton évaluation
  - Donne des feedback constructifs et encourageants
  - Si le graphique est absent ou illisible, score = 0`;
  
      return prompt;
    }
  
    /**
     * Construit le prompt pour la MFC
     */
    buildMFCPrompt(criteria, expectedRules, customCriteria) {
      const allCriteria = [
        ...criteria.criteres_obligatoires,
        ...criteria.criteres_bonus,
        ...customCriteria
      ];
  
      let rulesDescription = '';
      if (expectedRules.length > 0) {
        rulesDescription = `\n## RÈGLES ATTENDUES\n${expectedRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
      }
  
      return `Tu es un expert Excel qui évalue une mise en forme conditionnelle.
  
  ## TYPE
  ${criteria.nom}
  ${rulesDescription}
  
  ## CRITÈRES À ÉVALUER
  
  ${allCriteria.map((c, i) => `${i + 1}. **${c.description}** (${c.points} points)`).join('\n')}
  
  ## FORMAT DE RÉPONSE (JSON STRICT)
  
  \`\`\`json
  {
    "score_total": [0-100],
    "criteres": [
      {
        "id": "critere_id",
        "valide": true/false,
        "points_obtenus": [0-X],
        "commentaire": "Explication"
      }
    ],
    "feedback_global": "Feedback constructif",
    "points_forts": ["..."],
    "ameliorations": ["..."]
  }
  \`\`\``;
    }
  
    /**
     * Appelle Claude Vision avec l'image
     */
    async callClaudeVision(base64Image, prompt) {
      if (!this.apiKey) {
        throw new Error('ANTHROPIC_API_KEY non définie');
      }
  
      // Détecter le type MIME
      let mediaType = 'image/png';
      if (base64Image.startsWith('/9j/')) {
        mediaType = 'image/jpeg';
      } else if (base64Image.startsWith('R0lGOD')) {
        mediaType = 'image/gif';
      } else if (base64Image.startsWith('UklGR')) {
        mediaType = 'image/webp';
      }
  
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Image.replace(/^data:image\/\w+;base64,/, '')
                  }
                },
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API Error ${response.status}`);
      }
  
      const data = await response.json();
      return data.content[0].text;
    }
  
    /**
     * Parse la réponse de validation
     */
    parseValidationResponse(responseText, criteria) {
      try {
        // Extraire le JSON de la réponse
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                          responseText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          throw new Error('Pas de JSON dans la réponse');
        }
  
        const result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        
        // Calculer si réussi (seuil à 70%)
        const passed = result.score_total >= 70;
        
        // Construire le feedback
        let feedback = result.feedback_global || '';
        
        if (result.points_forts?.length > 0) {
          feedback += '\n\n✅ **Points forts** : ' + result.points_forts.join(', ');
        }
        
        if (!passed && result.ameliorations?.length > 0) {
          feedback += '\n\n💡 **Pour améliorer** : ' + result.ameliorations.join(', ');
        }
  
        return {
          score: result.score_total,
          passed,
          feedback,
          details: result.criteres || [],
          points_forts: result.points_forts || [],
          ameliorations: result.ameliorations || []
        };
  
      } catch (error) {
        console.error('❌ [VisualValidation] Erreur parsing:', error.message);
        
        // Fallback : essayer d'extraire au moins un score
        const scoreMatch = responseText.match(/score["\s:]+(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
        
        return {
          score,
          passed: score >= 70,
          feedback: "L'analyse visuelle a été effectuée mais le résultat est partiel.",
          details: [],
          parseError: true
        };
      }
    }
  
    /**
     * Génère les checkpoints pour un exercice graphique
     */
    generateGraphCheckpoints(graphType, expectedData = {}) {
      const criteria = GRAPH_CRITERIA[graphType] || GRAPH_CRITERIA.histogramme;
      
      return {
        id: `cp_graph_${graphType}`,
        type: 'graphique',
        description: `Créer un ${criteria.nom}`,
        validation_type: 'visual',
        graph_type: graphType,
        expected_data: expectedData,
        criteria: criteria.criteres_obligatoires,
        bonus_criteria: criteria.criteres_bonus,
        points: 100,
        requires_screenshot: true,
        indices: [
          `Sélectionne tes données et va dans Insertion > Graphiques`,
          `Choisis le type "${criteria.nom}" et vérifie que toutes tes données sont incluses`,
          `Ajoute un titre via "Éléments de graphique" et formate les étiquettes`
        ]
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const visualValidationService = new VisualValidationService();
  
  export {
    VisualValidationService,
    GRAPH_CRITERIA,
    MFC_CRITERIA
  };
  
  export default visualValidationService;