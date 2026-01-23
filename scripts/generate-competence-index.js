#!/usr/bin/env node

/**
 * GÉNÉRATION DE L'INDEX CENTRALISÉ COMPÉTENCES ↔ TEMPLATES
 * 
 * Ce script génère automatiquement /shared/data/competenceIndex.js
 * à partir des templates JSON et de PEDAGOGIE.
 * 
 * Usage: node scripts/generate-competence-index.js
 * 
 * L'index généré est la source unique de vérité pour :
 * - Trouver les templates par compétence ID
 * - Résoudre les aliases de noms de compétences
 * - Connaître la couverture de chaque compétence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const EXERCISES_DIR = path.join(__dirname, '..', 'shared', 'data', 'exercises');
const OUTPUT_PATH = path.join(__dirname, '..', 'shared', 'data', 'competenceIndex.js');

// Définition des 58 compétences (extraites de pedagogie.js)
const COMPETENCES = {
  1: { key: 'SAISIE_DONNEES', nom: 'Saisie de données', niveau: 'debutant' },
  2: { key: 'FORMATAGE_CELLULES', nom: 'Formatage cellules', niveau: 'debutant' },
  3: { key: 'SOMME', nom: 'SOMME', niveau: 'debutant' },
  4: { key: 'MOYENNE', nom: 'MOYENNE', niveau: 'debutant' },
  5: { key: 'MIN_MAX', nom: 'MIN/MAX', niveau: 'debutant' },
  6: { key: 'COPIER_COLLER', nom: 'Copier-coller', niveau: 'debutant' },
  7: { key: 'TRI_SIMPLE', nom: 'Tri simple', niveau: 'debutant' },
  8: { key: 'FILTRES_BASIQUES', nom: 'Filtres basiques', niveau: 'debutant' },
  9: { key: 'SI', nom: 'SI', niveau: 'debutant' },
  10: { key: 'MFC_SIMPLE', nom: 'MFC simple', niveau: 'debutant' },
  11: { key: 'NB_SI', nom: 'NB.SI', niveau: 'intermediaire' },
  12: { key: 'NB_SI_ENS', nom: 'NB.SI.ENS', niveau: 'intermediaire' },
  13: { key: 'SOMME_SI', nom: 'SOMME.SI', niveau: 'intermediaire' },
  14: { key: 'SOMME_SI_ENS', nom: 'SOMME.SI.ENS', niveau: 'intermediaire' },
  15: { key: 'REFERENCES_ABSOLUES', nom: 'Références absolues', niveau: 'intermediaire' },
  16: { key: 'SI_IMBRIQUES', nom: 'SI imbriqués', niveau: 'intermediaire' },
  17: { key: 'FONCTIONS_TEXTE', nom: 'Fonctions texte', niveau: 'intermediaire' },
  18: { key: 'RECHERCHEV', nom: 'RECHERCHEV', niveau: 'intermediaire' },
  19: { key: 'CONCATENER', nom: 'CONCATENER', niveau: 'intermediaire' },
  20: { key: 'FONCTIONS_DATE', nom: 'Fonctions date', niveau: 'intermediaire' },
  21: { key: 'GRAPHIQUES_BASIQUES', nom: 'Graphiques basiques', niveau: 'intermediaire' },
  22: { key: 'SIERREUR', nom: 'SIERREUR', niveau: 'intermediaire' },
  23: { key: 'TCD_BASIQUE', nom: 'TCD basique', niveau: 'intermediaire' },
  24: { key: 'INDEX_EQUIV', nom: 'INDEX/EQUIV', niveau: 'intermediaire' },
  25: { key: 'VALIDATION_DONNEES', nom: 'Validation données', niveau: 'intermediaire' },
  26: { key: 'TCD_AVANCE', nom: 'TCD avancé', niveau: 'avance' },
  27: { key: 'TABLEAUX_STRUCTURES', nom: 'Tableaux structurés', niveau: 'avance' },
  28: { key: 'SOMMEPROD', nom: 'SOMMEPROD', niveau: 'avance' },
  29: { key: 'FORMULES_MATRICIELLES', nom: 'Formules matricielles', niveau: 'avance' },
  30: { key: 'INDIRECT', nom: 'INDIRECT', niveau: 'avance' },
  31: { key: 'GRAPHIQUES_AVANCES', nom: 'Graphiques avancés', niveau: 'avance' },
  32: { key: 'MFC_AVANCEE', nom: 'MFC avancée', niveau: 'avance' },
  33: { key: 'MACROS', nom: 'Macros', niveau: 'avance' },
  34: { key: 'VBA_BASIQUE', nom: 'VBA basique', niveau: 'avance' },
  35: { key: 'POWER_QUERY_IMPORT', nom: 'Power Query Import', niveau: 'avance' },
  36: { key: 'POWER_QUERY_TRANSFORM', nom: 'Power Query Transform', niveau: 'avance' },
  37: { key: 'POWER_QUERY_MERGE', nom: 'Power Query Merge', niveau: 'avance' },
  38: { key: 'RECHERCHEX', nom: 'RECHERCHEX', niveau: 'avance' },
  39: { key: 'FORMULES_DYNAMIQUES', nom: 'Formules dynamiques', niveau: 'avance' },
  40: { key: 'TABLEAUX_BORD', nom: 'Tableaux de bord', niveau: 'avance' },
  51: { key: 'REFERENCES_MIXTES', nom: 'Références mixtes', niveau: 'intermediaire' },
  52: { key: 'SERIES_AUTOMATIQUES', nom: 'Séries automatiques', niveau: 'debutant' },
  53: { key: 'RECHERCHEV_APPROCHEE', nom: 'RECHERCHEV approchée', niveau: 'intermediaire' },
  54: { key: 'RECHERCHEH', nom: 'RECHERCHEH', niveau: 'intermediaire' },
  55: { key: 'FONCTIONS_BD', nom: 'Fonctions BD', niveau: 'avance' },
  56: { key: 'REFERENCES_STRUCTUREES', nom: 'Références structurées', niveau: 'avance' },
  57: { key: 'FILTRES_AVANCES', nom: 'Filtres avancés', niveau: 'avance' },
  58: { key: 'COLLAGE_SPECIAL', nom: 'Collage spécial', niveau: 'debutant' }
};

// Aliases de noms de compétences → ID
// Permet la recherche flexible par différentes variantes de noms
const BASE_ALIASES = {
  // SOMME (3)
  'SOMME': 3, 'SUM': 3, 'Somme': 3, 'somme': 3,
  // MOYENNE (4)
  'MOYENNE': 4, 'AVERAGE': 4, 'Moyenne': 4, 'moyenne': 4,
  // MIN/MAX (5)
  'MIN': 5, 'MAX': 5, 'MIN_MAX': 5, 'Min/Max': 5, 'min': 5, 'max': 5,
  // Copier-coller (6)
  'COPIER_COLLER': 6, 'Copier-coller': 6, 'copier_coller': 6,
  // Tri (7)
  'TRI': 7, 'TRI_SIMPLE': 7, 'Tri simple': 7, 'tri': 7, 'Tri': 7,
  // Filtres (8)
  'FILTRES': 8, 'FILTRES_BASIQUES': 8, 'Filtres basiques': 8, 'filtres': 8, 'Filtres': 8,
  // SI (9)
  'SI': 9, 'IF': 9, 'Si': 9, 'si': 9, 'SI simple': 9,
  // MFC (10)
  'MFC': 10, 'MFC_SIMPLE': 10, 'MFC simple': 10, 'Mise en forme conditionnelle': 10,
  'mise_en_forme_conditionnelle': 10, 'Format conditionnel': 10,
  // NB.SI (11)
  'NB.SI': 11, 'NB_SI': 11, 'NBSI': 11, 'COUNTIF': 11, 'Comptage conditionnel': 11,
  // NB.SI.ENS (12)
  'NB.SI.ENS': 12, 'NB_SI_ENS': 12, 'NBSIENS': 12, 'COUNTIFS': 12, 'Comptage multi-critères': 12,
  // SOMME.SI (13)
  'SOMME.SI': 13, 'SOMME_SI': 13, 'SOMMESI': 13, 'SUMIF': 13,
  // SOMME.SI.ENS (14)
  'SOMME.SI.ENS': 14, 'SOMME_SI_ENS': 14, 'SOMMESIENS': 14, 'SUMIFS': 14, 'Somme multi-critères': 14,
  // Références absolues (15)
  'REFERENCES_ABSOLUES': 15, 'Références absolues': 15, 'references_absolues': 15,
  'Références absolues ($)': 15, '$': 15,
  // SI imbriqués (16)
  'SI_IMBRIQUES': 16, 'SI imbriqués': 16, 'Si imbriqués': 16, 'SI_imbriques': 16,
  'SI imbriquées': 16, 'Logique conditionnelle': 16,
  // Fonctions texte (17)
  'FONCTIONS_TEXTE': 17, 'Fonctions texte': 17, 'texte': 17, 'TEXTE': 17,
  'GAUCHE': 17, 'DROITE': 17, 'STXT': 17, 'NBCAR': 17, 'CHERCHE': 17,
  // RECHERCHEV (18)
  'RECHERCHEV': 18, 'VLOOKUP': 18, 'RechercheV': 18, 'recherchev': 18,
  // CONCATENER (19)
  'CONCATENER': 19, 'CONCAT': 19, 'Concatener': 19, 'concatener': 19,
  // Fonctions date (20)
  'FONCTIONS_DATE': 20, 'Fonctions date': 20, 'formules_date': 20, 'DATE': 20, 'DATES': 20,
  'JOUR': 20, 'MOIS': 20, 'ANNEE': 20, 'DATEDIF': 20, 'FIN.MOIS': 20, 'NB.JOURS.OUVRES': 20, 'JOURSEM': 20,
  // Graphiques basiques (21)
  'GRAPHIQUES_BASIQUES': 21, 'Graphiques basiques': 21, 'graphiques': 21, 'Graphiques': 21,
  'Graphiques simples': 21, 'Histogrammes': 21, 'Secteurs': 21, 'Courbes': 21,
  // SIERREUR (22)
  'SIERREUR': 22, 'IFERROR': 22, 'SI.ERREUR': 22, 'SiErreur': 22, 'Gestion des erreurs': 22,
  'Formules robustes': 22,
  // TCD basique (23)
  'TCD': 23, 'TCD_BASIQUE': 23, 'TCD basique': 23, 'Tableau croisé dynamique': 23,
  'Tableaux croisés dynamiques': 23, 'tableaux_croises_dynamiques': 23,
  // INDEX/EQUIV (24)
  'INDEX_EQUIV': 24, 'INDEX/EQUIV': 24, 'INDEX EQUIV': 24, 'INDEX+EQUIV': 24,
  'INDEX': 24, 'EQUIV': 24, 'MATCH': 24, 'Recherche bidirectionnelle': 24,
  // Validation données (25)
  'VALIDATION_DONNEES': 25, 'Validation de données': 25, 'validation_donnees': 25,
  'Validation données': 25, 'Validation': 25, 'Listes déroulantes': 25, 'Contrôle de saisie': 25,
  // TCD avancé (26)
  'TCD_AVANCE': 26, 'TCD avancé': 26,
  // Tableaux structurés (27)
  'TABLEAUX_STRUCTURES': 27, 'Tableaux structurés': 27, 'tableaux_structures': 27,
  'Tableau structuré': 27, 'Ctrl+T': 27, 'Références structurées': 56,
  // SOMMEPROD (28)
  'SOMMEPROD': 28, 'SUMPRODUCT': 28, 'Sommeprod': 28, 'Calculs matriciels': 28,
  // Formules matricielles (29)
  'FORMULES_MATRICIELLES': 29, 'Formules matricielles': 29, 'formules_matricielles': 29,
  // INDIRECT (30)
  'INDIRECT': 30,
  // Graphiques avancés (31)
  'GRAPHIQUES_AVANCES': 31, 'Graphiques avancés': 31, 'graphiques_combines': 31,
  'Graphiques dynamiques': 31,
  // MFC avancée (32)
  'MFC_AVANCEE': 32, 'MFC avancée': 32, 'mise_forme_conditionnelle_avancee': 32,
  'Formules MFC': 32, 'Jeux d\'icônes': 32, 'Barres de données': 32, 'Nuances couleurs': 32,
  // RECHERCHEX (38)
  'RECHERCHEX': 38, 'XLOOKUP': 38, 'RechercheX': 38, 'Alternative RECHERCHEV': 38,
  // Formules dynamiques (39)
  'FORMULES_DYNAMIQUES': 39, 'Formules dynamiques': 39, 'FILTER': 39, 'SORT': 39,
  'UNIQUE': 39, 'Excel 365': 39, 'Tableaux dynamiques': 39,
  // Références mixtes (51)
  'REFERENCES_MIXTES': 51, 'Références mixtes': 51,
  // Séries automatiques (52)
  'SERIES_AUTOMATIQUES': 52, 'Séries automatiques': 52, 'Génération de séries': 52,
  'Recopie incrémentée': 52,
  // RECHERCHEV approchée (53)
  'RECHERCHEV_APPROCHEE': 53, 'RECHERCHEV approchée': 53, 'Barèmes': 53,
  // RECHERCHEH (54)
  'RECHERCHEH': 54, 'HLOOKUP': 54, 'RechercheH': 54, 'Recherche horizontale': 54,
  // Collage spécial (58)
  'COLLAGE_SPECIAL': 58, 'Collage spécial': 58, 'Transposition': 58, 'Valeurs': 58,
  // Saisie (1)
  'SAISIE_DONNEES': 1, 'Saisie de données': 1, 'Navigation clavier': 1, 'Sélection': 1,
  // Formatage (2)
  'FORMATAGE_CELLULES': 2, 'Formatage cellules': 2, 'formatage': 2, 'Formatage': 2,
  'Couleurs': 2, 'Bordures': 2, 'Alignement': 2, 'Format nombre': 2,
  // Power Query
  'POWER_QUERY': 35, 'Power Query': 35, 'ETL': 35, 'Nettoyage données': 35,
  // DECALER
  'DECALER': 30, 'Plages dynamiques': 30, 'Moyennes mobiles': 30
};

// Types de validation par compétence
const VALIDATION_TYPES = {
  1: 'full_auto', 2: 'semi_auto', 3: 'full_auto', 4: 'full_auto', 5: 'full_auto',
  6: 'full_auto', 7: 'semi_auto', 8: 'semi_auto', 9: 'full_auto', 10: 'semi_auto',
  11: 'full_auto', 12: 'full_auto', 13: 'full_auto', 14: 'full_auto', 15: 'full_auto',
  16: 'full_auto', 17: 'full_auto', 18: 'full_auto', 19: 'full_auto', 20: 'full_auto',
  21: 'semi_auto', 22: 'full_auto', 23: 'semi_auto', 24: 'full_auto', 25: 'semi_auto',
  26: 'semi_auto', 27: 'full_auto', 28: 'full_auto', 29: 'full_auto', 30: 'full_auto',
  31: 'semi_auto', 32: 'semi_auto', 38: 'full_auto', 39: 'full_auto', 51: 'full_auto',
  52: 'semi_auto', 53: 'full_auto', 54: 'full_auto', 58: 'full_auto'
};

// Compétences nécessitant un screenshot
const VISUAL_COMPETENCES = [2, 7, 8, 10, 21, 23, 26, 31, 32, 40, 45, 52, 57];

// ═══════════════════════════════════════════════════════════════════════════
// CHARGEMENT DES TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

function loadAllTemplates() {
  const templates = [];
  const levels = ['debutant', 'intermediaire', 'avance'];
  
  levels.forEach(level => {
    const levelDir = path.join(EXERCISES_DIR, level);
    if (!fs.existsSync(levelDir)) return;
    
    const files = fs.readdirSync(levelDir).filter(f => f.endsWith('.json') && !f.startsWith('shared'));
    
    files.forEach(file => {
      try {
        const filepath = path.join(levelDir, file);
        const content = fs.readFileSync(filepath, 'utf-8');
        const template = JSON.parse(content);
        
        template._filename = file;
        template._level = level;
        
        templates.push(template);
      } catch (error) {
        console.warn(`⚠️ Erreur chargement ${file}: ${error.message}`);
      }
    });
  });
  
  console.log(`📚 ${templates.length} templates chargés`);
  return templates;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTION DE L'INDEX
// ═══════════════════════════════════════════════════════════════════════════

function buildIndex(templates) {
  const index = {
    byCompetence: {},
    byTemplate: {},
    aliases: { ...BASE_ALIASES },
    meta: {
      generatedAt: new Date().toISOString(),
      templateCount: templates.length,
      competenceCount: Object.keys(COMPETENCES).length
    }
  };
  
  // Initialiser toutes les compétences
  for (const [id, info] of Object.entries(COMPETENCES)) {
    index.byCompetence[id] = {
      key: info.key,
      nom: info.nom,
      niveau: info.niveau,
      templates: [],
      validationType: VALIDATION_TYPES[id] || 'manual',
      needsScreenshot: VISUAL_COMPETENCES.includes(parseInt(id)),
      coverage: 'none'
    };
  }
  
  // Parcourir tous les templates
  templates.forEach(template => {
    const templateId = template.id;
    const competenceIds = template.competence_ids || template.competences_ids || [];
    const competenceNames = template.competences || [];
    const checkpoints = template.checkpoints || [];
    
    // Enregistrer le template
    index.byTemplate[templateId] = {
      id: templateId,
      titre: template.titre,
      niveau: template.niveau || template._level,
      metier: template.metier || extractMetier(template),
      competenceIds: competenceIds,
      competenceNames: competenceNames,
      checkpointsCount: checkpoints.length,
      hasVisualCheckpoints: checkpoints.some(cp => 
        ['graphique', 'format', 'mfc', 'tcd'].some(t => cp.type?.toLowerCase().includes(t))
      ),
      filename: template._filename
    };
    
    // Associer aux compétences par ID
    competenceIds.forEach(compId => {
      if (index.byCompetence[compId]) {
        if (!index.byCompetence[compId].templates.includes(templateId)) {
          index.byCompetence[compId].templates.push(templateId);
        }
      }
    });
    
    // Résoudre les noms de compétences et ajouter aux aliases
    competenceNames.forEach(name => {
      const resolvedId = resolveCompetenceId(name, index.aliases);
      if (resolvedId && index.byCompetence[resolvedId]) {
        if (!index.byCompetence[resolvedId].templates.includes(templateId)) {
          index.byCompetence[resolvedId].templates.push(templateId);
        }
        // Ajouter l'alias s'il n'existe pas
        if (!index.aliases[name]) {
          index.aliases[name] = resolvedId;
        }
      }
    });
  });
  
  // Calculer la couverture
  let fullCount = 0, partialCount = 0, noneCount = 0;
  
  for (const [id, data] of Object.entries(index.byCompetence)) {
    const count = data.templates.length;
    if (count >= 2) {
      data.coverage = 'full';
      fullCount++;
    } else if (count === 1) {
      data.coverage = 'partial';
      partialCount++;
    } else {
      data.coverage = 'none';
      noneCount++;
    }
  }
  
  index.meta.coverageStats = { full: fullCount, partial: partialCount, none: noneCount };
  
  return index;
}

function resolveCompetenceId(name, aliases) {
  // Essayer directement dans les aliases
  if (aliases[name]) return aliases[name];
  
  // Essayer en normalisant
  const normalized = name.toUpperCase().replace(/[.\s-]/g, '_');
  for (const [alias, id] of Object.entries(aliases)) {
    if (alias.toUpperCase().replace(/[.\s-]/g, '_') === normalized) {
      return id;
    }
  }
  
  // Essayer de trouver dans COMPETENCES par clé
  for (const [id, info] of Object.entries(COMPETENCES)) {
    if (info.key === normalized || info.key === name) {
      return parseInt(id);
    }
  }
  
  return null;
}

function extractMetier(template) {
  const titre = (template.titre || '').toLowerCase();
  const contexte = typeof template.contexte === 'string' 
    ? template.contexte.toLowerCase() 
    : (template.contexte?.situation || '').toLowerCase();
  
  if (titre.includes('budget') || titre.includes('comptab') || contexte.includes('finance')) {
    return 'finance';
  }
  if (titre.includes('vente') || titre.includes('client') || contexte.includes('commercial')) {
    return 'commercial';
  }
  if (titre.includes('rh') || titre.includes('employe') || contexte.includes('ressources humaines')) {
    return 'rh';
  }
  if (titre.includes('marketing') || contexte.includes('marketing')) {
    return 'marketing';
  }
  return 'general';
}

// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATION DU FICHIER
// ═══════════════════════════════════════════════════════════════════════════

function generateFile(index) {
  const content = `/**
 * COMPETENCE INDEX - Source unique de vérité
 * 
 * Fichier généré automatiquement par scripts/generate-competence-index.js
 * NE PAS MODIFIER MANUELLEMENT - Relancer le script après modification des templates
 * 
 * Généré le: ${index.meta.generatedAt}
 * Templates: ${index.meta.templateCount}
 * Compétences: ${index.meta.competenceCount}
 * 
 * Couverture:
 * - Complète (2+ templates): ${index.meta.coverageStats.full}
 * - Partielle (1 template): ${index.meta.coverageStats.partial}
 * - Aucune (0 template): ${index.meta.coverageStats.none}
 */

