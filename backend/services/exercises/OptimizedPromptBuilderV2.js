/**
 * OPTIMIZED PROMPT BUILDER - v2.0
 * 
 * Génère des prompts Claude pour créer des exercices de qualité "Gold Standard".
 * 
 * AMÉLIORATIONS v2 :
 * 1. Contexte immersif avec personnages et entreprises
 * 2. Progression pédagogique en phases
 * 3. Structure checkpoint enrichie (erreurs_probables, 3 indices)
 * 4. Feedback "in-character" du manager
 * 5. Intégration complète de competencesExcel.js
 */

import { findCompetence, findCompetenceById, getErreursFrequentes, getConceptsCles } from '../../../shared/data/competencesExcel.js';
import { getValidationInfo, isFullyAutomatable, getAutomatableCompetences } from './CompetenceValidationMap.js';
import { computeDatasetStats, formatStatsForPrompt } from './ComputationEngine.js';
import { 
  getTemplatesForProgression, 
  generateCheckpointsFromTemplates,
  getProgressionLevel,
  CHECKPOINT_TEMPLATES 
} from '../../../shared/data/checkpointTemplates.js';

// ═══════════════════════════════════════════════════════════════════════════
// RESSOURCES : PERSONNAGES ET ENTREPRISES
// ═══════════════════════════════════════════════════════════════════════════

const MANAGERS = {
  finance: [
    {
      id: "fin_01",
      nom: "Marc Tessier",
      poste: "Partner",
      entreprise_type: "VC / Private Equity",
      personnalite: "Brillant, pressé, peu patient avec les approximations",
      citation: "Un modèle, c'est pas pour avoir le bon chiffre. C'est pour comprendre ce qui fait bouger le chiffre.",
      niveau_exigence: "avance",
      feedbacks: {
        succes: "Très bien. Ton analyse tient la route.",
        partiel: "Il y a des trous. Reprends les hypothèses.",
        echec: "C'est pas au niveau. On en reparle demain."
      }
    },
    {
      id: "fin_02",
      nom: "Claire Dubois",
      poste: "Directrice Financière (CFO)",
      entreprise_type: "Scale-up / ETI",
      personnalite: "Rigoureuse, pédagogue, exigeante mais juste",
      citation: "Si tu ne peux pas expliquer ton chiffre en 30 secondes, c'est que tu ne le comprends pas.",
      niveau_exigence: "intermediaire",
      feedbacks: {
        succes: "Excellent travail, c'est exactement ce qu'il fallait.",
        partiel: "Bon début, mais vérifie les points en rouge.",
        echec: "Il faut reprendre les bases. Viens me voir si tu bloques."
      }
    },
    {
      id: "fin_03",
      nom: "Thomas Renard",
      poste: "Contrôleur de gestion senior",
      entreprise_type: "Grand groupe",
      personnalite: "Méthodique, patient, aime transmettre",
      citation: "En finance, on ne devine pas, on calcule. Et on documente.",
      niveau_exigence: "debutant",
      feedbacks: {
        succes: "Super ! Tu as bien compris la logique.",
        partiel: "C'est pas mal. On va corriger ensemble les erreurs.",
        echec: "Pas de souci, c'est normal au début. On reprend étape par étape."
      }
    }
  ],
  commercial: [
    {
      id: "com_01",
      nom: "Sophie Marchand",
      poste: "Directrice Commerciale",
      entreprise_type: "PME / ETI",
      personnalite: "Orientée résultats, directe, protège son équipe",
      citation: "Je veux des chiffres, pas des impressions. Et si tu n'es pas sûr, dis-le.",
      niveau_exigence: "intermediaire",
      feedbacks: {
        succes: "Parfait, c'est exactement ce qu'il me fallait pour le CODIR.",
        partiel: "Merci pour le travail. Quelques ajustements à faire.",
        echec: "Il me faut des chiffres fiables. On reprend ça demain."
      }
    },
    {
      id: "com_02",
      nom: "Alexandre Morin",
      poste: "Head of Sales",
      entreprise_type: "Startup / Scale-up",
      personnalite: "Énergique, optimiste, focalisé croissance",
      citation: "Done is better than perfect. Mais les chiffres, eux, doivent être parfaits.",
      niveau_exigence: "debutant",
      feedbacks: {
        succes: "Top ! Exactement ce qu'on avait besoin. Let's go !",
        partiel: "Good start ! Finis de corriger et on ship.",
        echec: "C'est pas grave, on itère. Mais là il faut reprendre."
      }
    }
  ],
  rh: [
    {
      id: "rh_01",
      nom: "Caroline Martin",
      poste: "DRH",
      entreprise_type: "ETI / Grand groupe",
      personnalite: "Empathique mais exigeante, vision stratégique",
      citation: "Les chiffres RH racontent une histoire. À toi de la décrypter.",
      niveau_exigence: "intermediaire",
      feedbacks: {
        succes: "Très bonne analyse. Ça va m'aider pour le plan social.",
        partiel: "C'est un bon début. Creuse un peu plus les causes.",
        echec: "Il manque l'essentiel. On en reparle ensemble."
      }
    }
  ],
  comptabilite: [
    {
      id: "cpt_01",
      nom: "Philippe Garnier",
      poste: "Chef comptable",
      entreprise_type: "PME",
      personnalite: "Patient, méthodique, aime former les juniors",
      citation: "La compta, c'est de la logique. Débit = Crédit, toujours.",
      niveau_exigence: "debutant",
      feedbacks: {
        succes: "Très bien ! Tu commences à avoir les bons réflexes.",
        partiel: "C'est pas mal. Attention aux écritures d'OD.",
        echec: "C'est normal de galérer au début. On reprend les bases."
      }
    }
  ],
  marketing: [
    {
      id: "mkt_01",
      nom: "Léa Fontaine",
      poste: "CMO",
      entreprise_type: "Scale-up",
      personnalite: "Créative mais data-driven, rapide, exigeante",
      citation: "Un dashboard sans recommandation, c'est une perte de temps.",
      niveau_exigence: "intermediaire",
      feedbacks: {
        succes: "Exactement ce qu'il fallait pour le board. Good job.",
        partiel: "Les chiffres sont là mais où sont les insights ?",
        echec: "Je comprends pas ce que tu veux me dire. On reprend."
      }
    }
  ],
  general: [
    {
      id: "gen_01",
      nom: "Émilie Chen",
      poste: "Chief of Staff",
      entreprise_type: "Scale-up",
      personnalite: "Polyvalente, structurée, interface entre les équipes",
      citation: "Le CEO n'a que 5 minutes. Ton slide doit tout dire.",
      niveau_exigence: "intermediaire",
      feedbacks: {
        succes: "Parfait pour le weekly. Clair et actionnable.",
        partiel: "C'est bien mais trop long. Synthétise.",
        echec: "Je ne vois pas le message clé. On refait."
      }
    }
  ]
};

