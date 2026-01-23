import logger from '@/lib/logger';
/**
 * DYNAMIC EXERCISE GENERATOR V2
 * 
 * Orchestrateur principal pour la génération d'exercices Socrate.
 * 
 * COMPATIBILITÉ V1 :
 * - Export d'une INSTANCE (pas une classe)
 * - Méthode generateSmart() compatible avec la route existante
 * - Retourne l'exercice directement (pas { exercise, excelBuffer })
 * 
 * FLUX V2 (refonte janvier 2026) :
 * 1. Sélection compétence + contexte utilisateur
 * 2. Chargement VRAIS datasets selon métier + progression (RealDatasetLoader)
 * 3. Calcul des stats (ComputationEngine)
 * 4. Appel Claude avec prompt optimisé (OptimizedPromptBuilderV2)
 * 5. Enrichissement checkpoints avec expected_value (ComputationEngine)
 * 6. Génération fichier Excel (ExerciseBuilderV2)
 * 
 * PRINCIPES :
 * - VRAIES données selon le métier (finance ≠ marketing ≠ RH)
 * - Progression intra-compétence (plus d'exercices réussis = plus complexe)
 * - Claude CONÇOIT (structure, contexte, computation.type)
 * - Le CODE CALCULE (expected_value, tolerance)
 */

import { buildOptimizedPrompt, buildFeedbackPrompt, selectManager, selectEntreprise } from './OptimizedPromptBuilderV2.js';
import { enrichCheckpoints, computeDatasetStats, formatStatsForPrompt } from './ComputationEngine.js';
import { generateSalesData, generateHRData, generateFinanceData, generateBudgetData } from './CoherentDataGenerator.js';
import { buildExerciseWorkbook } from './ExerciseBuilderV2.js';
import { findCompetenceById, findCompetence } from '../../../shared/data/competencesExcel.js';
import { getValidationInfo, isFullyAutomatable } from './CompetenceValidationMap.js';
import SocrateBrain from '../socrate/SocrateBrain.js';
import RealDatasetLoader from './RealDatasetLoader.js';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Nombre de lignes par défaut selon le niveau
  rowCounts: {
    debutant: 30,
    intermediaire: 100,
    avance: 200
  },
  
  // Mapping compétence → type de données
  competenceDataTypes: {
    // Formules basiques → données budget ou ventes simples
    3: 'budget',   // SOMME
    4: 'budget',   // MOYENNE
    5: 'budget',   // MIN/MAX
    9: 'budget',   // SI simple
    
    // Fonctions conditionnelles → données ventes
    11: 'ventes',  // NB.SI
    12: 'ventes',  // NB.SI.ENS
    13: 'ventes',  // SOMME.SI
    14: 'ventes',  // SOMME.SI.ENS
    
    // Recherches → données ventes (multi-tables)
    18: 'ventes',  // RECHERCHEV
    24: 'ventes',  // INDEX+EQUIV
    
    // Avancé → données finance ou ventes
    15: 'ventes',  // Références absolues
    16: 'finance', // SI imbriqués
    28: 'finance'  // SOMMEPROD
  },
  
  // Timeout Claude
  claudeTimeout: 60000,
  
  // Retry
  maxRetries: 2
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

class DynamicExerciseGeneratorV2 {
  constructor(options = {}) {
    this.anthropic = options.anthropic || null; // Client Anthropic
    this.brain = options.brain || SocrateBrain;
  }
  
