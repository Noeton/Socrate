/**
 * CLASSE USERPROFILE - Gestion du profil utilisateur
 * Compatible Next.js (ES6 modules)
 * 
 * Version enrichie avec :
 * - Tracking progression détaillé
 * - Adaptation dynamique du niveau
 * - Détection vitesse de compréhension
 * - Mémorisation exercices
 */
import { findCompetence, NIVEAU_TO_SCORE, getScoreToNiveau } from '../data/competencesExcel.js';

class UserProfile {
  constructor() {
    this.niveau = null;
    this.scoreGranulaire = 0; // NOUVEAU
    this.competences = {}; // NOUVEAU
    this.contexteMetier = null;
    this.historique = [];
    
    // NOUVEAU : Tracking progression
    this.progression = {
      exercicesCompletes: 0,
      exercicesReussis: 0,
      exercicesEchoues: 0,
      topicsVus: [], // ["SOMME", "RECHERCHEV", ...]
      topicsMailtrises: [], // Topics avec >80% réussite
      dernierExercice: null,
      streakReussites: 0 // Nombre de réussites consécutives
    };
    
    // NOUVEAU : Adaptation comportementale
    this.comportement = {
      vitesseComprehension: "normale", // "lente", "normale", "rapide"
      modePrefere: "learning", // "learning" ou "work"
      nombreQuestionsTheorique: 0,
      tauxReussiteGlobal: 0
    };
    
    // NOUVEAU : Exercice en cours
    this.exerciceEnCours = null;
  }
  
  setNiveau(niveau) {
    const niveauxValides = ['debutant', 'intermediaire', 'avance'];
    if (niveauxValides.includes(niveau)) {
      this.niveau = niveau;
      console.log(`✅ [UserProfile] Niveau défini: ${niveau}`);
    } else {
      console.warn(`⚠️  [UserProfile] Niveau invalide: ${niveau}`);
    }
  }
  
  setContexteMetier(metier) {
    this.contexteMetier = metier;
    console.log(`✅ [UserProfile] Contexte métier défini: ${metier}`);
  }
  
  addToHistory(interaction) {
    this.historique.push({
      timestamp: new Date(),
      ...interaction
    });
    
    // Limiter l'historique à 50 messages (performance)
    if (this.historique.length > 50) {
      this.historique = this.historique.slice(-50);
    }
  }
  
  // NOUVEAU : Enregistrer un exercice proposé
  setExerciceEnCours(exerciceMetadata) {
    this.exerciceEnCours = {
      id: exerciceMetadata.id,
      type: exerciceMetadata.type,
      niveau: exerciceMetadata.niveau,
      proposedAt: new Date(),
      context: exerciceMetadata.context
    };
    console.log(`📝 [UserProfile] Exercice proposé: ${exerciceMetadata.type}`);
  }
  // NOUVEAU : Marquer un exercice comme terminé
markExerciceComplete(exerciceId, success, score) {
  if (!this.exerciceEnCours || this.exerciceEnCours.id !== exerciceId) {
    console.warn('⚠️ [UserProfile] Exercice terminé mais pas celui en cours');
    return;
  }
  
  // Ajouter à l'historique
  const completedExercice = {
    ...this.exerciceEnCours,
    completedAt: new Date(),
    success: success,
    score: score,
    attempts: 1
  };
  
  this.addToHistory({
    type: 'exercice',
    exerciceId: exerciceId,
    exerciceTopic: this.exerciceEnCours.type,
    exerciceSuccess: success,
    exerciceScore: score
  });
  
  // Mettre à jour progression
  this.recordExerciceResult(success, this.exerciceEnCours.type);
  
  // Vider l'exercice en cours
  this.exerciceEnCours = null;
  
  console.log(`✅ [UserProfile] Exercice ${exerciceId} terminé (${success ? 'RÉUSSI' : 'ÉCHOUÉ'}, score: ${score}/10)`);
}

  // NOUVEAU : Enregistrer résultat d'un exercice
  recordExerciceResult(success, topic) {
    this.progression.exercicesCompletes++;
    
    if (success) {
      this.progression.exercicesReussis++;
      this.progression.streakReussites++;
      
      // Ajouter topic aux maîtrisés si 3 réussites
      if (!this.progression.topicsMailtrises.includes(topic)) {
        const topicSuccesses = this.getTopicSuccesses(topic);
        if (topicSuccesses >= 3) {
          this.progression.topicsMailtrises.push(topic);
          console.log(`🏆 [UserProfile] Topic maîtrisé: ${topic}`);
        }
      }
    } else {
      this.progression.exercicesEchoues++;
      this.progression.streakReussites = 0;
    }
    
    // Ajouter topic aux vus
    if (!this.progression.topicsVus.includes(topic)) {
      this.progression.topicsVus.push(topic);
    }
    
    // Mettre à jour taux de réussite global
    this.comportement.tauxReussiteGlobal = 
      Math.round((this.progression.exercicesReussis / this.progression.exercicesCompletes) * 100);
    
    // Évaluer niveau dynamiquement
    this.evaluateNiveauDynamique();
    
    // Évaluer vitesse de compréhension
    this.evaluateVitesseComprehension();
  }
  