const ENTREPRISES = {
  tech_saas: [
    {
      id: "tech_01",
      nom: "DataFlow",
      secteur: "SaaS B2B - Data Analytics",
      description: "Plateforme de business intelligence no-code",
      effectif: 35,
      localisation: "Paris",
      vocabulaire: ["ARR", "MRR", "churn", "NPS", "CAC", "LTV"]
    },
    {
      id: "tech_02",
      nom: "TalentHub",
      secteur: "SaaS B2B - HR Tech",
      description: "Plateforme de recrutement et gestion des talents",
      effectif: 45,
      localisation: "Paris",
      vocabulaire: ["ATS", "onboarding", "HRIS", "employee experience"]
    }
  ],
  distribution_b2b: [
    {
      id: "dist_01",
      nom: "FrenchTech Solutions",
      secteur: "Distribution matériel informatique B2B",
      description: "Distributeur de matériel IT pour entreprises",
      effectif: 45,
      localisation: "Paris + 6 agences régionales",
      vocabulaire: ["panier moyen", "marge", "stock", "rotation"]
    }
  ],
  conseil: [
    {
      id: "conseil_01",
      nom: "Nexus Advisory",
      secteur: "Conseil en stratégie",
      description: "Cabinet de conseil mid-market",
      effectif: 80,
      localisation: "Paris",
      vocabulaire: ["TJM", "staffing", "utilisation", "pipe"]
    }
  ]
};

const SITUATIONS_TEMPLATES = {
  analyse_periodique: [
    "C'est le {jour} {mois}. {manager.nom} prépare {livrable} pour {audience}.",
    "Nous sommes en fin de {periode}. {manager.nom} a besoin de {analyse} avant {deadline}.",
    "{manager.nom} doit présenter {sujet} au {audience} {quand}. Il/Elle compte sur toi."
  ],
  urgence: [
    "{manager.nom} vient de t'appeler : \"{citation}\" - Il/Elle a besoin de {livrable} pour {deadline}.",
    "Email urgent de {manager.nom} : le {audience} veut {demande} pour {deadline}."
  ],
  formation: [
    "C'est ton premier {projet_type} en autonomie. {manager.nom} veut voir ce que tu sais faire.",
    "{manager.nom} t'a confié {mission}. C'est l'occasion de montrer ce que tu vaux."
  ]
};

const DEADLINES = [
  "ce soir 18h",
  "demain matin 9h",
  "demain midi",
  "jeudi 18h",
  "vendredi avant le board",
  "lundi première heure",
  "avant la réunion de 14h"
];

const AUDIENCES = [
  "le comité de direction",
  "le board",
  "le CEO",
  "l'équipe",
  "les investisseurs",
  "le client",
  "le Partner"
];

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS DE SÉLECTION INTELLIGENTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sélectionne un manager adapté au métier et niveau
 */
function selectManager(metier, niveau) {
  const metierKey = metier?.toLowerCase() || 'general';
  const managers = MANAGERS[metierKey] || MANAGERS.general;
  
  // Filtrer par niveau si spécifié
  if (niveau) {
    const filtered = managers.filter(m => m.niveau_exigence === niveau);
    if (filtered.length > 0) {
      return filtered[Math.floor(Math.random() * filtered.length)];
    }
  }
  
  return managers[Math.floor(Math.random() * managers.length)];
}

/**
 * Sélectionne une entreprise adaptée au métier
 */
function selectEntreprise(metier) {
  const mapping = {
    finance: 'tech_saas',
    commercial: 'distribution_b2b',
    vente: 'distribution_b2b',
    marketing: 'tech_saas',
    rh: 'tech_saas',
    comptabilite: 'conseil'
  };
  
  const key = mapping[metier?.toLowerCase()] || 'distribution_b2b';
  const entreprises = ENTREPRISES[key] || ENTREPRISES.distribution_b2b;
  
  return entreprises[Math.floor(Math.random() * entreprises.length)];
}

/**
 * Génère une deadline réaliste
 */
function generateDeadline() {
  return DEADLINES[Math.floor(Math.random() * DEADLINES.length)];
}

/**
 * Génère une audience
 */