// ═══════════════════════════════════════════════════════════════════════════
// INDEX PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const COMPETENCE_INDEX = ${JSON.stringify(index, null, 2)};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtient les templates pour une compétence donnée
 * @param {number} competenceId - ID de la compétence
 * @returns {string[]} Liste des IDs de templates
 */
export function getTemplatesForCompetence(competenceId) {
  return COMPETENCE_INDEX.byCompetence[competenceId]?.templates || [];
}

/**
 * Résout un nom ou alias de compétence en ID
 * @param {string} nameOrAlias - Nom ou alias de compétence
 * @returns {number|null} ID de la compétence ou null
 */
export function resolveCompetenceId(nameOrAlias) {
  // Essayer directement
  if (COMPETENCE_INDEX.aliases[nameOrAlias]) {
    return COMPETENCE_INDEX.aliases[nameOrAlias];
  }
  
  // Essayer en majuscules
  const upper = nameOrAlias.toUpperCase();
  if (COMPETENCE_INDEX.aliases[upper]) {
    return COMPETENCE_INDEX.aliases[upper];
  }
  
  // Essayer avec normalisation
  const normalized = nameOrAlias.toUpperCase().replace(/[.\\s-]/g, '_');
  for (const [alias, id] of Object.entries(COMPETENCE_INDEX.aliases)) {
    if (alias.toUpperCase().replace(/[.\\s-]/g, '_') === normalized) {
      return id;
    }
  }
  
  return null;
}

