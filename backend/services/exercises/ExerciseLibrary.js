import fs from 'fs';
import path from 'path';
import { 
  COMPETENCE_INDEX, 
  getTemplatesForCompetence, 
  resolveCompetenceId,
  getCompetenceInfo,
  getCompetenceCoverage 
} from '@/shared/data/competenceIndex';

/**
 * EXERCISE LIBRARY - Singleton
 * Gère intelligemment la bibliothèque de 76 exercices
 * 
 * PHASE 3: Utilise maintenant COMPETENCE_INDEX comme source de vérité
 * pour la recherche par compétence (lookup O(1) vs O(n) précédemment)
 */
class ExerciseLibrary {
  constructor() {
    if (ExerciseLibrary.instance) {
      return ExerciseLibrary.instance;
    }
    
    this.exercises = [];
    this.exerciseMap = new Map(); // Cache par ID pour lookup O(1)
    this.loaded = false;
    ExerciseLibrary.instance = this;
  }
  
  /**
   * Initialise la bibliothèque (charge tous les exercices)
   */
  initialize() {
    if (this.loaded) {
      console.log('📚 [LIBRARY] Déjà chargée');
      return;
    }
    
    console.log('📚 [LIBRARY] Chargement de la bibliothèque...');
    
    // 1. Charger depuis shared/data/exercises/{niveau}/
    const niveaux = ['debutant', 'intermediaire', 'avance'];
    let totalLoaded = 0;
    
    niveaux.forEach(niveau => {
      const exercisesDir = path.join(
        process.cwd(),
        'shared',
        'data',
        'exercises',
        niveau
      );
      
      if (!fs.existsSync(exercisesDir)) {
        console.warn(`⚠️ [LIBRARY] Dossier ${niveau} introuvable`);
        return;
      }
      
      const files = fs.readdirSync(exercisesDir)
        .filter(f => f.endsWith('.json') && !f.startsWith('shared'));
      
      files.forEach(file => {
        try {
          const filepath = path.join(exercisesDir, file);
          const content = fs.readFileSync(filepath, 'utf-8');
          const exercise = JSON.parse(content);
          
          // Ajouter métadonnées
          exercise._filename = file;
          exercise._filepath = filepath;
          exercise._niveau = niveau;
          
          this.exercises.push(exercise);
          this.exerciseMap.set(exercise.id, exercise); // Cache
          totalLoaded++;
        } catch (error) {
          console.error(`❌ [LIBRARY] Erreur chargement ${file}:`, error.message);
        }
      });
    });
    
    // 2. Charger depuis exercises_reference/ (exercices enrichis)
    const referenceDir = path.join(process.cwd(), 'exercises_reference');
    if (fs.existsSync(referenceDir)) {
      const refFiles = fs.readdirSync(referenceDir)
        .filter(f => f.endsWith('.json'));
      
      refFiles.forEach(file => {
        try {
          const filepath = path.join(referenceDir, file);
          const content = fs.readFileSync(filepath, 'utf-8');
          const exercise = JSON.parse(content);
          
          // Normaliser le format (metadata.niveau ou niveau direct)
          const niveau = exercise.metadata?.niveau || exercise.niveau || 'debutant';
          const competenceIds = exercise.metadata?.competences_ids || exercise.metadata?.competence_ids || [];
          
          // Ajouter métadonnées
          exercise._filename = file;
          exercise._filepath = filepath;
          exercise._niveau = niveau;
          exercise.niveau = niveau;
          exercise.competences = exercise.metadata?.competences_noms || exercise.competences || [];
          exercise.competence_ids = competenceIds;
          
          // Éviter les doublons (par ID)
          const existingIndex = this.exercises.findIndex(e => e.id === exercise.id);
          if (existingIndex >= 0) {
            this.exercises[existingIndex] = exercise; // Remplacer
            this.exerciseMap.set(exercise.id, exercise); // Mettre à jour cache
            console.log(`🔄 [LIBRARY] Exercice ${exercise.id} mis à jour depuis reference`);
          } else {
            this.exercises.push(exercise);
            this.exerciseMap.set(exercise.id, exercise); // Cache
            totalLoaded++;
          }
        } catch (error) {
          console.error(`❌ [LIBRARY] Erreur chargement référence ${file}:`, error.message);
        }
      });
    }
    
    this.loaded = true;
    console.log(`✅ [LIBRARY] ${totalLoaded} exercices chargés`);
    console.log(`   • Débutant: ${this.exercises.filter(e => e.niveau === 'debutant' || e._niveau === 'debutant').length}`);
    console.log(`   • Intermédiaire: ${this.exercises.filter(e => e.niveau === 'intermediaire' || e._niveau === 'intermediaire').length}`);
    console.log(`   • Avancé: ${this.exercises.filter(e => e.niveau === 'avance' || e._niveau === 'avance').length}`);
    console.log(`   • Index disponible: ${Object.keys(COMPETENCE_INDEX.byCompetence).length} compétences`);
  }
  
