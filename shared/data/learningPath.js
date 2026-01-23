/**
 * PARCOURS D'APPRENTISSAGE SOCRATE - v3.0
 * 
 * SYNCHRONISÉ AVEC pedagogie.js (source de vérité unique)
 * 
 * Ce fichier définit UNIQUEMENT :
 * - L'ordre des unités thématiques
 * - La progression pédagogique (quelles compétences dans quel ordre)
 * 
 * Les données pédagogiques (syntaxe, exemples, erreurs) viennent de PEDAGOGIE.
 * 
 * STRUCTURE :
 * - 12 Unités thématiques couvrant les 58 compétences
 * - Chaque leçon référence une competenceKey de PEDAGOGIE
 * - Les exercices sont liés par convention de nommage
 */

import { PEDAGOGIE, getPedagogie } from './pedagogie.js';

// ═══════════════════════════════════════════════════════════════════════
// DÉFINITION DES UNITÉS ET LEÇONS
// ═══════════════════════════════════════════════════════════════════════

export const LEARNING_UNITS = [
  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 1 : PREMIERS PAS
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 1,
    titre: "Premiers pas",
    description: "Découvrir l'interface et saisir des données",
    icon: "🌱",
    color: "#22c55e",
    niveau: "debutant",
    lessons: [
      { id: "1-1", competenceKey: "SAISIE", xpReward: 10, duration: "3 min" },
      { id: "1-2", competenceKey: "FORMATAGE", xpReward: 10, duration: "4 min" },
      { id: "1-3", competenceKey: "SERIES", xpReward: 15, duration: "4 min" },
      { id: "1-4", competenceKey: "TRI", xpReward: 10, duration: "3 min" },
      { id: "1-5", competenceKey: "FILTRES", xpReward: 10, duration: "4 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 2 : PREMIÈRES FORMULES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 2,
    titre: "Premières formules",
    description: "Les calculs fondamentaux",
    icon: "🧮",
    color: "#3b82f6",
    niveau: "debutant",
    lessons: [
      { id: "2-1", competenceKey: "SOMME", xpReward: 15, duration: "5 min" },
      { id: "2-2", competenceKey: "MOYENNE", xpReward: 15, duration: "5 min" },
      { id: "2-3", competenceKey: "MIN_MAX", xpReward: 15, duration: "4 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 3 : MAÎTRISER LA RECOPIE
  // Prérequis pour SOMME.SI, formules conditionnelles
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 3,
    titre: "Maîtriser la recopie",
    description: "Copier des formules intelligemment",
    icon: "📋",
    color: "#8b5cf6",
    niveau: "debutant",
    lessons: [
      { id: "3-1", competenceKey: "COPIER_COLLER", xpReward: 15, duration: "5 min" },
      { id: "3-2", competenceKey: "REFERENCES_ABSOLUES", xpReward: 25, duration: "8 min", critical: true },
      { id: "3-3", competenceKey: "REFERENCES_MIXTES", xpReward: 30, duration: "10 min" },
      { id: "3-4", competenceKey: "COLLAGE_SPECIAL", xpReward: 20, duration: "5 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 4 : CONDITIONS SIMPLES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 4,
    titre: "Conditions simples",
    description: "Prendre des décisions avec SI",
    icon: "🔀",
    color: "#f59e0b",
    niveau: "debutant",
    lessons: [
      { id: "4-1", competenceKey: "SI", xpReward: 20, duration: "6 min" },
      { id: "4-2", competenceKey: "NB_SI", xpReward: 20, duration: "5 min" },
      { id: "4-3", competenceKey: "SOMME_SI", xpReward: 25, duration: "7 min" },
      { id: "4-4", competenceKey: "MFC", xpReward: 20, duration: "5 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 5 : CONDITIONS AVANCÉES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 5,
    titre: "Conditions avancées",
    description: "Multi-critères et SI imbriqués",
    icon: "🔀",
    color: "#ef4444",
    niveau: "intermediaire",
    lessons: [
      { id: "5-1", competenceKey: "SI_IMBRIQUES", xpReward: 30, duration: "10 min" },
      { id: "5-2", competenceKey: "NB_SI_ENS", xpReward: 25, duration: "7 min" },
      { id: "5-3", competenceKey: "SOMME_SI_ENS", xpReward: 25, duration: "7 min" },
      { id: "5-4", competenceKey: "MFC_AVANCEE", xpReward: 25, duration: "8 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 6 : RECHERCHE DE DONNÉES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 6,
    titre: "Recherche de données",
    description: "Trouver des informations dans un tableau",
    icon: "🔍",
    color: "#06b6d4",
    niveau: "intermediaire",
    lessons: [
      { id: "6-1", competenceKey: "RECHERCHEV", xpReward: 30, duration: "10 min", critical: true },
      { id: "6-2", competenceKey: "RECHERCHEV_APPROCHEE", xpReward: 25, duration: "8 min" },
      { id: "6-3", competenceKey: "RECHERCHEH", xpReward: 20, duration: "5 min" },
      { id: "6-4", competenceKey: "INDEX_EQUIV", xpReward: 35, duration: "12 min" },
      { id: "6-5", competenceKey: "XLOOKUP", xpReward: 30, duration: "8 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 7 : TEXTE ET DATES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 7,
    titre: "Texte et dates",
    description: "Manipuler textes et dates",
    icon: "📝",
    color: "#ec4899",
    niveau: "intermediaire",
    lessons: [
      { id: "7-1", competenceKey: "CONCATENER", xpReward: 20, duration: "5 min" },
      { id: "7-2", competenceKey: "TEXTE_EXTRACTION", xpReward: 25, duration: "8 min" },
      { id: "7-3", competenceKey: "DATES", xpReward: 25, duration: "8 min" },
      { id: "7-4", competenceKey: "VALIDATION", xpReward: 20, duration: "6 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 8 : GRAPHIQUES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 8,
    titre: "Graphiques",
    description: "Visualiser les données",
    icon: "📊",
    color: "#14b8a6",
    niveau: "intermediaire",
    lessons: [
      { id: "8-1", competenceKey: "GRAPHIQUES", xpReward: 25, duration: "10 min" },
      { id: "8-2", competenceKey: "GRAPHIQUES_COMBINES", xpReward: 30, duration: "12 min" },
      { id: "8-3", competenceKey: "GRAPHIQUES_DYNAMIQUES", xpReward: 35, duration: "15 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 9 : TABLEAUX CROISÉS ET STRUCTURES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 9,
    titre: "Tableaux croisés",
    description: "Analyser avec les TCD",
    icon: "📈",
    color: "#6366f1",
    niveau: "intermediaire",
    lessons: [
      { id: "9-1", competenceKey: "TCD", xpReward: 40, duration: "15 min", critical: true },
      { id: "9-2", competenceKey: "TABLEAUX_STRUCTURES", xpReward: 30, duration: "10 min" },
      { id: "9-3", competenceKey: "REF_STRUCTUREES", xpReward: 25, duration: "8 min" },
      { id: "9-4", competenceKey: "FILTRES_AVANCES", xpReward: 25, duration: "8 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 10 : FORMULES AVANCÉES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 10,
    titre: "Formules avancées",
    description: "Calculs complexes et matriciels",
    icon: "🧪",
    color: "#f97316",
    niveau: "avance",
    lessons: [
      { id: "10-1", competenceKey: "SOMMEPROD", xpReward: 35, duration: "12 min" },
      { id: "10-2", competenceKey: "DECALER", xpReward: 35, duration: "12 min" },
      { id: "10-3", competenceKey: "MATRICIELLES", xpReward: 40, duration: "15 min" },
      { id: "10-4", competenceKey: "FONCTIONS_BD", xpReward: 30, duration: "10 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 11 : EXCEL 365 / FORMULES DYNAMIQUES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 11,
    titre: "Excel 365",
    description: "Nouvelles fonctions dynamiques",
    icon: "✨",
    color: "#a855f7",
    niveau: "avance",
    lessons: [
      { id: "11-1", competenceKey: "FILTER_SORT_UNIQUE", xpReward: 35, duration: "12 min" },
      { id: "11-2", competenceKey: "LET", xpReward: 30, duration: "10 min" },
      { id: "11-3", competenceKey: "LAMBDA", xpReward: 40, duration: "15 min" },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // UNITÉ 12 : POWER TOOLS
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 12,
    titre: "Power Tools",
    description: "Power Query, VBA, Power Pivot",
    icon: "⚡",
    color: "#dc2626",
    niveau: "expert",
    lessons: [
      { id: "12-1", competenceKey: "POWER_QUERY", xpReward: 50, duration: "20 min" },
      { id: "12-2", competenceKey: "POWER_QUERY_ETL", xpReward: 50, duration: "25 min" },
      { id: "12-3", competenceKey: "POWER_QUERY_M", xpReward: 60, duration: "30 min" },
      { id: "12-4", competenceKey: "VBA_DEBUTANT", xpReward: 50, duration: "20 min" },
      { id: "12-5", competenceKey: "VBA_AVANCE", xpReward: 60, duration: "30 min" },
      { id: "12-6", competenceKey: "VBA_USERFORMS", xpReward: 50, duration: "25 min" },
      { id: "12-7", competenceKey: "VBA_API", xpReward: 60, duration: "30 min" },
      { id: "12-8", competenceKey: "POWER_PIVOT", xpReward: 50, duration: "25 min" },
      { id: "12-9", competenceKey: "DAX_BASIQUE", xpReward: 50, duration: "20 min" },
      { id: "12-10", competenceKey: "DAX_AVANCE", xpReward: 60, duration: "30 min" },
      { id: "12-11", competenceKey: "RELATIONS_TABLES", xpReward: 40, duration: "15 min" },
      { id: "12-12", competenceKey: "POWER_BI", xpReward: 60, duration: "30 min" },
      { id: "12-13", competenceKey: "OPTIMISATION", xpReward: 40, duration: "15 min" },
      { id: "12-14", competenceKey: "ARCHITECTURE", xpReward: 50, duration: "20 min" },
      { id: "12-15", competenceKey: "PYTHON_R", xpReward: 60, duration: "30 min" },
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════
// FONCTIONS D'ENRICHISSEMENT
// Récupère les données de PEDAGOGIE pour chaque leçon
// ═══════════════════════════════════════════════════════════════════════

/**
 * Enrichit une leçon avec les données de PEDAGOGIE
 */
export function enrichLesson(lesson) {
  const pedagogie = getPedagogie(lesson.competenceKey);
  if (!pedagogie) {
    console.warn(`⚠️ Compétence non trouvée: ${lesson.competenceKey}`);
    return {
      ...lesson,
      titre: lesson.competenceKey,
      competenceId: null,
      sandboxKey: lesson.competenceKey,
      inDevelopment: true,
      objectif: "Non défini"
    };
  }

  return {
    ...lesson,
    titre: pedagogie.nom,
    competenceId: pedagogie.id,
    sandboxKey: lesson.competenceKey,
    inDevelopment: pedagogie.inDevelopment || false,
    objectif: pedagogie.description,
    // Données pédagogiques
    syntaxe: pedagogie.syntaxe,
    exemples: pedagogie.exemples,
    erreursFrequentes: pedagogie.erreursFrequentes,
    astuces: pedagogie.astuces,
    raccourci: pedagogie.raccourci
  };
}

/**
 * Enrichit une unité complète
 */
export function enrichUnit(unit) {
  return {
    ...unit,
    lessons: unit.lessons.map(enrichLesson)
  };
}

/**
 * Retourne le parcours complet enrichi
 */
export function getEnrichedLearningPath() {
  return LEARNING_UNITS.map(enrichUnit);
}

/**
 * Retourne les unités enrichies filtrées par niveau
 */
export function getUnitsByNiveau(niveau) {
  return LEARNING_UNITS
    .filter(u => u.niveau === niveau)
    .map(enrichUnit);
}

/**
 * Trouve une leçon par son ID
 */
export function getLessonById(lessonId) {
  for (const unit of LEARNING_UNITS) {
    const lesson = unit.lessons.find(l => l.id === lessonId);
    if (lesson) {
      return {
        ...enrichLesson(lesson),
        unit: {
          id: unit.id,
          titre: unit.titre,
          icon: unit.icon,
          color: unit.color,
          niveau: unit.niveau
        }
      };
    }
  }
  return null;
}

/**
 * Trouve une leçon par sa competenceKey
 */
export function getLessonByCompetenceKey(key) {
  const normalizedKey = key?.toUpperCase()?.replace(/\./g, '_');
  for (const unit of LEARNING_UNITS) {
    const lesson = unit.lessons.find(l => 
      l.competenceKey === key || l.competenceKey === normalizedKey
    );
    if (lesson) {
      return {
        ...enrichLesson(lesson),
        unitId: unit.id,
        unitTitre: unit.titre,
        unit: {
          id: unit.id,
          titre: unit.titre,
          icon: unit.icon,
          color: unit.color,
          niveau: unit.niveau
        }
      };
    }
  }
  return null;
}

/**
 * Retourne la prochaine leçon après celle donnée
 */
export function getNextLesson(currentLessonId) {
  const enriched = getEnrichedLearningPath();
  let found = false;
  
  for (const unit of enriched) {
    for (const lesson of unit.lessons) {
      if (found) {
        return { 
          ...lesson, 
          unitId: unit.id, 
          unitTitre: unit.titre,
          unit: {
            id: unit.id,
            titre: unit.titre,
            icon: unit.icon,
            color: unit.color,
            niveau: unit.niveau
          }
        };
      }
      if (lesson.id === currentLessonId) {
        found = true;
      }
    }
  }
  
  return null; // Fin du parcours
}

/**
 * Calcule le pourcentage de progression
 */
export function calculateProgress(completedLessonIds) {
  const enriched = getEnrichedLearningPath();
  let totalLessons = 0;
  let completedCount = 0;
  
  for (const unit of enriched) {
    for (const lesson of unit.lessons) {
      // Ne compter que les leçons fonctionnelles
      if (!lesson.inDevelopment) {
        totalLessons++;
        if (completedLessonIds.includes(lesson.id)) {
          completedCount++;
        }
      }
    }
  }
  
  return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
}

/**
 * Retourne les statistiques du parcours
 */
export function getLearningPathStats() {
  const enriched = getEnrichedLearningPath();
  
  const stats = {
    totalUnits: enriched.length,
    totalLessons: 0,
    disponibles: 0,
    enDeveloppement: 0,
    byNiveau: {
      debutant: 0,
      intermediaire: 0,
      avance: 0,
      expert: 0
    },
    totalXP: 0
  };
  
  for (const unit of enriched) {
    for (const lesson of unit.lessons) {
      stats.totalLessons++;
      if (lesson.inDevelopment) {
        stats.enDeveloppement++;
      } else {
        stats.disponibles++;
      }
      stats.totalXP += lesson.xpReward || 0;
    }
    stats.byNiveau[unit.niveau]++;
  }
  
  return stats;
}

/**
 * Liste des compétences critiques (prérequis importants)
 */
export function getCriticalLessons() {
  const enriched = getEnrichedLearningPath();
  const critical = [];
  
  for (const unit of enriched) {
    for (const lesson of unit.lessons) {
      if (lesson.critical) {
        critical.push({
          ...lesson,
          unitId: unit.id,
          unitTitre: unit.titre
        });
      }
    }
  }
  
  return critical;
}

// ═══════════════════════════════════════════════════════════════════════
// MAPPING EXERCICES (convention de nommage)
// ═══════════════════════════════════════════════════════════════════════

const EXERCISE_MAPPING = {
  // Débutant
  SAISIE: "debutant_24_saisie_navigation",
  FORMATAGE: "debutant_25_formatage_cellules",
  SERIES: "debutant_18_series_automatiques",
  TRI: "debutant_22_tri_filtres_analyse",
  FILTRES: "debutant_22_tri_filtres_analyse",
  SOMME: "debutant_26_somme_bases",
  MOYENNE: "debutant_02_notes_etudiants",
  MIN_MAX: "debutant_21_min_max_statistiques",
  COPIER_COLLER: "debutant_17_recopie_formules",
  SI: "debutant_06_alerte_stock",
  MFC: "debutant_20_mfc_alertes",
  COLLAGE_SPECIAL: "debutant_19_collage_special",
  
  // Intermédiaire
  REFERENCES_ABSOLUES: "intermediaire_34_references_absolues_mixtes",
  REFERENCES_MIXTES: "intermediaire_46_references_table_multiplication",
  NB_SI: "intermediaire_32_nbsi_comptage_conditionnel",
  SOMME_SI: "intermediaire_12_ca_par_region",
  SI_IMBRIQUES: "intermediaire_14_mentions_bac",
  NB_SI_ENS: "intermediaire_16_analyse_multicriteres",
  SOMME_SI_ENS: "intermediaire_17_ca_segmente",
  RECHERCHEV: "intermediaire_15_commandes_recherchev",
  RECHERCHEV_APPROCHEE: "intermediaire_30_recherchev_approchee_baremes",
  RECHERCHEH: "intermediaire_28_rechercheh_planning",
  CONCATENER: "intermediaire_18_generation_emails",
  TEXTE_EXTRACTION: "intermediaire_33_fonctions_texte_manipulation",
  DATES: "intermediaire_31_fonctions_dates_complet",
  VALIDATION: "intermediaire_29_validation_donnees_formulaire",
  TCD: "intermediaire_35_tcd_analyse_ventes",
  TABLEAUX_STRUCTURES: "intermediaire_36_tableaux_structures",
  MFC_AVANCEE: "intermediaire_37_mfc_avancee",
  
  // Avancé
  INDEX_EQUIV: "avance_01_index_equiv_recherche_bidirectionnelle",
  XLOOKUP: "avance_02_recherchex_moderne",
  GRAPHIQUES: "debutant_23_graphiques_visualisation",
  GRAPHIQUES_COMBINES: "avance_26_dashboard_graphiques",
  GRAPHIQUES_DYNAMIQUES: "avance_26_dashboard_graphiques",
  SOMMEPROD: "avance_04_sommeprod_calculs_matriciels",
  DECALER: "avance_05_decaler_plages_dynamiques",
  MATRICIELLES: "avance_03_formules_matricielles_dynamiques",
  FILTER_SORT_UNIQUE: "avance_29_formules_dynamiques",
  LET: "avance_29_formules_dynamiques",
  LAMBDA: "avance_29_formules_dynamiques",
  
  // Expert (tutoriels, pas d'exercices sandbox)
  POWER_QUERY: null,
  POWER_QUERY_ETL: null,
  POWER_QUERY_M: null,
  VBA_DEBUTANT: null,
  VBA_AVANCE: null,
  VBA_USERFORMS: null,
  VBA_API: null,
  POWER_PIVOT: null,
  DAX_BASIQUE: null,
  DAX_AVANCE: null,
  RELATIONS_TABLES: null,
  POWER_BI: null,
  OPTIMISATION: null,
  ARCHITECTURE: null,
  PYTHON_R: null,
  
  // Autres
  REF_STRUCTUREES: null,
  FILTRES_AVANCES: null,
  FONCTIONS_BD: null
};

/**
 * Retourne l'ID d'exercice associé à une compétence
 */
export function getExerciseIdForCompetence(competenceKey) {
  return EXERCISE_MAPPING[competenceKey] || null;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPATIBILITÉ AVEC L'ANCIEN FORMAT
// Pour les composants qui utilisent encore l'ancienne structure
// ═══════════════════════════════════════════════════════════════════════

/**
 * Génère le format legacy (avec toutes les propriétés inline)
 * Pour compatibilité avec /learn et /skill-tree
 */
export function getLegacyLearningUnits() {
  return LEARNING_UNITS.map(unit => ({
    ...unit,
    lessons: unit.lessons.map(lesson => {
      const enriched = enrichLesson(lesson);
      return {
        id: lesson.id,
        titre: enriched.titre,
        competenceId: enriched.competenceId,
        sandboxKey: lesson.competenceKey,
        exerciseId: getExerciseIdForCompetence(lesson.competenceKey),
        xpReward: lesson.xpReward,
        duration: lesson.duration,
        objectif: enriched.objectif,
        isTheory: enriched.isTheory,
        requiresExcel: enriched.requiresExcel,
        critical: lesson.critical
      };
    })
  }));
}

/**
 * Retourne toutes les leçons à plat (enrichies)
 */
export function getAllLessons() {
  const enriched = getEnrichedLearningPath();
  const lessons = [];
  for (const unit of enriched) {
    for (const lesson of unit.lessons) {
      lessons.push({
        ...lesson,
        unitId: unit.id,
        unitTitre: unit.titre,
        unit: {
          id: unit.id,
          titre: unit.titre,
          icon: unit.icon,
          color: unit.color,
          niveau: unit.niveau
        },
        exerciseId: getExerciseIdForCompetence(lesson.sandboxKey)
      });
    }
  }
  return lessons;
}

/**
 * Trouve une leçon par competenceId (numérique)
 */
export function getLessonByCompetenceId(competenceId) {
  const enriched = getEnrichedLearningPath();
  for (const unit of enriched) {
    const lesson = unit.lessons.find(l => l.competenceId === competenceId);
    if (lesson) {
      return {
        ...lesson,
        unitId: unit.id,
        unitTitre: unit.titre,
        unit: {
          id: unit.id,
          titre: unit.titre,
          icon: unit.icon,
          color: unit.color,
          niveau: unit.niveau
        },
        exerciseId: getExerciseIdForCompetence(lesson.sandboxKey)
      };
    }
  }
  return null;
}

/**
 * Calcule la progression d'une unité
 */
export function getUnitProgress(unitId, completedLessonIds = []) {
  const unit = LEARNING_UNITS.find(u => u.id === unitId);
  if (!unit) return { completed: 0, total: 0, percentage: 0 };
  
  const total = unit.lessons.length;
  const completed = unit.lessons.filter(l => completedLessonIds.includes(l.id)).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

/**
 * Vérifie si une unité est déverrouillée
 * Règle : l'unité N est déverrouillée si l'unité N-1 est complétée à 50%+
 */
export function isUnitUnlocked(unitId, completedLessonIds = []) {
  if (unitId === 1) return true; // Première unité toujours déverrouillée
  
  const prevUnitId = unitId - 1;
  const prevProgress = getUnitProgress(prevUnitId, completedLessonIds);
  
  return prevProgress.percentage >= 50;
}

/**
 * Calcule le total d'XP gagné
 */
export function getTotalXP(completedLessonIds = []) {
  const enriched = getEnrichedLearningPath();
  let totalXP = 0;
  
  for (const unit of enriched) {
    for (const lesson of unit.lessons) {
      if (completedLessonIds.includes(lesson.id)) {
        totalXP += lesson.xpReward || 0;
      }
    }
  }
  
  return totalXP;
}

/**
 * Calcule le total d'XP possible (toutes les leçons)
 */
export function getTotalPossibleXP() {
  const enriched = getEnrichedLearningPath();
  let totalXP = 0;
  
  for (const unit of enriched) {
    for (const lesson of unit.lessons) {
      totalXP += lesson.xpReward || 0;
    }
  }
  
  return totalXP || 1; // Éviter division par 0
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════

export default LEARNING_UNITS;