function generateAudience() {
  return AUDIENCES[Math.floor(Math.random() * AUDIENCES.length)];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTEUR DE PROMPT V2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Construit le prompt optimisé V2 pour Claude
 * @param {Object} options
 * @param {string|number} options.competence - Nom ou ID de la compétence
 * @param {Object} options.stats - Stats pré-calculées du dataset
 * @param {Object} options.learnerState - État de l'apprenant
 * @param {string} options.exerciseType - discovery | consolidation | remediation | autonomy
 * @param {string} options.metier - Métier de l'utilisateur
 * @returns {string} Prompt optimisé
 */
export function buildOptimizedPromptV2(options) {
  const {
    competence,
    stats,
    learnerState,
    exerciseType = 'consolidation',
    metier = null,
    progressionLevel = 'standard',
    exercicesReussis = 0
  } = options;
  
  // NOUVEAU : Utiliser le prompt simplifié pour discovery et remediation
  // Cela réduit de ~4000 tokens à ~1500 tokens (économie ~60%)
  if (exerciseType === 'discovery' || exerciseType === 'remediation' || progressionLevel === 'discovery') {
    console.log(`📝 [PromptBuilder] Utilisation prompt SIMPLIFIÉ pour ${exerciseType}`);
    return buildSimplifiedPrompt({
      competence,
      stats,
      exerciseType,
      metier: metier || learnerState?.profile?.contexte_metier || 'ventes'
    });
  }
  
  // 1. Récupérer les infos de compétence
  let compInfo;
  if (typeof competence === 'object' && competence !== null && competence.id) {
    // Déjà un objet compétence
    compInfo = competence;
  } else if (typeof competence === 'number') {
    compInfo = findCompetenceById(competence);
  } else {
    compInfo = findCompetence(competence);
  }
  
  if (!compInfo) {
    throw new Error(`Compétence non trouvée: ${competence}`);
  }
  
  const validationInfo = getValidationInfo(compInfo.id);
  
  // 2. Sélectionner le contexte
  const userMetier = metier || learnerState?.profile?.contexte_metier || 'ventes';
  const userNiveau = learnerState?.profile?.niveau || getNiveauFromCompetence(compInfo);
  
  const manager = selectManager(userMetier, userNiveau);
  const entreprise = selectEntreprise(userMetier);
  const deadline = generateDeadline();
  const audience = generateAudience();
  
  // 3. Construire les sections du prompt
  const sections = [
    buildSystemSectionV2(compInfo, manager),
    buildContextSection(manager, entreprise, deadline, audience),
    buildDataSectionV2(stats, entreprise),
    buildCompetenceSectionV2(compInfo, validationInfo),
    buildExerciseTypeSection(exerciseType, progressionLevel, exercicesReussis), // NOUVEAU
    buildTemplatesSection(compInfo, stats, exercicesReussis), // NOUVEAU Phase 2
    buildLearnerSectionV2(learnerState, exerciseType),
    buildOutputSectionV2(compInfo, validationInfo, stats, manager),
    buildQualityChecklist()
  ];
  
  return sections.join('\n\n');
}

function getNiveauFromCompetence(compInfo) {
  if (compInfo.niveau <= 10) return 'debutant';
  if (compInfo.niveau <= 25) return 'intermediaire';
  return 'avance';
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTIONS DU PROMPT V2
// ═══════════════════════════════════════════════════════════════════════════

function buildSystemSectionV2(compInfo, manager) {
  return `# MISSION

Tu es le générateur d'exercices Socrate. Tu crées des exercices Excel immersifs et professionnels.

**Compétence à enseigner** : ${compInfo.nom}
**Manager dans l'exercice** : ${manager.nom} (${manager.poste})

## RÈGLES ABSOLUES

1. **CONTEXTE IMMERSIF** : L'utilisateur doit se sentir au bureau, avec un vrai manager, une vraie deadline
2. **NE CALCULE PAS** : Utilise "computation" pour définir COMMENT calculer, le code fera le calcul
3. **PROGRESSION LOGIQUE** : Les étapes doivent s'enchaîner naturellement (comprendre → analyser → synthétiser)
4. **3 INDICES PAR CHECKPOINT** : Vague → Précis → Solution
5. **FEEDBACK DU MANAGER** : Le manager réagit à la fin (succès/partiel/échec)`;
}

function buildContextSection(manager, entreprise, deadline, audience) {
  return `## CONTEXTE À UTILISER

**Entreprise** : ${entreprise.nom}
- Secteur : ${entreprise.secteur}
- Description : ${entreprise.description}
- Effectif : ${entreprise.effectif} personnes
- Localisation : ${entreprise.localisation}

**Manager** : ${manager.nom}
- Poste : ${manager.poste}
- Personnalité : ${manager.personnalite}
- Citation typique : "${manager.citation}"

**Paramètres de la mission** :
- Deadline : ${deadline}
- Audience du livrable : ${audience}

Tu dois créer un contexte qui utilise ces éléments pour rendre l'exercice vivant et réaliste.`;
}

function buildDataSectionV2(stats, entreprise) {
  const formattedStats = formatStatsForPrompt(stats);
  
  // ═══════════════════════════════════════════════════════════════════════
  // NOUVEAU (Phase 1 - T1.2.1) : Informations explicites sur les plages
  // ═══════════════════════════════════════════════════════════════════════
  const rowCount = stats.rowCount || 0;
  const dataEndRow = rowCount + 1; // +1 car ligne 1 = headers
  
  // Construire la liste des colonnes avec leurs lettres
  const columnsList = [
    ...stats.numericColumns.map(c => `${c.name} (colonne ${c.letter}, numérique)`),
    ...stats.textColumns.map(c => `${c.name} (colonne ${c.letter}, texte, ${c.uniqueCount} valeurs uniques)`)
  ].join('\n- ');
  
  return `## DONNÉES DISPONIBLES

### INFORMATIONS CRITIQUES SUR LES DONNÉES
⚠️ **NOMBRE DE LIGNES** : ${rowCount} lignes de données
⚠️ **PLAGE COMPLÈTE** : Ligne 2 (après les headers) à ligne ${dataEndRow}
⚠️ **EXEMPLE DE PLAGE** : Si colonne E contient des montants → E2:E${dataEndRow}

### COLONNES DISPONIBLES
- ${columnsList}

${formattedStats}

**Vocabulaire métier à utiliser** : ${entreprise.vocabulaire?.join(', ') || 'standard'}

### RÈGLES IMPORTANTES POUR LES FORMULES
1. Les headers sont en ligne 1, les données commencent en ligne 2
2. Utilise TOUJOURS la plage complète : ligne 2 à ligne ${dataEndRow}
3. Exemple correct : =SOMME(E2:E${dataEndRow}) pour sommer TOUTE la colonne E
4. Exemple INCORRECT : =SOMME(E2:E36) si tu as ${rowCount} lignes → utilise E2:E${dataEndRow}

⚠️ Tu n'as PAS accès aux données brutes. Utilise les statistiques pour concevoir l'exercice.
⚠️ Les cellules de résultat doivent être SOUS les données (ex: en ligne ${dataEndRow + 2} minimum)`;
}

function buildCompetenceSectionV2(compInfo, validationInfo) {
  const conceptsCles = compInfo.concepts_cles || [];
  const erreursFrequentes = compInfo.erreurs_frequentes || [];
  
  let section = `## COMPÉTENCE CIBLE

**${compInfo.nom}** (ID: ${compInfo.id}, niveau ${compInfo.niveau})

### Ce que l'utilisateur doit apprendre :
${conceptsCles.map(c => `✓ ${c}`).join('\n')}

### Erreurs classiques à éviter (intègre-les dans les indices) :
${erreursFrequentes.map(e => `⚠️ ${e}`).join('\n')}`;

  if (compInfo.prerequis && compInfo.prerequis.length > 0) {
    const prereqNames = compInfo.prerequis.map(id => {
      const prereq = findCompetenceById(id);
      return prereq ? prereq.nom : `#${id}`;
    });
    section += `\n\n### Prérequis supposés maîtrisés : ${prereqNames.join(', ')}`;
  }
  
  return section;
}

/**
 * NOUVEAU : Section qui différencie les types d'exercices
 * Donne des instructions claires à Claude selon le contexte pédagogique
 */
function buildExerciseTypeSection(exerciseType, progressionLevel, exercicesReussis) {
  const configs = {
    discovery: {
      titre: '🌱 DÉCOUVERTE',
      description: "C'est le PREMIER contact de l'apprenant avec cette compétence.",
      regles: [
        'Contexte TRÈS simple et rassurant',
        'Maximum 2-3 checkpoints',
        'Indices TRÈS guidants (presque la solution)',
        'Données épurées, sans cas particuliers',
        'Consignes ultra-détaillées, étape par étape',
        'Ton encourageant, célébrer chaque petite victoire'
      ],
      checkpointsCount: '2-3',
      indicesStyle: 'Très guidants, presque la réponse'
    },
    
    learning: {
      titre: '📚 APPRENTISSAGE',
      description: `L'apprenant a réussi ${exercicesReussis} exercice(s) sur cette compétence.`,
      regles: [
        'Contexte réaliste mais pas trop complexe',
        '3-4 checkpoints progressifs',
        'Indices qui guident sans donner la réponse',
        'Introduire 1 variation par rapport à la découverte',
        'Consignes claires avec un peu moins de détail'
      ],
      checkpointsCount: '3-4',
      indicesStyle: 'Guidants mais pas la solution directe'
    },
    
    consolidation: {
      titre: '🔧 CONSOLIDATION',
      description: `L'apprenant a réussi ${exercicesReussis} exercices. Il consolide ses acquis.`,
      regles: [
        'Contexte professionnel réaliste',
        '4-5 checkpoints avec variations',
        'Indices progressifs (vague → précis → solution)',
        'Inclure des critères multiples si pertinent',
        'Quelques pièges légers pour vérifier la compréhension',
        'Ton professionnel du manager'
      ],
      checkpointsCount: '4-5',
      indicesStyle: 'Progressifs classiques'
    },
    
    remediation: {
      titre: '🔄 REMÉDIATION',
      description: "L'apprenant a des difficultés. Focus sur les erreurs passées.",
      regles: [
        'Contexte simplifié, focus sur UN concept clé',
        '3-4 checkpoints ciblés sur les erreurs fréquentes',
        'Indices très pédagogiques expliquant le POURQUOI',
        'Éviter les pièges, on veut reconstruire la confiance',
        'Feedback encourageant même en cas d\'erreur',
        'Décomposer les étapes complexes'
      ],
      checkpointsCount: '3-4',
      indicesStyle: 'Très pédagogiques, expliquent le pourquoi'
    },
    
    mastery: {
      titre: '🎯 MAÎTRISE',
      description: `L'apprenant a réussi ${exercicesReussis} exercices. Il approche la maîtrise.`,
      regles: [
        'Contexte professionnel complet avec enjeux',
        '5-6 checkpoints incluant des cas limites',
        'Indices minimaux au début, plus détaillés si besoin',
        'Inclure des données avec outliers ou cas particuliers',
        'Attentes élevées du manager',
        'Vérifier la robustesse (formules qui marchent sur toute la plage)'
      ],
      checkpointsCount: '5-6',
      indicesStyle: 'Minimaux puis détaillés'
    },
    
    autonomy: {
      titre: '🚀 AUTONOMIE',
      description: `L'apprenant a réussi ${exercicesReussis}+ exercices. Il doit être autonome.`,
      regles: [
        'Contexte professionnel RÉEL avec pression',
        '5-7 checkpoints, conditions de travail réelles',
        'Indices UNIQUEMENT pour débloquer (pas de guidage)',
        'Données complexes avec tous les cas de figure',
        'Le manager attend un travail de qualité pro',
        'Tester la capacité à gérer l\'imprévu'
      ],
      checkpointsCount: '5-7',
      indicesStyle: 'Minimaux, juste pour débloquer'
    }
  };
  
  // Déterminer la config à utiliser
  let configKey = exerciseType;
  if (exerciseType === 'consolidation' && progressionLevel) {
    // Utiliser le niveau de progression si disponible
    if (progressionLevel === 'discovery') configKey = 'discovery';
    else if (progressionLevel === 'learning') configKey = 'learning';
    else if (progressionLevel === 'mastery') configKey = 'mastery';
    else if (progressionLevel === 'autonomy') configKey = 'autonomy';
  }
  
  const config = configs[configKey] || configs.consolidation;
  
  return `## ${config.titre} - TYPE D'EXERCICE

${config.description}

### RÈGLES OBLIGATOIRES POUR CE TYPE :
${config.regles.map((r, i) => `${i + 1}. ${r}`).join('\n')}

### PARAMÈTRES :
- **Nombre de checkpoints** : ${config.checkpointsCount}
- **Style des indices** : ${config.indicesStyle}
- **Progression** : ${progressionLevel} (${exercicesReussis} exercices réussis sur cette compétence)

⚠️ RESPECTE CES RÈGLES - elles sont adaptées au niveau de l'apprenant sur CETTE compétence.`;
}

/**
 * NOUVEAU (Phase 2 - T2.2) : Section templates de checkpoints
 * Fournit à Claude des exemples VALIDÉS de checkpoints pour cette compétence
 */
function buildTemplatesSection(compInfo, stats, exercicesReussis = 0) {
  // Récupérer les templates adaptés au niveau
  const templates = getTemplatesForProgression(compInfo.id, exercicesReussis);
  
  if (!templates || templates.length === 0) {
    return ''; // Pas de templates pour cette compétence
  }
  
  const progressionLevel = getProgressionLevel(exercicesReussis);
  
  // Préparer les variables de substitution pour les exemples
  const numericCols = stats.numericColumns || [];
  const textCols = stats.textColumns || [];
  const numCol = numericCols[0] || { name: 'Montant', letter: 'D' };
  const textCol = textCols[0] || { name: 'Catégorie', letter: 'A' };
  const criteriaValue = textCol.mostCommon?.[0]?.value || textCol.uniqueValues?.[0] || 'Exemple';
  const rowCount = stats.rowCount || 50;
  const dataEndRow = rowCount + 1;
  
  // Générer des exemples de checkpoints
  const checkpointExamples = templates.slice(0, 2).map((template, idx) => {
    // Substituer les variables dans le template
    const computation = substituteTemplateVars(template.computation_template, {
      COLUMN_NAME: numCol.name,
      CRITERIA_COLUMN: textCol.name,
      CRITERIA_VALUE: criteriaValue,
      SUM_COLUMN: numCol.name,
      SEARCH_COLUMN: textCol.name,
      SEARCH_VALUE: criteriaValue,
      RETURN_COLUMN: numCol.name,
      COLUMN_NAME_2: (numericCols[1] || numCol).name
    });
    
    return `    // Exemple ${idx + 1}: ${template.template_id}
    {
      "id": "cp_${idx + 1}",
      "cellule": "D${dataEndRow + 2 + idx}",
      "type": "${template.type}",
      "description": "${substituteTemplateVars(template.description_template, {
        COLUMN_DESC: numCol.name.toLowerCase(),
        CRITERIA_VALUE: criteriaValue,
        SUM_COLUMN_DESC: numCol.name.toLowerCase()
      })}",
      "competence_id": ${compInfo.id},
      "fonction": "${template.fonction}",
      "computation": ${JSON.stringify(computation, null, 8).split('\n').map((l, i) => i === 0 ? l : '      ' + l).join('\n')},
      "points": ${template.points_default},
      "indices": ${JSON.stringify(substituteTemplateVars(template.indices_template, {
        COL: numCol.letter,
        START: '2',
        END: String(dataEndRow),
        COLUMN_DESC: numCol.name.toLowerCase(),
        CRIT_COL: textCol.letter,
        SUM_COL: numCol.letter,
        CRITERIA_VALUE: criteriaValue
      }), null, 8).split('\n').map((l, i) => i === 0 ? l : '      ' + l).join('\n')}
    }`;
  });
  
  return `## TEMPLATES DE CHECKPOINTS VALIDÉS (UTILISE-LES !)

⚠️ **IMPORTANT** : Ces templates sont VALIDÉS et TESTÉS. Utilise-les comme base pour tes checkpoints.

**Niveau actuel** : ${progressionLevel} (${exercicesReussis} exercices réussis)
**Templates disponibles** : ${templates.map(t => t.template_id).join(', ')}

### EXEMPLES DE CHECKPOINTS POUR ${compInfo.nom.toUpperCase()}

\`\`\`json
[
${checkpointExamples.join(',\n')}
]
\`\`\`

### COLONNES DISPONIBLES POUR LES FORMULES
- **Colonnes numériques** : ${numericCols.map(c => `${c.name} (${c.letter})`).join(', ') || 'aucune'}
- **Colonnes texte** : ${textCols.map(c => `${c.name} (${c.letter})`).join(', ') || 'aucune'}
- **Valeurs critère possibles** : ${textCols[0]?.mostCommon?.slice(0, 5).map(v => `"${v.value}"`).join(', ') || '"exemple"'}
- **Plage complète** : ligne 2 à ligne ${dataEndRow}

📌 **RÈGLE** : Adapte ces templates à ton contexte mais GARDE la structure computation !`;
}

/**
 * Substitue les variables {VAR} dans un template
 */
function substituteTemplateVars(template, vars) {
  if (typeof template === 'string') {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }
  if (Array.isArray(template)) {
    return template.map(item => substituteTemplateVars(item, vars));
  }
  if (typeof template === 'object' && template !== null) {
    const result = {};
    for (const [k, v] of Object.entries(template)) {
      result[k] = substituteTemplateVars(v, vars);
    }
    return result;
  }
  return template;
}

function buildLearnerSectionV2(learnerState, exerciseType) {
  if (!learnerState) {
    return `## PROFIL APPRENANT

- Type d'exercice : ${exerciseType}
- Niveau : intermédiaire (par défaut)
- Adapter le ton et la difficulté en conséquence`;
  }
  
  const { profile, frictionPoints, recentPerformance, metrics } = learnerState;
  
  let section = `## PROFIL APPRENANT

- Niveau déclaré : ${profile?.niveau || 'intermédiaire'}
- Métier : ${profile?.contexte_metier || 'Non spécifié'}
- Type d'exercice : ${exerciseType}`;

  if (recentPerformance?.avgScore > 0) {
    section += `\n- Performance récente : ${recentPerformance.avgScore}% (tendance: ${recentPerformance.trend})`;
  }
  
  if (frictionPoints && frictionPoints.length > 0) {
    section += `\n\n**Points de friction à adresser** :`;
    frictionPoints.slice(0, 3).forEach(fp => {
      section += `\n- ${fp.type}`;
    });
  }
  
  if (metrics?.hintsDependency > 0.5) {
    section += `\n\n⚠️ Cet apprenant utilise beaucoup les indices → consignes TRÈS claires nécessaires`;
  }
  
  return section;
}

function buildOutputSectionV2(compInfo, validationInfo, stats, manager) {
  const computationExample = getComputationExampleV2(compInfo, stats);
  const isAuto = isFullyAutomatable(compInfo.id);
  const isGraphique = validationInfo?.needsScreenshot && validationInfo?.checkpointTypes?.includes('graphique');
  
  // Checkpoint exemple selon le type
  let checkpointExample;
  
  if (isGraphique) {
    // Checkpoint pour graphique
    checkpointExample = `    {
      "id": "cp_graph_1",
      "type": "graphique",
      "validation_type": "visual",
      "description": "Créer un graphique [type] représentant [données]",
      "competence_id": ${compInfo.id},
      "graph_type": "[camembert|histogramme|courbe|combine|sparklines]",
      "requires_screenshot": true,
      "expected_data": {
        "description": "Le graphique doit montrer [ce qui doit être visible]",
        "categories": ["Liste", "des", "catégories"],
        "key_values": ["Valeurs", "importantes"]
      },
      "points": 50,
      "indices": [
        "Sélectionne tes données et va dans Insertion > Graphiques",
        "Choisis le type [X] et vérifie les plages de données",
        "Insertion > Graphique > [Type exact] puis ajouter titre et légende"
      ]
    }`;
  } else {
    // Checkpoint standard (formule)
    checkpointExample = `    {
      "id": "cp_1",
      "cellule": "[FEUILLE!]CELLULE",
      "type": "formule",
      "description": "[Description courte et claire]",
      "competence_id": ${compInfo.id},
      "fonction": "${getMainFunction(compInfo)}",
${computationExample}
      "points": 25,
      "indices": [
        "[Indice vague - direction générale]",
        "[Indice précis - éléments clés de la solution]",
        "[=SOLUTION COMPLETE]"
      ],
      "erreurs_probables": [
        {"type": "[type_erreur]", "message": "[Explication si cette erreur est détectée]"}
      ]
    }`;
  }
  
  return `## FORMAT DE SORTIE (JSON STRICT)

\`\`\`json
{
  "titre": "Titre court et engageant (max 60 caractères)",
  
  "contexte": {
    "situation": "Tu es [rôle] chez ${manager.entreprise_type || "l'entreprise"}. [Situation en 2-3 phrases immersives]",
    "manager": {
      "nom": "${manager.nom}",
      "poste": "${manager.poste}",
      "demande": "[Ce que le manager demande, avec son style]"
    },
    "enjeux": "[Pourquoi c'est important, quelles conséquences]",
    "deadline": "[Deadline réaliste]"
  },
  
  "presentation_donnees": "[1-2 phrases sur ce que représentent les données]",
  
  "etapes": [
    {
      "phase": "A. [Nom de la phase]",
      "objectif": "[Ce qu'on veut accomplir]",
      "consignes": [
        "En [CELLULE], [action précise]",
        "..."
      ]
    },
    {
      "phase": "B. [Nom de la phase]",
      "objectif": "[Ce qu'on veut accomplir]",
      "consignes": [...]
    }
  ],
  
  "checkpoints": [
${checkpointExample}
  ],
  
  "scoring": {
    "total_points": 100,
    "seuil_reussite": 70,
    "seuil_maitrise": 90
  },
  
  "feedback_manager": {
    "succes": "${manager.feedbacks.succes}",
    "partiel": "${manager.feedbacks.partiel}",
    "echec": "${manager.feedbacks.echec}"
  },
  
  "socrate_message": {
    "intro": "[Message d'introduction motivant]",
    "conclusion": "[Message de conclusion personnalisé]"
  }
}
\`\`\`

### RÈGLES CHECKPOINTS :
- Total des points = 100 exactement
${isGraphique 
  ? `- Pour les GRAPHIQUES : utilise "graph_type" et "requires_screenshot": true
- Types disponibles : camembert, histogramme, courbe, combine, sparklines
- Décris dans "expected_data" ce que le graphique doit montrer`
  : `- ${isAuto ? 'OBLIGATOIRE : utilise "computation" pour chaque checkpoint' : 'Cette compétence nécessite validation manuelle'}`
}
- 3 indices OBLIGATOIRES par checkpoint (vague → précis → solution)
- Au moins 1 erreur_probable par checkpoint (sauf graphiques)`;
}

function buildQualityChecklist() {
  return `## CHECKLIST QUALITÉ (vérifie avant de générer)

□ Le contexte donne envie de faire l'exercice ?
□ On comprend qui est le manager et ce qu'il attend ?
□ Les données ont du sens dans ce contexte ?
□ Les étapes progressent logiquement ?
□ Chaque checkpoint a 3 indices de qualité ?
□ Le total des points = 100 ?
□ Le feedback du manager est cohérent avec sa personnalité ?

Si une case n'est pas cochée, améliore avant de soumettre.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS V2
// ═══════════════════════════════════════════════════════════════════════════

function getMainFunction(compInfo) {
  const functionMap = {
    'SOMME': 'SOMME',
    'MOYENNE': 'MOYENNE',
    'MIN/MAX': 'MIN',
    'SI simple': 'SI',
    'SI imbriqués': 'SI',
    'NB.SI': 'NB.SI',
    'NB.SI.ENS': 'NB.SI.ENS',
    'SOMME.SI': 'SOMME.SI',
    'SOMME.SI.ENS': 'SOMME.SI.ENS',
    'RECHERCHEV': 'RECHERCHEV',
    'RECHERCHEV approchée': 'RECHERCHEV',
    'RECHERCHEH': 'RECHERCHEH',
    'INDEX+EQUIV': 'INDEX',
    'CONCATENER / CONCAT': 'CONCATENER',
    'SIERREUR': 'SIERREUR',
    'SOMMEPROD': 'SOMMEPROD',
    'INDIRECT': 'INDIRECT'
  };
  
  return functionMap[compInfo.nom] || null;
}

function getComputationExampleV2(compInfo, stats) {
  // ═══════════════════════════════════════════════════════════════════════
  // AMÉLIORATION (Phase 1 - T1.1.2) : Utiliser les VRAIS noms de colonnes
  // ═══════════════════════════════════════════════════════════════════════
  
  // Extraire les colonnes disponibles avec leurs vraies valeurs
  const numericCols = stats.numericColumns || [];
  const textCols = stats.textColumns || [];
  
  // Sélectionner les meilleures colonnes
  const numCol = numericCols[0]?.name || 'Montant';
  const numCol2 = numericCols[1]?.name || numCol;
  const textCol = textCols[0]?.name || 'Catégorie';
  
  // Obtenir une vraie valeur de critère (première valeur unique de la colonne texte)
  const textValue = textCols[0]?.mostCommon?.[0]?.value || 
                    textCols[0]?.uniqueValues?.[0] || 
                    'Valeur';
  
  // Obtenir les lettres de colonnes pour les plages
  const numColLetter = numericCols[0]?.letter || 'E';
  const textColLetter = textCols[0]?.letter || 'A';
  const rowCount = stats.rowCount || 50;
  const dataEndRow = rowCount + 1;
  
  // Note importante à ajouter au prompt
  const importantNote = `
      // ⚠️ UTILISE CES VRAIS NOMS - NE PAS utiliser "auto" !
      // Colonnes numériques disponibles: ${numericCols.map(c => c.name).join(', ') || 'aucune'}
      // Colonnes texte disponibles: ${textCols.map(c => c.name).join(', ') || 'aucune'}`;
  
  const templates = {
    'SOMME': `      "computation": { "type": "sum", "column": "${numCol}" },${importantNote}`,
    
    'MOYENNE': `      "computation": { "type": "average", "column": "${numCol}" },${importantNote}`,
    
    'MIN/MAX': `      "computation": { "type": "min", "column": "${numCol}" },
      // ou "type": "max" pour la valeur maximale${importantNote}`,
    
    'NB.SI': `      "computation": { 
        "type": "countif", 
        "column": "${textCol}",           // Colonne où chercher
        "criteria": "${textValue}"        // Valeur à compter
      },${importantNote}`,
    
    'NB.SI.ENS': `      "computation": { 
        "type": "countifs", 
        "criteria_list": [
          { "column": "${textCol}", "criteria": "${textValue}" }
          // Ajouter d'autres critères si nécessaire
        ] 
      },${importantNote}`,
    
    'SOMME.SI': `      "computation": { 
        "type": "sumif", 
        "criteria_column": "${textCol}",  // Colonne où chercher le critère
        "criteria": "${textValue}",       // Valeur à chercher
        "sum_column": "${numCol}"         // Colonne à sommer
      },${importantNote}`,
    
    'SOMME.SI.ENS': `      "computation": { 
        "type": "sumifs", 
        "sum_column": "${numCol}",        // Colonne à sommer
        "criteria_list": [
          { "column": "${textCol}", "criteria": "${textValue}" }
        ] 
      },${importantNote}`,
    
    'RECHERCHEV': `      "computation": { 
        "type": "lookup", 
        "search_value": "${textValue}",   // Valeur à chercher
        "search_column": "${textCol}",    // Colonne de recherche
        "return_column": "${numCol}",     // Colonne de résultat
        "approximate": false              // false = correspondance exacte
      },${importantNote}`,
    
    'RECHERCHEV approchée': `      "computation": { 
        "type": "lookup_approx", 
        "search_value": 100,              // Valeur à chercher (nombre pour approché)
        "search_column": "${numCol}",     // Colonne de recherche (doit être triée)
        "return_column": "${numCol2}"     // Colonne de résultat
      },${importantNote}`,
    
    'INDEX+EQUIV': `      "computation": { 
        "type": "index_match", 
        "search_value": "${textValue}",   // Valeur à chercher
        "search_column": "${textCol}",    // Colonne de recherche
        "return_column": "${numCol}"      // Colonne de résultat
      },${importantNote}`,
    
    'SI simple': `      "computation": { 
        "type": "conditional", 
        "column": "${numCol}",            // Colonne à tester
        "condition": ">1000",             // Condition (ex: >100, <=50, ="Paris")
        "value_if_true": "Oui", 
        "value_if_false": "Non" 
      },${importantNote}`,
    
    'MOYENNE.SI': `      "computation": { 
        "type": "averageif", 
        "criteria_column": "${textCol}",  // Colonne du critère
        "criteria": "${textValue}",       // Critère
        "average_column": "${numCol}"     // Colonne à moyenner
      },${importantNote}`,
    
    'SOMMEPROD': `      "computation": { 
        "type": "sumproduct", 
        "columns": ["${numCol}", "${numCol2}"]  // Colonnes à multiplier puis sommer
      },${importantNote}`
  };
  
  for (const [key, template] of Object.entries(templates)) {
    if (compInfo.nom.includes(key) || key.includes(compInfo.nom)) {
      return template;
    }
  }
  
  return `      "computation": { "type": "manual", "expected_value": null },
      // Type "manual" : le code ne calculera pas automatiquement la valeur attendue
      // Tu devras peut-être spécifier expected_value manuellement`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT POUR FEEDBACK V2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Construit le prompt pour générer un feedback enrichi
 */
export function buildFeedbackPromptV2(options) {
  const { exercise, validationResults, learnerState, attemptNumber } = options;
  
  const passedCount = validationResults.filter(r => r.passed).length;
  const totalCount = validationResults.length;
  const score = Math.round(passedCount / totalCount * 100);
  
  const errors = validationResults
    .filter(r => !r.passed)
    .map(r => ({
      checkpoint: r.checkpoint,
      issue: r.feedback || 'Valeur incorrecte',
      userValue: r.userValue,
      expectedValue: r.expectedValue,
      erreursProbables: r.checkpoint?.erreurs_probables || []
    }));
  
  const competenceIds = [...new Set(exercise.checkpoints.map(cp => cp.competence_id))];
  const competences = competenceIds.map(id => findCompetenceById(id)).filter(Boolean);
  
  const manager = exercise.contexte?.manager || { nom: 'Le manager', feedbacks: {} };
  
  return `# GÉNÉRATION DE FEEDBACK SOCRATIQUE

## CONTEXTE
- Exercice : ${exercise.titre}
- Manager : ${manager.nom}
- Tentative n°${attemptNumber || 1}
- Score : ${score}% (${passedCount}/${totalCount})

## ERREURS DÉTECTÉES
${errors.length === 0 ? '✅ Aucune erreur !' : errors.map(e => `
**${e.checkpoint.description}**
- Valeur attendue : ${e.expectedValue}
- Valeur obtenue : ${e.userValue}
- Erreurs probables connues : ${e.erreursProbables.map(ep => ep.type).join(', ') || 'aucune'}
`).join('')}

## ERREURS FRÉQUENTES (référentiel)
${competences.map(c => `
**${c.nom}** :
${(c.erreurs_frequentes || []).map(e => `- ${e}`).join('\n')}
`).join('\n')}

## TA MISSION

Génère un JSON avec le feedback :

\`\`\`json
{
  "score_final": ${score},
  "niveau_atteint": "${score >= 90 ? 'réussi' : score >= 70 ? 'partiel' : 'à_retravailler'}",
  
  "message_manager": "${score >= 90 ? (manager.feedbacks?.succes || 'Bien joué !') : score >= 70 ? (manager.feedbacks?.partiel || 'Pas mal, quelques ajustements.') : (manager.feedbacks?.echec || 'Il faut reprendre.')}",
  
  "feedback_global": "[2-3 phrases constructives et encourageantes]",
  
  "analyse_erreurs": [
    {
      "checkpoint": "[description]",
      "erreur_detectee": "[type d'erreur identifié]",
      "explication": "[Pourquoi c'est faux, en 1-2 phrases simples]",
      "conseil": "[Comment corriger]"
    }
  ],
  
  "points_positifs": ["[Ce qui est bien fait]"],
  
  "prochaine_etape": "[Suggestion concrète pour progresser]"
}
\`\`\`

Sois bienveillant et pédagogique. L'objectif est d'aider, pas de juger.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT SIMPLIFIÉ POUR DISCOVERY / REMEDIATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Construit un prompt SIMPLIFIÉ pour les exercices discovery et remediation
 * Réduit de ~4000 tokens à ~1500 tokens
 * 
 * @param {Object} options - Mêmes options que buildOptimizedPromptV2
 * @returns {string} Prompt simplifié
 */
function buildSimplifiedPrompt(options) {
  const {
    competence,
    stats,
    exerciseType,
    metier = 'ventes'
  } = options;
  
  // Récupérer les infos de compétence
  let compInfo;
  if (typeof competence === 'object' && competence !== null && competence.id) {
    compInfo = competence;
  } else if (typeof competence === 'number') {
    compInfo = findCompetenceById(competence);
  } else {
    compInfo = findCompetence(competence);
  }
  
  if (!compInfo) {
    throw new Error(`Compétence non trouvée: ${competence}`);
  }
  
  const validationInfo = getValidationInfo(compInfo.id);
  const isAuto = isFullyAutomatable(compInfo.id);
  
  // Sélectionner un manager simple
  const manager = selectManager(metier, 'debutant');
  
  // Stats simplifiées
  const numericCols = stats.numericColumns?.slice(0, 2) || [];
  const textCols = stats.textColumns?.slice(0, 2) || [];
  
  const isDiscovery = exerciseType === 'discovery';
  const checkpointCount = isDiscovery ? '2' : '3';
  
  // Computation exemple simplifié
  const computationExample = getSimplifiedComputationExample(compInfo);
  
  return `# EXERCICE ${isDiscovery ? 'DÉCOUVERTE' : 'REMÉDIATION'} - ${compInfo.nom}

## MISSION
Crée un exercice Excel SIMPLE pour ${isDiscovery ? 'découvrir' : 'retravailler'} ${compInfo.nom}.

## DONNÉES DISPONIBLES
- ${stats.rowCount} lignes
- Colonnes numériques : ${numericCols.map(c => `${c.name} (${c.min}-${c.max})`).join(', ') || 'aucune'}
- Colonnes texte : ${textCols.map(c => `${c.name} (${c.uniqueCount} valeurs)`).join(', ') || 'aucune'}

## RÈGLES ${isDiscovery ? 'DÉCOUVERTE' : 'REMÉDIATION'}
${isDiscovery ? `- Contexte SIMPLE et rassurant
- Seulement ${checkpointCount} checkpoints
- Indices TRÈS guidants (presque la solution)
- Ton encourageant` : `- Focus sur UN concept clé
- ${checkpointCount} checkpoints ciblés
- Indices pédagogiques (expliquent le POURQUOI)
- Reconstruire la confiance`}

## FORMAT JSON

\`\`\`json
{
  "titre": "Titre simple (max 50 car)",
  "contexte": {
    "situation": "Tu es assistant(e) chez [entreprise]. ${manager.nom} te demande [tâche simple].",
    "manager": { "nom": "${manager.nom}", "poste": "${manager.poste}" },
    "enjeux": "[Pourquoi c'est utile]"
  },
  "presentation_donnees": "[1 phrase sur les données]",
  "etapes": [
    { "phase": "A. [Action]", "consignes": ["En [CELLULE], [instruction claire]"] }
  ],
  "checkpoints": [
    {
      "id": "cp_1",
      "cellule": "[CELLULE]",
      "type": "formule",
      "description": "[Description simple]",
      "competence_id": ${compInfo.id},
      "fonction": "${getMainFunction(compInfo)}",
${computationExample}
      "points": ${Math.round(100 / parseInt(checkpointCount))},
      "indices": [
        "[Indice 1 : direction]",
        "[Indice 2 : plus précis]",
        "[Indice 3 : =SOLUTION]"
      ]
    }
  ],
  "scoring": { "total_points": 100, "seuil_reussite": 60 },
  "feedback_manager": {
    "succes": "${manager.feedbacks?.succes || 'Bien joué !'}",
    "echec": "${manager.feedbacks?.echec || 'On reprend ensemble.'}"
  }
}
\`\`\`

${isAuto ? '⚠️ OBLIGATOIRE : "computation" pour chaque checkpoint' : ''}
Total points = 100. ${checkpointCount} checkpoints max.`;
}

/**
 * Génère un exemple de computation simplifié
 */
function getSimplifiedComputationExample(compInfo) {
  const examples = {
    3: '      "computation": { "type": "sum", "column": "[COLONNE_NUMERIQUE]" },',
    4: '      "computation": { "type": "average", "column": "[COLONNE_NUMERIQUE]" },',
    5: '      "computation": { "type": "min", "column": "[COLONNE_NUMERIQUE]" },',
    11: '      "computation": { "type": "countif", "column": "[COLONNE]", "criteria": "[VALEUR]" },',
    13: '      "computation": { "type": "sumif", "criteria_column": "[COL_CRITERE]", "criteria": "[VALEUR]", "sum_column": "[COL_SOMME]" },',
    18: '      "computation": { "type": "lookup", "search_value": "[VALEUR]", "search_column": "[COL_RECHERCHE]", "return_column": "[COL_RETOUR]" },',
    53: '      "computation": { "type": "lookup_approx", "search_value": "[VALEUR]", "search_column": "[COL_RECHERCHE]", "return_column": "[COL_RETOUR]" },'
  };
  
  return examples[compInfo.id] || '      "computation": { "type": "manual" },';
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  buildOptimizedPromptV2 as buildOptimizedPrompt,
  buildFeedbackPromptV2 as buildFeedbackPrompt,
  buildSimplifiedPrompt,
  selectManager,
  selectEntreprise,
  MANAGERS,
  ENTREPRISES
};

export default {
  buildOptimizedPrompt: buildOptimizedPromptV2,
  buildFeedbackPrompt: buildFeedbackPromptV2,
  buildSimplifiedPrompt,
  selectManager,
  selectEntreprise
};