  /**
   * POINT D'ENTRÉE COMPATIBLE V1
   * Méthode appelée par la route existante
   * 
   * @param {Object} options
   * @param {string} options.userId
   * @param {string} options.competence - nom de la compétence
   * @param {string} options.type - discovery | consolidation | remediation | autonomy
   * @returns {Promise<Object>} Exercice complet (structure compatible V1)
   */
  async generateSmart(options) {
    const { userId, competence, type = 'consolidation' } = options;
    
    console.log(`\n🎯 [GeneratorV2] generateSmart - Compétence: ${competence}, Type: ${type}`);
    
    try {
      // Essayer la génération V2 avec Claude (si client disponible)
      if (this.anthropic && this.anthropic.messages) {
        try {
          console.log('🤖 [GeneratorV2] Client Claude disponible, génération dynamique...');
          const result = await this.generate({
            competence,
            userId,
            exerciseType: type
          });
          
          // Retourner l'exercice directement (compatible V1)
          return result.exercise;
          
        } catch (claudeError) {
          console.error('⚠️ [GeneratorV2] Erreur Claude, fallback:', claudeError.message);
        }
      } else {
        console.log('⚠️ [GeneratorV2] Client Claude non disponible, fallback...');
      }
      
      // Fallback : génération sans Claude
      return await this.generateFallback({
        competence,
        userId,
        exerciseType: type
      });
      
    } catch (error) {
      console.error('❌ [GeneratorV2] Erreur génération:', error);
      throw error;
    }
  }
  
  /**
   * Génère un exercice complet (méthode interne V2)
   * @param {Object} params
   * @param {number|string} params.competence - ID ou nom de la compétence
   * @param {string} params.userId - ID de l'utilisateur
   * @param {string} params.exerciseType - discovery | consolidation | remediation | autonomy
   * @param {Object} params.options - Options supplémentaires
   * @returns {Promise<Object>} { exercise, excelBuffer, stats }
   */
  async generate(params) {
    const {
      competence,
      userId,
      exerciseType = 'consolidation',
      options = {}
    } = params;
    
    console.log(`\n🎯 [GeneratorV2] Début génération - Compétence: ${competence}, Type: ${exerciseType}`);
    
    try {
      // 1. Récupérer les infos de compétence
      const compInfo = typeof competence === 'number'
        ? findCompetenceById(competence)
        : findCompetence(competence);
      
      if (!compInfo) {
        throw new Error(`Compétence non trouvée: ${competence}`);
      }
      
      console.log(`📚 [GeneratorV2] Compétence: ${compInfo.nom} (ID: ${compInfo.id})`);
      
      // 2. Charger l'état de l'apprenant
      const learnerState = userId 
        ? await this.brain.loadLearnerState(userId)
        : null;
      
      const niveau = learnerState?.profile?.niveau || this.getNiveauFromCompetence(compInfo);
      const metier = learnerState?.profile?.contexte_metier || options.metier || 'ventes';
      
      // 3. NOUVEAU : Calculer la progression sur CETTE compétence
      const exercicesReussis = this.getCompetenceProgress(learnerState, compInfo.id);
      
      console.log(`👤 [GeneratorV2] Profil: niveau=${niveau}, métier=${metier}, exercicesReussis=${exercicesReussis} sur compétence ${compInfo.id}`);
      
      // 4. NOUVEAU : Charger les VRAIS datasets selon métier + progression
      let data;
      try {
        data = await RealDatasetLoader.loadForContext({
          metier,
          competenceId: compInfo.id,
          exercicesReussis,
          exerciseType
        });
        console.log(`📊 [GeneratorV2] Dataset RÉEL chargé: ${data.metadata.source}, ${data.rows.length} lignes (${data.metadata.progressionLevel})`);
      } catch (datasetError) {
        console.warn(`⚠️ [GeneratorV2] Erreur chargement dataset réel, fallback:`, datasetError.message);
        // Fallback sur les données générées
        const dataType = CONFIG.competenceDataTypes[compInfo.id] || 'ventes';
        const nbRows = CONFIG.rowCounts[niveau] || 100;
        data = this.generateCoherentData(dataType, { nbRows, metier, niveau });
        data.metadata = { source: 'generated', progressionLevel: 'fallback' };
      }
      
      // 5. Calculer les statistiques
      const stats = computeDatasetStats(data.headers, data.rows);
      stats.metadata = data.metadata;
      stats.vocabulary = data.metadata?.vocabulary || [];
      stats.progressionLevel = data.metadata?.progressionLevel || 'standard';
      stats.keyMetrics = data.metadata?.keyMetrics || [];
      
      // 6. Construire le prompt et appeler Claude
      const exercise = await this.generateWithClaude({
        compInfo,
        stats,
        learnerState,
        exerciseType,
        metier,
        progressionLevel: stats.progressionLevel,
        exercicesReussis
      });
      
      // 7. Enrichir les checkpoints avec expected_value
      const enrichedCheckpoints = enrichCheckpoints(
        exercise.checkpoints,
        { headers: data.headers, rows: data.rows },
        data.catalogues || {}
      );
      
      exercise.checkpoints = enrichedCheckpoints;
      
      // Vérifier que les calculs ont réussi
      const computationSuccess = enrichedCheckpoints.filter(cp => cp.computation_success).length;
      console.log(`🔢 [GeneratorV2] Checkpoints enrichis: ${computationSuccess}/${enrichedCheckpoints.length} calculés`);
      
      // 8. Ajouter les données à l'exercice (structure compatible V1)
      exercise.donnees = {
        headers: data.headers,
        rows: data.rows
      };
      
      // Ajouter métadonnées enrichies
      exercise.dataset_source = data.metadata?.source || 'unknown';
      exercise.progression_level = stats.progressionLevel;
      exercise.generated_at = new Date().toISOString();
      exercise.generated_for = userId;
      exercise.metier = metier;
      exercise.exercices_reussis_competence = exercicesReussis;
      
      // 9. Générer le fichier Excel
      let excelBuffer = null;
      try {
        excelBuffer = await buildExerciseWorkbook(exercise, {
          includeInstructions: true,
          includeSocrate: true
        });
      } catch (excelError) {
        console.warn('⚠️ [GeneratorV2] Erreur Excel (non bloquant):', excelError.message);
      }
      
      console.log(`✅ [GeneratorV2] Exercice généré: "${exercise.titre}" (${stats.progressionLevel}, ${data.rows.length} lignes)`);
      
      return {
        exercise,
        excelBuffer,
        stats: {
          competence_id: compInfo.id,
          competence_nom: compInfo.nom,
          niveau,
          metier,
          progressionLevel: stats.progressionLevel,
          exercicesReussis,
          nbRows: data.rows.length,
          nbCheckpoints: exercise.checkpoints.length,
          computationSuccess,
          datasetSource: data.metadata?.source
        }
      };
      
    } catch (error) {
      console.error('❌ [GeneratorV2] Erreur:', error);
      throw error;
    }
  }
  