/**
 * Obtient les infos d'une compétence
 * @param {number} competenceId - ID de la compétence
 * @returns {Object|null} Infos de la compétence
 */
export function getCompetenceInfo(competenceId) {
  return COMPETENCE_INDEX.byCompetence[competenceId] || null;
}

/**
 * Obtient les infos d'un template
 * @param {string} templateId - ID du template
 * @returns {Object|null} Infos du template
 */
export function getTemplateInfo(templateId) {
  return COMPETENCE_INDEX.byTemplate[templateId] || null;
}

/**
 * Vérifie si une compétence nécessite un screenshot
 * @param {number} competenceId - ID de la compétence
 * @returns {boolean}
 */
export function competenceNeedsScreenshot(competenceId) {
  return COMPETENCE_INDEX.byCompetence[competenceId]?.needsScreenshot || false;
}

/**
 * Obtient la couverture d'une compétence
 * @param {number} competenceId - ID de la compétence
 * @returns {'full'|'partial'|'none'}
 */
export function getCompetenceCoverage(competenceId) {
  return COMPETENCE_INDEX.byCompetence[competenceId]?.coverage || 'none';
}

/**
 * Obtient toutes les compétences sans templates
 * @returns {number[]} Liste des IDs
 */
export function getOrphanCompetences() {
  return Object.entries(COMPETENCE_INDEX.byCompetence)
    .filter(([_, data]) => data.coverage === 'none')
    .map(([id]) => parseInt(id));
}