  /**
   * Sélectionne le meilleur exercice selon recommandation AdaptiveEngine
   * @param {Object} recommendation - {exerciseType, difficulty, topics, competencesToWork}
   * @param {String} userId - ID utilisateur
   * @param {Array} recentExercises - IDs des 5 derniers exercices
   */
  getExerciseByRecommendation(recommendation, userId, recentExercises = []) {
    if (!this.loaded) {
      this.initialize();
    }
    
    console.log('🎯 [LIBRARY] Sélection exercice:', recommendation);
    
    // Niveau mapping
    const niveauMap = {
      'debutant': 'debutant',
      'intermediaire': 'intermediaire',
      'avance': 'avance'
    };
    
    const targetNiveau = niveauMap[recommendation.exerciseType] || 'debutant';
    
    // ÉTAPE 1 : Filtrer par niveau
    let candidates = this.exercises.filter(e => e.niveau === targetNiveau);
    
    // Fallback si aucun exercice du niveau demandé
    if (candidates.length === 0) {
      console.warn(`⚠️ [LIBRARY] Aucun exercice ${targetNiveau}, fallback niveau inférieur`);
      candidates = this.exercises.filter(e => e.niveau === 'debutant');
    }
    
    if (candidates.length === 0) {
      console.error('❌ [LIBRARY] Aucun exercice disponible !');
      return null;
    }
    
    // ÉTAPE 2 : Exclure les 5 derniers exercices
    if (recentExercises.length > 0) {
      candidates = candidates.filter(e => !recentExercises.includes(e.id));
      
      if (candidates.length === 0) {
        console.warn('⚠️ [LIBRARY] Tous les exercices déjà faits récemment, on réinitialise');
        candidates = this.exercises.filter(e => e.niveau === targetNiveau);
      }
    }
    
    // ÉTAPE 3 : Scorer chaque candidat
    const targetCompetences = recommendation.competencesToWork || [];
    const scored = candidates.map(exercise => {
      const score = this.calculateCompetenceCoverage(exercise, targetCompetences);
      return { exercise, score };
    });
    
    // Trier par score décroissant
    scored.sort((a, b) => b.score - a.score);
    
    // ÉTAPE 4 : Sélectionner le meilleur
    const selected = scored[0].exercise;
    
    console.log(`✅ [LIBRARY] Exercice sélectionné: ${selected.id} (score: ${scored[0].score}/10)`);
    console.log(`   • Titre: ${selected.titre}`);
    console.log(`   • Compétences: ${selected.competences?.join(', ') || 'N/A'}`);

    // Si Claude a recommandé un dataset externe, l'ajouter
    if (recommendation.dataset_externe) {
    console.log(`📦 [LIBRARY] Dataset externe ajouté: ${recommendation.dataset_externe}`);
    selected.dataset_externe = recommendation.dataset_externe;
    selected.dataset_rows = recommendation.dataset_rows || 100;
    }

return selected;

  }
  
  /**
   * Calcule le score de couverture des compétences (0-10)
   * @param {Object} exercise - Exercice
   * @param {Array} targetCompetences - Compétences recherchées
   */
  calculateCompetenceCoverage(exercise, targetCompetences) {
    if (!targetCompetences || targetCompetences.length === 0) {
      return 5; // Score neutre si pas de compétences ciblées
    }
    
    const exerciseCompetences = exercise.competences || [];
    
    // Compte combien de compétences ciblées sont couvertes
    const matches = targetCompetences.filter(tc => 
      exerciseCompetences.some(ec => 
        ec.toLowerCase().includes(tc.toLowerCase()) ||
        tc.toLowerCase().includes(ec.toLowerCase())
      )
    );
    
    // Score = (matches / targetCompetences) * 10
    const score = (matches.length / targetCompetences.length) * 10;
    
    return Math.round(score * 10) / 10; // Arrondi à 1 décimale
  }
  
  /**
   * Récupère un exercice par ID exact
   * PHASE 3: Utilise le cache Map pour lookup O(1)
   * @param {String} exerciseId
   */
  getExerciseById(exerciseId) {
    if (!this.loaded) {
      this.initialize();
    }
    
    // Lookup O(1) via le cache Map
    const exercise = this.exerciseMap.get(exerciseId);
    
    if (!exercise) {
      // Fallback: recherche linéaire (au cas où)
      const found = this.exercises.find(e => e.id === exerciseId);
      if (found) {
        this.exerciseMap.set(exerciseId, found); // Ajouter au cache
        return found;
      }
      console.warn(`⚠️ [LIBRARY] Exercice ${exerciseId} introuvable`);
      return null;
    }
    
    return exercise;
  }
  