  // NOUVEAU : Évaluation dynamique du niveau
  evaluateNiveauDynamique() {
    const { exercicesCompletes, topicsMailtrises, streakReussites } = this.progression;
    const { tauxReussiteGlobal } = this.comportement;
    
    // Conditions pour monter de niveau
    if (this.niveau === 'debutant' && 
        exercicesCompletes >= 5 && 
        tauxReussiteGlobal >= 80 &&
        topicsMailtrises.length >= 3) {
      this.setNiveau('intermediaire');
      console.log('📈 [UserProfile] Niveau auto-upgradé: intermediaire');
      return 'upgrade';
    }
    
    if (this.niveau === 'intermediaire' && 
        exercicesCompletes >= 15 && 
        tauxReussiteGlobal >= 75 &&
        topicsMailtrises.length >= 8) {
      this.setNiveau('avance');
      console.log('📈 [UserProfile] Niveau auto-upgradé: avance');
      return 'upgrade';
    }
    
    // Conditions pour descendre de niveau (bienveillant)
    if (exercicesCompletes >= 5 && tauxReussiteGlobal < 40) {
      if (this.niveau === 'avance') {
        this.setNiveau('intermediaire');
        console.log('📉 [UserProfile] Niveau ajusté: intermediaire');
        return 'downgrade';
      } else if (this.niveau === 'intermediaire') {
        this.setNiveau('debutant');
        console.log('📉 [UserProfile] Niveau ajusté: debutant');
        return 'downgrade';
      }
    }
    
    return 'stable';
  }
  
  // NOUVEAU : Évaluation vitesse de compréhension
  evaluateVitesseComprehension() {
    const { exercicesCompletes, streakReussites } = this.progression;
    const { nombreQuestionsTheorique } = this.comportement;
    
    if (exercicesCompletes < 3) return; // Pas assez de données
    
    // Rapide : 5+ réussites consécutives et peu de questions
    if (streakReussites >= 5 && nombreQuestionsTheorique < 2) {
      this.comportement.vitesseComprehension = "rapide";
      console.log('⚡ [UserProfile] Vitesse détectée: RAPIDE');
    }
    // Lente : beaucoup de questions ou échecs répétés
    else if (nombreQuestionsTheorique > 5 || streakReussites === 0) {
      this.comportement.vitesseComprehension = "lente";
      console.log('🐢 [UserProfile] Vitesse détectée: LENTE');
    }
    // Normal par défaut
    else {
      this.comportement.vitesseComprehension = "normale";
    }
  }
  
  // NOUVEAU : Incrémenter questions théoriques
  incrementQuestionTheorique() {
    this.comportement.nombreQuestionsTheorique++;
  }
  
  // NOUVEAU : Obtenir nombre de réussites sur un topic
  getTopicSuccesses(topic) {
    return this.historique.filter(h => 
      h.exerciceTopic === topic && h.exerciceSuccess === true
    ).length;
  }
  // NOUVEAU : Enregistrer une compétence maîtrisée
recordCompetence(competenceNom, maitrise) {
  const comp = findCompetence(competenceNom);
  if (!comp) {
    console.warn(`⚠️ Compétence inconnue: ${competenceNom}`);
    return;
  }
  
  if (!this.competences[comp.nom]) {
    this.competences[comp.nom] = {
      niveau: comp.niveau,
      maitrise: 0,
      tentatives: 0
    };
  }
  
  this.competences[comp.nom].maitrise = Math.max(
    this.competences[comp.nom].maitrise,
    maitrise
  );
  this.competences[comp.nom].tentatives++;
  
  // Recalculer le score granulaire
  this.updateScoreGranulaire();
  
  console.log(`📈 [UserProfile] Compétence ${comp.nom}: ${maitrise}% maîtrisée`);
}

// NOUVEAU : Calculer le score granulaire global
updateScoreGranulaire() {
  const competencesMaitrisees = Object.values(this.competences)
    .filter(c => c.maitrise >= 70); // 70% = maîtrisé
  
  if (competencesMaitrisees.length === 0) {
    this.scoreGranulaire = NIVEAU_TO_SCORE[this.niveau] || 0;
    return;
  }
  
  // Score = niveau moyen des compétences maîtrisées
  const scoreCalc = competencesMaitrisees.reduce((sum, c) => sum + c.niveau, 0) 
    / competencesMaitrisees.length;
  
  this.scoreGranulaire = Math.round(scoreCalc);
  
  // Mettre à jour le label si changement de tranche
  const nouveauNiveau = getScoreToNiveau(this.scoreGranulaire);
  if (nouveauNiveau !== this.niveau) {
    console.log(`📊 [UserProfile] Niveau upgradé: ${this.niveau} → ${nouveauNiveau}`);
    this.niveau = nouveauNiveau;
  }
}
  
reset() {
  this.niveau = null;
  this.scoreGranulaire = 0; // NOUVEAU
  this.competences = {}; // NOUVEAU
  this.contexteMetier = null;
    this.historique = [];
    this.progression = {
      exercicesCompletes: 0,
      exercicesReussis: 0,
      exercicesEchoues: 0,
      topicsVus: [],
      topicsMailtrises: [],
      dernierExercice: null,
      streakReussites: 0
    };
    this.comportement = {
      vitesseComprehension: "normale",
      modePrefere: "learning",
      nombreQuestionsTheorique: 0,
      tauxReussiteGlobal: 0
    };
    this.exerciceEnCours = null;
    console.log('🔄 [UserProfile] Profil réinitialisé');
  }
  
  getProfile() {
    return {
      niveau: this.niveau,
      scoreGranulaire: this.scoreGranulaire, // NOUVEAU
      competences: this.competences, // NOUVEAU
      contexteMetier: this.contexteMetier,
      historiqueLength: this.historique.length,
      progression: this.progression,
      comportement: this.comportement,
      exerciceEnCours: this.exerciceEnCours
    };
  }
}

export default UserProfile;