/**
 * Obtient les stats de couverture
 * @returns {Object} { full, partial, none }
 */
export function getCoverageStats() {
  return COMPETENCE_INDEX.meta.coverageStats;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════════════════

export default COMPETENCE_INDEX;
`;

  fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');
  console.log(`✅ Index généré: ${OUTPUT_PATH}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('🔧 Génération de l\'index des compétences...\n');

const templates = loadAllTemplates();
const index = buildIndex(templates);

console.log(`\n📊 Statistiques:`);
console.log(`   - Templates: ${index.meta.templateCount}`);
console.log(`   - Compétences: ${index.meta.competenceCount}`);
console.log(`   - Couverture complète: ${index.meta.coverageStats.full}`);
console.log(`   - Couverture partielle: ${index.meta.coverageStats.partial}`);
console.log(`   - Sans template: ${index.meta.coverageStats.none}`);
console.log(`   - Aliases: ${Object.keys(index.aliases).length}`);

generateFile(index);

// Afficher les compétences sans templates
const orphans = Object.entries(index.byCompetence)
  .filter(([_, data]) => data.coverage === 'none')
  .map(([id, data]) => `${id}. ${data.nom}`);

if (orphans.length > 0) {
  console.log(`\n⚠️ Compétences sans template:`);
  orphans.forEach(o => console.log(`   - ${o}`));
}

console.log('\n✨ Terminé!');