  /**
   * Récupère tous les exercices pour une compétence donnée
   * PHASE 3: Utilise COMPETENCE_INDEX pour lookup O(1)
   * 
   * @param {Number|String} competenceIdOrName - ID ou nom de la compétence
   * @returns {Array} Exercices couvrant cette compétence
   */
  getExercisesByCompetence(competenceIdOrName) {
    if (!this.loaded) {
      this.initialize();
    }
    
    // Résoudre l'ID si c'est un nom/alias
    let competenceId = competenceIdOrName;
    if (typeof competenceIdOrName === 'string') {
      competenceId = resolveCompetenceId(competenceIdOrName);
      if (!competenceId) {
        console.warn(`⚠️ [LIBRARY] Compétence "${competenceIdOrName}" non trouvée dans l'index`);
        // Fallback: recherche par nom dans les templates
        return this._fallbackSearchByName(competenceIdOrName);
      }
    }
    
    // Lookup O(1) via l'index
    const templateIds = getTemplatesForCompetence(competenceId);
    
    if (templateIds.length === 0) {
      console.log(`📋 [LIBRARY] Aucun template pour compétence ${competenceId}`);
      return [];
    }
    
    // Récupérer les exercices par leurs IDs (O(1) chaque via cache)
    const exercises = templateIds
      .map(id => this.getExerciseById(id))
      .filter(Boolean);
    
    console.log(`📋 [LIBRARY] ${exercises.length} exercice(s) trouvé(s) pour compétence ${competenceId}`);
    return exercises;
  }
  
  /**
   * Fallback: recherche par nom de compétence dans les templates
   * Utilisé si le nom n'est pas dans l'index
   * @private
   */
  _fallbackSearchByName(competenceName) {
    const nameLower = competenceName.toLowerCase();
    return this.exercises.filter(e => {
      const competences = e.competences || [];
      return competences.some(c => c.toLowerCase().includes(nameLower));
    });
  }
  
  /**
   * Obtient la couverture d'une compétence
   * @param {Number} competenceId - ID de la compétence
   * @returns {'full'|'partial'|'none'} Niveau de couverture
   */
  getCompetenceCoverageLevel(competenceId) {
    return getCompetenceCoverage(competenceId);
  }
  
  /**
   * Obtient les infos d'une compétence depuis l'index
   * @param {Number} competenceId - ID de la compétence
   * @returns {Object|null} Infos de la compétence
   */
  getCompetenceInfo(competenceId) {
    return getCompetenceInfo(competenceId);
  }
  
  /**
   * Récupère les exercices nécessitant une validation visuelle
   * 
   * TODO [LIMITE] : Ces exercices nécessitent un screenshot pour validation complète.
   *   Sans screenshot, seule une validation partielle est possible (présence de graphique/MFC).
   *   Voir CheckpointValidator.validateVisualCheckpoint() et VisualValidationService.
   * 
   * @returns {Array} Exercices avec checkpoints visuels (graphiques, MFC)
   */
  getVisualExercises() {
    if (!this.loaded) {
      this.initialize();
    }
    
    return this.exercises.filter(e => {
      const requiresScreenshot = e.metadata?.requires_screenshot || false;
      const hasVisualCheckpoints = (e.checkpoints || []).some(
        cp => cp.type === 'graphique' || cp.type === 'format' || cp.validation_type === 'visual'
      );
      return requiresScreenshot || hasVisualCheckpoints;
    });
  }
  
  /**
   * Récupère les exercices par catégorie (graphiques, MFC, TCD, etc.)
   * @param {String} category - Catégorie recherchée
   * @returns {Array} Exercices de cette catégorie
   */
  getExercisesByCategory(category) {
    if (!this.loaded) {
      this.initialize();
    }
    
    const categoryMap = {
      'graphiques': [26, 32, 33],
      'mfc': [10, 25],
      'tcd': [35],
      'formules': [3, 4, 5, 9, 11, 12, 13, 14, 18, 19, 20],
      'basique': [1, 2, 6, 7, 8, 52, 58],
      'analyse': [7, 8, 57],
      'automatisation': [38, 39, 40, 41, 42]
    };
    
    const competenceIds = categoryMap[category.toLowerCase()] || [];
    
    return this.exercises.filter(e => {
      // Chercher dans les deux variantes de noms
      const ids = e.competence_ids || e.competences_ids || e.metadata?.competences_ids || e.metadata?.competence_ids || [];
      return ids.some(id => competenceIds.includes(id));
    });
  }
  
  /**
   * Statistiques de la bibliothèque
   * PHASE 3: Inclut les stats de couverture de l'index
   */
  getStats() {
    if (!this.loaded) {
      this.initialize();
    }
    
    const coverageStats = COMPETENCE_INDEX.meta?.coverageStats || { full: 0, partial: 0, none: 0 };
    
    return {
      total: this.exercises.length,
      byLevel: {
        debutant: this.exercises.filter(e => e.niveau === 'debutant').length,
        intermediaire: this.exercises.filter(e => e.niveau === 'intermediaire').length,
        avance: this.exercises.filter(e => e.niveau === 'avance').length
      },
      allCompetences: [...new Set(this.exercises.flatMap(e => e.competences || []))],
      // Stats de l'index centralisé
      index: {
        competenceCount: Object.keys(COMPETENCE_INDEX.byCompetence).length,
        templateCount: Object.keys(COMPETENCE_INDEX.byTemplate).length,
        aliasCount: Object.keys(COMPETENCE_INDEX.aliases).length,
        coverage: coverageStats
      }
    };
  }
}

// Export singleton instance
const libraryInstance = new ExerciseLibrary();
export default libraryInstance;