  /**
   * NOUVEAU : Récupère le nombre d'exercices réussis sur une compétence
   */
  getCompetenceProgress(learnerState, competenceId) {
    if (!learnerState || !learnerState.competences) {
      return 0;
    }
    
    // Chercher dans l'état de l'apprenant
    const compState = learnerState.competences[competenceId];
    if (compState && typeof compState.exercicesReussis === 'number') {
      return compState.exercicesReussis;
    }
    
    // Alternative : calculer depuis le niveau de maîtrise
    if (compState && typeof compState.niveau === 'number') {
      // niveau 0-100 → approximer le nombre d'exercices
      return Math.floor(compState.niveau / 15); // ~7 exercices pour maîtrise complète
    }
    
    return 0;
  }
  
  /**
   * Génère les données cohérentes selon le type
   */
  generateCoherentData(dataType, options = {}) {
    const { nbRows = 100, metier, niveau } = options;
    
    switch (dataType) {
      case 'ventes':
        return generateSalesData({ nbRows });
        
      case 'budget':
        return generateBudgetData();
        
      case 'rh':
        return generateHRData({ nbRows });
        
      case 'finance':
        return generateFinanceData({ nbRows });
        
      default:
        return generateSalesData({ nbRows });
    }
  }
  
  /**
   * Appelle Claude pour générer la structure de l'exercice
   */
  async generateWithClaude({ compInfo, stats, learnerState, exerciseType, metier }) {
    // Si pas de client Anthropic, utiliser le fallback
    if (!this.anthropic || !this.anthropic.messages) {
      console.log('⚠️ [GeneratorV2] Pas de client Anthropic, génération fallback');
      return this.generateFallbackExercise(compInfo, stats, exerciseType);
    }
    
    // Construire le prompt optimisé
    const prompt = buildOptimizedPrompt({
      competence: compInfo,
      stats,
      learnerState,
      exerciseType,
      metier
    });
    
    console.log(`🤖 [GeneratorV2] Appel Claude (${prompt.length} chars)`);
    
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });
      
      // Parser la réponse JSON
      const content = response.content[0].text;
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Pas de JSON dans la réponse Claude');
      }
      
      const exercise = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // Valider la structure (avec stats pour validation des plages)
      this.validateExerciseStructure(exercise, compInfo, stats);
      
      console.log(`✅ [GeneratorV2] Exercice généré par Claude: "${exercise.titre || exercise.id}"`);
      
      return exercise;
      
    } catch (error) {
      console.error('❌ [GeneratorV2] Erreur Claude:', error.message);
      // Fallback
      return this.generateFallbackExercise(compInfo, stats, exerciseType);
    }
  }
  
  /**
   * Génère un exercice basique sans Claude (fallback)
   */
  generateFallbackExercise(compInfo, stats, exerciseType) {
    console.log('🔧 [GeneratorV2] Génération fallback pour', compInfo.nom);
    
    const id = `ex_${compInfo.id}_${Date.now()}`;
    
    // Trouver les colonnes numériques et texte
    const numericCols = [];
    const textCols = [];
    
    for (const [name, col] of Object.entries(stats.columns || {})) {
      if (col.type === 'number') {
        numericCols.push({ name, ...col });
      } else {
        textCols.push({ name, ...col });
      }
    }
    
    // Générer des checkpoints basiques selon la compétence
    const checkpoints = this.generateBasicCheckpoints(compInfo, numericCols, textCols, stats);
    
    return {
      id,
      titre: `Exercice ${compInfo.nom}`,
      description: `Exercice d'entraînement sur ${compInfo.nom}`,
      niveau: this.getNiveauFromCompetence(compInfo),
      competences: [compInfo.nom],
      competence_ids: [compInfo.id],
      
      contexte: {
        situation: `Exercice d'entraînement sur ${compInfo.nom}.`,
        manager: {
          nom: 'Socrate',
          poste: 'Tuteur Excel',
          demande: `Utilise la fonction ${compInfo.nom} pour analyser les données.`
        },
        enjeux: 'Maîtriser cette fonction essentielle.',
        deadline: 'À ton rythme'
      },
      
      // Compatible V1 : description_donnees au lieu de presentation_donnees
      description_donnees: `Dataset de ${stats.rowCount} lignes avec colonnes: ${Object.keys(stats.columns || {}).join(', ')}.`,
      
      instructions: [
        `Utilise ${compInfo.nom} pour analyser les données`,
        'Vérifie tes résultats avant de soumettre'
      ],
      
      checkpoints,
      
      // Normaliser les points à 100
      total_points: 100
    };
  }
  
  /**
   * Génère des checkpoints basiques selon la compétence
   */
  generateBasicCheckpoints(compInfo, numericCols, textCols, stats) {
    const checkpoints = [];
    const numCol = numericCols[0];
    const textCol = textCols[0];
    
    if (!numCol) {
      // Pas de colonne numérique - checkpoint minimal
      checkpoints.push({
        id: 'cp1',
        cellule: 'A1',
        type: 'valeur',
        description: 'Vérification',
        points: 100,
        indice_1: 'Suis les instructions',
        indice_2: 'Vérifie ta formule',
        indice_3: `Utilise ${compInfo.nom}`
      });
      return checkpoints;
    }
    
    // Checkpoint selon la compétence
    switch (compInfo.id) {
      case 3: // SOMME
        checkpoints.push({
          id: 'cp1',
          cellule: `${numCol.letter || 'B'}${(stats.rowCount || 50) + 2}`,
          type: 'formule',
          description: `Total ${numCol.name}`,
          fonction: 'SOMME',
          pattern: ['SOMME'],
          computation: { type: 'sum', column: numCol.name },
          points: 100,
          indice_1: 'Utilise la fonction SOMME',
          indice_2: `Sélectionne toute la colonne ${numCol.name}`,
          indice_3: `=SOMME(${numCol.letter || 'B'}2:${numCol.letter || 'B'}${(stats.rowCount || 50) + 1})`
        });
        break;
        
      case 4: // MOYENNE
        checkpoints.push({
          id: 'cp1',
          cellule: `${numCol.letter || 'B'}${(stats.rowCount || 50) + 2}`,
          type: 'formule',
          description: `Moyenne ${numCol.name}`,
          fonction: 'MOYENNE',
          pattern: ['MOYENNE'],
          computation: { type: 'average', column: numCol.name },
          points: 100,
          indice_1: 'Utilise la fonction MOYENNE',
          indice_2: `Sélectionne toute la colonne ${numCol.name}`,
          indice_3: `=MOYENNE(${numCol.letter || 'B'}2:${numCol.letter || 'B'}${(stats.rowCount || 50) + 1})`
        });
        break;
        
      case 11: // NB.SI
      case 13: // SOMME.SI
        if (textCol) {
          const criteria = textCol.uniqueValues?.[0] || 'Valeur';
          const funcName = compInfo.id === 11 ? 'NB.SI' : 'SOMME.SI';
          const computeType = compInfo.id === 11 ? 'countif' : 'sumif';
          
          checkpoints.push({
            id: 'cp1',
            cellule: `${numCol.letter || 'B'}${(stats.rowCount || 50) + 2}`,
            type: 'formule',
            description: `${funcName} pour "${criteria}"`,
            fonction: funcName,
            pattern: [funcName],
            computation: compInfo.id === 11 
              ? { type: computeType, column: textCol.name, criteria }
              : { type: computeType, criteria_column: textCol.name, criteria, sum_column: numCol.name },
            points: 100,
            indice_1: `Utilise la fonction ${funcName}`,
            indice_2: `Le critère est "${criteria}"`,
            indice_3: `=${funcName}(...)`
          });
        }
        break;
        
      default:
        // Checkpoint générique
        checkpoints.push({
          id: 'cp1',
          cellule: `${numCol.letter || 'B'}${(stats.rowCount || 50) + 2}`,
          type: 'formule',
          description: `Calcul avec ${compInfo.nom}`,
          fonction: compInfo.nom,
          pattern: [compInfo.nom],
          computation: { type: 'sum', column: numCol.name },
          points: 100,
          indice_1: `Utilise la fonction ${compInfo.nom}`,
          indice_2: 'Vérifie la syntaxe de ta formule',
          indice_3: `Consulte l'aide Excel pour ${compInfo.nom}`
        });
    }
    
    return checkpoints;
  }
  
  /**
   * Génération fallback complète (sans Claude)
   */
  async generateFallback(params) {
    const { competence, userId, exerciseType } = params;
    
    // Récupérer les infos de compétence
    const compInfo = typeof competence === 'number'
      ? findCompetenceById(competence)
      : findCompetence(competence);
    
    if (!compInfo) {
      throw new Error(`Compétence non trouvée: ${competence}`);
    }
    
    // Charger l'état utilisateur
    const learnerState = userId 
      ? await this.brain.loadLearnerState(userId)
      : null;
    
    const niveau = learnerState?.profile?.niveau || this.getNiveauFromCompetence(compInfo);
    
    // Générer les données
    const dataType = CONFIG.competenceDataTypes[compInfo.id] || 'ventes';
    const nbRows = CONFIG.rowCounts[niveau] || 100;
    
    const data = this.generateCoherentData(dataType, { nbRows });
    
    // Calculer les stats
    const stats = computeDatasetStats(data.headers, data.rows);
    
    // Générer l'exercice fallback
    const exercise = this.generateFallbackExercise(compInfo, stats, exerciseType);
    
    // Enrichir les checkpoints
    exercise.checkpoints = enrichCheckpoints(
      exercise.checkpoints,
      { headers: data.headers, rows: data.rows },
      {}
    );
    
    // Ajouter les données
    exercise.donnees = {
      headers: data.headers,
      rows: data.rows
    };
    
    exercise.dataset_source = dataType;
    exercise.generated_at = new Date().toISOString();
    exercise.generated_for = userId;
    
    return exercise;
  }
  
  /**
   * Valide la structure de l'exercice généré par Claude
   */
  validateExerciseStructure(exercise, compInfo, datasetStats = null) {
    if (!exercise.checkpoints || !Array.isArray(exercise.checkpoints)) {
      throw new Error('checkpoints manquants ou invalides');
    }
    
    if (exercise.checkpoints.length === 0) {
      throw new Error('Aucun checkpoint');
    }
    
    // Vérifier si cette compétence est full_auto (nécessite computation)
    const needsComputation = isFullyAutomatable(compInfo.id);
    
    // Récupérer le nombre de lignes pour validation des plages
    const rowCount = datasetStats?.rowCount || exercise.donnees?.rows?.length || 50;
    const dataEndRow = rowCount + 1; // +1 car ligne 1 = headers
    
    // Vérifier que chaque checkpoint a les champs requis
    exercise.checkpoints.forEach((cp, i) => {
      if (!cp.cellule) {
        throw new Error(`Checkpoint ${i}: cellule manquante`);
      }
      if (!cp.type) {
        cp.type = 'formule'; // Default
      }
      if (!cp.points) {
        cp.points = Math.floor(100 / exercise.checkpoints.length);
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // NOUVEAU (Phase 1 - T1.2.2) : Valider et corriger les plages de cellules
      // ═══════════════════════════════════════════════════════════════════════
      if (cp.pattern && Array.isArray(cp.pattern)) {
        cp.pattern = cp.pattern.map(patternItem => {
          const corrected = this.validateAndCorrectCellRange(patternItem, rowCount, dataEndRow);
          if (corrected.wasFixed) {
            logger.info('VALIDATE', `Plage corrigée dans checkpoint ${cp.id || i}: ${patternItem} → ${corrected.value}`);
          }
          return corrected.value;
        });
      }
      
      // Corriger aussi dans les indices si présents
      if (cp.indices && Array.isArray(cp.indices)) {
        cp.indices = cp.indices.map(indice => {
          return this.correctRangesInText(indice, rowCount, dataEndRow);
        });
      }
      
      // Pour les compétences full_auto, les checkpoints de type formule/valeur doivent avoir un computation
      if (needsComputation && (cp.type === 'formule' || cp.type === 'valeur')) {
        if (!cp.computation) {
          console.warn(`⚠️ [ValidateStructure] Checkpoint ${cp.id || i} sans computation pour compétence full_auto ${compInfo.id}`);
          // Ajouter un computation basique par défaut selon la compétence
          cp.computation = this.generateDefaultComputation(compInfo, cp);
        }
      }
    });
    
    // Normaliser les points à 100
    const totalPoints = exercise.checkpoints.reduce((sum, cp) => sum + (cp.points || 0), 0);
    if (totalPoints !== 100) {
      const factor = 100 / totalPoints;
      exercise.checkpoints.forEach(cp => {
        cp.points = Math.round(cp.points * factor);
      });
    }
    
    // Ajouter les métadonnées manquantes
    if (!exercise.id) {
      exercise.id = `ex_${compInfo.id}_${Date.now()}`;
    }
    if (!exercise.competences) {
      exercise.competences = [compInfo.nom];
    }
    if (!exercise.competence_ids) {
      exercise.competence_ids = [compInfo.id];
    }
    if (!exercise.niveau) {
      exercise.niveau = this.getNiveauFromCompetence(compInfo);
    }
  }
  
  /**
   * Génère un computation par défaut basé sur la compétence
   * Utilisé quand Claude oublie de fournir un computation pour un checkpoint full_auto
   */
  generateDefaultComputation(compInfo, checkpoint) {
    // Mapping compétence → type de computation par défaut
    const defaultComputations = {
      3:  { type: 'sum' },        // SOMME
      4:  { type: 'average' },    // MOYENNE
      5:  { type: 'min' },        // MIN/MAX - on prend min par défaut
      9:  { type: 'conditional' }, // SI simple
      11: { type: 'countif' },    // NB.SI
      12: { type: 'countifs' },   // NB.SI.ENS
      13: { type: 'sumif' },      // SOMME.SI
      14: { type: 'sumifs' },     // SOMME.SI.ENS
      16: { type: 'conditional' }, // SI imbriqués
      18: { type: 'lookup' },     // RECHERCHEV
      24: { type: 'index_match' }, // INDEX+EQUIV
      28: { type: 'sumproduct' }, // SOMMEPROD
      38: { type: 'lookup' },     // XLOOKUP
      53: { type: 'lookup_approx' }, // RECHERCHEV approchée
      54: { type: 'hlookup' }     // RECHERCHEH
    };
    
    const defaultComp = defaultComputations[compInfo.id];
    
    if (defaultComp) {
      console.log(`🔧 [ValidateStructure] Computation par défaut généré: ${defaultComp.type} pour compétence ${compInfo.id}`);
      return { ...defaultComp, column: 'auto' }; // 'auto' sera résolu lors de l'enrichissement
    }
    
    // Fallback ultime : manual (pas de calcul automatique)
    console.warn(`⚠️ [ValidateStructure] Pas de computation par défaut pour compétence ${compInfo.id}, utilisation manual`);
    return { type: 'manual' };
  }
  
  /**
   * Détermine le niveau à partir de la compétence
   */
  getNiveauFromCompetence(compInfo) {
    if (compInfo.niveau <= 10) return 'debutant';
    if (compInfo.niveau <= 25) return 'intermediaire';
    return 'avance';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NOUVEAU (Phase 1 - T1.2) : VALIDATION ET CORRECTION DES PLAGES DE CELLULES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Valide et corrige une plage de cellules si nécessaire
   * 
   * @param {string} text - Texte pouvant contenir une plage (ex: "E2:E36" ou "SOMME")
   * @param {number} rowCount - Nombre de lignes de données
   * @param {number} dataEndRow - Dernière ligne de données (rowCount + 1)
   * @returns {Object} { value: string, wasFixed: boolean, original: string }
   * 
   * @example
   * validateAndCorrectCellRange("E2:E36", 100, 101) 
   * // → { value: "E2:E101", wasFixed: true, original: "E2:E36" }
   */
  validateAndCorrectCellRange(text, rowCount, dataEndRow) {
    if (!text || typeof text !== 'string') {
      return { value: text, wasFixed: false };
    }
    
    // Pattern pour détecter une plage Excel (ex: A1:A100, $E$2:$E$36)
    const rangePattern = /(\$?[A-Z]+)\$?(\d+):(\$?[A-Z]+)\$?(\d+)/gi;
    
    let wasFixed = false;
    const original = text;
    
    const corrected = text.replace(rangePattern, (match, col1, row1, col2, row2) => {
      const startRow = parseInt(row1);
      const endRow = parseInt(row2);
      
      // Si la plage commence à la ligne 2 (après headers) et finit AVANT dataEndRow
      // alors il faut probablement corriger
      if (startRow === 2 && endRow < dataEndRow && endRow < rowCount) {
        // La plage est trop courte, on la corrige
        wasFixed = true;
        // Préserver le format $ si présent
        const dollar1 = text.includes('$' + col1) ? '$' : '';
        const dollar2 = text.includes(':$' + col2) || text.includes('$' + col2 + '$') ? '$' : '';
        return `${dollar1}${col1}${dollar1 ? '$' : ''}${startRow}:${dollar2}${col2}${dollar2 ? '$' : ''}${dataEndRow}`;
      }
      
      return match; // Pas de correction nécessaire
    });
    
    return { value: corrected, wasFixed, original: wasFixed ? original : undefined };
  }
  
  /**
   * Corrige les plages dans un texte libre (comme les indices)
   * 
   * @param {string} text - Texte contenant potentiellement des plages
   * @param {number} rowCount - Nombre de lignes de données
   * @param {number} dataEndRow - Dernière ligne de données
   * @returns {string} Texte avec plages corrigées
   */
  correctRangesInText(text, rowCount, dataEndRow) {
    if (!text || typeof text !== 'string') {
      return text;
    }
    
    // Pattern pour les plages dans du texte (ex: "utilise SOMME(A2:A36)")
    const rangeInTextPattern = /([A-Z]+)(\d+):([A-Z]+)(\d+)/g;
    
    return text.replace(rangeInTextPattern, (match, col1, row1, col2, row2) => {
      const startRow = parseInt(row1);
      const endRow = parseInt(row2);
      
      // Corriger si la plage commence à 2 et finit trop tôt
      if (startRow === 2 && endRow < dataEndRow && endRow < rowCount * 0.9) {
        return `${col1}${startRow}:${col2}${dataEndRow}`;
      }
      
      return match;
    });
  }
  
  /**
   * Valide qu'une plage est cohérente avec les données
   * 
   * @param {string} range - Plage au format "A1:A100"
   * @param {number} rowCount - Nombre de lignes de données
   * @returns {Object} { valid: boolean, error?: string, suggested?: string }
   */
  static validateCellRange(range, rowCount) {
    if (!range) return { valid: true };
    
    const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
    if (!match) {
      return { valid: true }; // Pas une plage, on passe
    }
    
    const [, col1, row1, col2, row2] = match;
    const startRow = parseInt(row1);
    const endRow = parseInt(row2);
    const dataEndRow = rowCount + 1;
    
    // Vérifier que la plage couvre toutes les données
    if (startRow === 2 && endRow < dataEndRow * 0.9) {
      return {
        valid: false,
        error: `Plage trop courte: ${range} (${endRow} < ${dataEndRow})`,
        suggested: `${col1}${startRow}:${col2}${dataEndRow}`
      };
    }
    
    return { valid: true };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS - COMPATIBLE V1 (exporter une INSTANCE)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crée un client Anthropic "lazy" qui sera initialisé au premier appel
 * Cela évite les erreurs au chargement du module si ANTHROPIC_API_KEY n'est pas définie
 */
function createLazyAnthropicClient() {
  let client = null;
  
  return {
    get messages() {
      if (!client) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          console.warn('⚠️ [GeneratorV2] ANTHROPIC_API_KEY non définie, génération fallback uniquement');
          return null;
        }
        
        // Créer un "client" qui utilise fetch (comme les autres routes)
        client = {
          create: async (params) => {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: params.model || 'claude-sonnet-4-20250514',
                max_tokens: params.max_tokens || 4096,
                messages: params.messages,
                system: params.system
              })
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error?.message || `API Error ${response.status}`);
            }
            
            return response.json();
          }
        };
        
        console.log('✅ [GeneratorV2] Client Anthropic initialisé');
      }
      return client;
    }
  };
}

// Instance singleton avec client Anthropic lazy
const generatorInstance = new DynamicExerciseGeneratorV2({
  anthropic: createLazyAnthropicClient()
});

// Export la classe aussi pour les tests ou usage avancé
export { DynamicExerciseGeneratorV2, CONFIG };

// Export par défaut : l'INSTANCE (comme V1)
export default generatorInstance;