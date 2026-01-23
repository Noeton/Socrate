#!/usr/bin/env node

/**
 * AUDIT DES TEMPLATES D'EXERCICES
 * 
 * Ce script analyse tous les templates JSON et génère un rapport détaillé:
 * - Liste de tous les noms de compétences utilisés
 * - Mapping compétence → templates
 * - Templates sans competences_ids
 * - Compétences orphelines (sans template)
 * - Problèmes de validation
 * 
 * Usage: node scripts/audit-templates.js
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
const PEDAGOGIE_PATH = path.join(__dirname, '..', 'shared', 'data', 'pedagogie.js');

// Compétences connues (extraites de pedagogie.js)
const KNOWN_COMPETENCES = {
  1: 'SAISIE_DONNEES',
  2: 'FORMATAGE_CELLULES',
  3: 'SOMME',
  4: 'MOYENNE',
  5: 'MIN_MAX',
  6: 'COPIER_COLLER',
  7: 'TRI_SIMPLE',
  8: 'FILTRES_BASIQUES',
  9: 'SI',
  10: 'MFC_SIMPLE',
  11: 'NB_SI',
  12: 'NB_SI_ENS',
  13: 'SOMME_SI',
  14: 'SOMME_SI_ENS',
  15: 'REFERENCES_ABSOLUES',
  16: 'SI_IMBRIQUES',
  17: 'FONCTIONS_TEXTE',
  18: 'RECHERCHEV',
  19: 'CONCATENER',
  20: 'FONCTIONS_DATE',
  21: 'GRAPHIQUES_BASIQUES',
  22: 'SIERREUR',
  23: 'TCD_BASIQUE',
  24: 'INDEX_EQUIV',
  25: 'VALIDATION_DONNEES',
  26: 'TCD_AVANCE',
  27: 'TABLEAUX_STRUCTURES',
  28: 'SOMMEPROD',
  29: 'FORMULES_MATRICIELLES',
  30: 'INDIRECT',
  31: 'GRAPHIQUES_AVANCES',
  32: 'MFC_AVANCEE',
  38: 'RECHERCHEX',
  39: 'FORMULES_DYNAMIQUES',
  51: 'REFERENCES_MIXTES',
  52: 'SERIES_AUTOMATIQUES',
  53: 'RECHERCHEV_APPROCHEE',
  54: 'RECHERCHEH',
  58: 'COLLAGE_SPECIAL'
};

// Aliases de compétences (variations de noms)
const COMPETENCE_ALIASES = {
  // SOMME
  'SOMME': 3, 'SUM': 3, 'Somme': 3, 'somme': 3,
  // MOYENNE
  'MOYENNE': 4, 'AVERAGE': 4, 'Moyenne': 4, 'moyenne': 4,
  // SI
  'SI': 9, 'IF': 9, 'Si': 9, 'si': 9,
  // RECHERCHEV
  'RECHERCHEV': 18, 'VLOOKUP': 18, 'RechercheV': 18, 'recherchev': 18,
  // NB.SI
  'NB.SI': 11, 'NB_SI': 11, 'NBSI': 11, 'COUNTIF': 11, 'NB.SI.ENS': 12, 'NB_SI_ENS': 12, 'NBSIENS': 12, 'COUNTIFS': 12,
  // SOMME.SI
  'SOMME.SI': 13, 'SOMME_SI': 13, 'SOMMESI': 13, 'SUMIF': 13, 'SOMME.SI.ENS': 14, 'SOMME_SI_ENS': 14, 'SOMMESIENS': 14, 'SUMIFS': 14,
  // INDEX/EQUIV
  'INDEX': 24, 'EQUIV': 24, 'INDEX_EQUIV': 24, 'INDEX/EQUIV': 24, 'MATCH': 24, 'INDEX EQUIV': 24,
  // TCD
  'TCD': 23, 'Tableau croisé dynamique': 23, 'Tableaux croisés dynamiques': 23, 'TCD basique': 23, 'TCD avancé': 26,
  // SIERREUR
  'SIERREUR': 22, 'IFERROR': 22, 'SI.ERREUR': 22, 'SiErreur': 22,
  // Graphiques
  'Graphiques': 21, 'GRAPHIQUES': 21, 'graphique': 21, 'Graphiques basiques': 21, 'Graphiques avancés': 31,
  // MFC
  'MFC': 10, 'Mise en forme conditionnelle': 10, 'Format conditionnel': 10, 'MFC simple': 10, 'MFC avancée': 32,
  // Texte
  'CONCATENER': 19, 'CONCAT': 19, 'Concatener': 19, 'TEXTE': 17, 'Fonctions texte': 17,
  // Dates
  'DATE': 20, 'DATES': 20, 'Fonctions date': 20, 'Dates': 20,
  // Références
  'Références absolues': 15, 'REFERENCES_ABSOLUES': 15, 'Références mixtes': 51, 'Références': 15,
  // SI imbriqués
  'SI imbriqués': 16, 'SI_IMBRIQUES': 16, 'Si imbriqués': 16, 'SI imbriquées': 16,
  // SOMMEPROD
  'SOMMEPROD': 28, 'SUMPRODUCT': 28, 'Sommeprod': 28,
  // RECHERCHEX
  'RECHERCHEX': 38, 'XLOOKUP': 38, 'RechercheX': 38,
  // RECHERCHEH
  'RECHERCHEH': 54, 'HLOOKUP': 54, 'RechercheH': 54,
  // Validation
  'Validation de données': 25, 'VALIDATION_DONNEES': 25, 'Validation': 25,
  // Tri/Filtres
  'Tri': 7, 'TRI': 7, 'Tri simple': 7, 'Filtres': 8, 'FILTRES': 8, 'Filtres basiques': 8,
  // Séries
  'Séries automatiques': 52, 'SERIES_AUTOMATIQUES': 52, 'Séries': 52,
  // Collage
  'Collage spécial': 58, 'COLLAGE_SPECIAL': 58,
  // Tableaux structurés
  'Tableaux structurés': 27, 'TABLEAUX_STRUCTURES': 27, 'Tableau structuré': 27,
  // Formules dynamiques
  'Formules dynamiques': 39, 'FORMULES_DYNAMIQUES': 39,
  // MIN/MAX
  'MIN': 5, 'MAX': 5, 'MIN_MAX': 5, 'Min/Max': 5
};

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT
// ═══════════════════════════════════════════════════════════════════════════

const audit = {
  templates: [],
  competenceNames: new Set(),
  competenceNameToTemplates: {},
  competenceIdToTemplates: {},
  problems: [],
  stats: {
    totalTemplates: 0,
    byLevel: { debutant: 0, intermediaire: 0, avance: 0 },
    withCompetenceIds: 0,
    withoutCompetenceIds: 0,
    totalCheckpoints: 0,
    visualCheckpoints: 0
  }
};

function loadTemplates() {
  const levels = ['debutant', 'intermediaire', 'avance'];
  
  levels.forEach(level => {
    const levelDir = path.join(EXERCISES_DIR, level);
    if (!fs.existsSync(levelDir)) {
      console.warn(`⚠️ Dossier ${level} introuvable`);
      return;
    }
    
    const files = fs.readdirSync(levelDir).filter(f => f.endsWith('.json') && !f.startsWith('shared'));
    
    files.forEach(file => {
      try {
        const filepath = path.join(levelDir, file);
        const content = fs.readFileSync(filepath, 'utf-8');
        const template = JSON.parse(content);
        
        template._filename = file;
        template._filepath = filepath;
        template._level = level;
        
        audit.templates.push(template);
        audit.stats.totalTemplates++;
        audit.stats.byLevel[level]++;
        
        // Analyser les compétences
        analyzeCompetences(template);
        
        // Analyser les checkpoints
        analyzeCheckpoints(template);
        
      } catch (error) {
        audit.problems.push({
          type: 'PARSE_ERROR',
          file,
          error: error.message
        });
      }
    });
  });
}

function analyzeCompetences(template) {
  const competences = template.competences || [];
  // CORRECTION: Chercher les deux variantes (competence_ids et competences_ids)
  const competenceIds = template.competence_ids || template.competences_ids || [];
  
  // Vérifier si competence_ids est présent
  if (competenceIds.length === 0) {
    audit.stats.withoutCompetenceIds++;
    audit.problems.push({
      type: 'MISSING_COMPETENCE_IDS',
      file: template._filename,
      id: template.id,
      competenceNames: competences
    });
  } else {
    audit.stats.withCompetenceIds++;
  }
  
  // Enregistrer chaque nom de compétence
  competences.forEach(compName => {
    audit.competenceNames.add(compName);
    
    if (!audit.competenceNameToTemplates[compName]) {
      audit.competenceNameToTemplates[compName] = [];
    }
    audit.competenceNameToTemplates[compName].push({
      id: template.id,
      title: template.titre,
      level: template._level
    });
    
    // Essayer de résoudre l'ID
    const resolvedId = resolveCompetenceId(compName);
    if (resolvedId) {
      if (!audit.competenceIdToTemplates[resolvedId]) {
        audit.competenceIdToTemplates[resolvedId] = [];
      }
      if (!audit.competenceIdToTemplates[resolvedId].find(t => t.id === template.id)) {
        audit.competenceIdToTemplates[resolvedId].push({
          id: template.id,
          title: template.titre,
          level: template._level
        });
      }
    } else {
      audit.problems.push({
        type: 'UNKNOWN_COMPETENCE_NAME',
        file: template._filename,
        competenceName: compName
      });
    }
  });
  
  // Vérifier la cohérence competences vs competences_ids
  competenceIds.forEach(id => {
    if (!audit.competenceIdToTemplates[id]) {
      audit.competenceIdToTemplates[id] = [];
    }
    if (!audit.competenceIdToTemplates[id].find(t => t.id === template.id)) {
      audit.competenceIdToTemplates[id].push({
        id: template.id,
        title: template.titre,
        level: template._level
      });
    }
  });
}

function resolveCompetenceId(name) {
  // Essayer les aliases
  if (COMPETENCE_ALIASES[name]) {
    return COMPETENCE_ALIASES[name];
  }
  
  // Essayer une correspondance insensible à la casse
  const upperName = name.toUpperCase().replace(/[.\s-]/g, '_');
  for (const [alias, id] of Object.entries(COMPETENCE_ALIASES)) {
    if (alias.toUpperCase().replace(/[.\s-]/g, '_') === upperName) {
      return id;
    }
  }
  
  // Essayer de trouver dans KNOWN_COMPETENCES
  for (const [id, knownName] of Object.entries(KNOWN_COMPETENCES)) {
    if (knownName.toUpperCase() === upperName) {
      return parseInt(id);
    }
  }
  
  return null;
}

function analyzeCheckpoints(template) {
  const checkpoints = template.checkpoints || [];
  
  audit.stats.totalCheckpoints += checkpoints.length;
  
  checkpoints.forEach(cp => {
    // Détecter les checkpoints visuels
    const isVisual = ['graphique', 'format', 'mfc', 'tcd', 'pivot', 'tri', 'filtre']
      .some(t => cp.type?.toLowerCase().includes(t)) ||
      cp.requires_screenshot ||
      cp.validation_type === 'visual';
    
    if (isVisual) {
      audit.stats.visualCheckpoints++;
    }
    
    // Vérifier les checkpoints sans expected_value ni pattern
    if (cp.type === 'formule' && !cp.pattern && !cp.expected_formula && !cp.fonction) {
      audit.problems.push({
        type: 'INCOMPLETE_CHECKPOINT',
        file: template._filename,
        checkpointId: cp.id,
        issue: 'Checkpoint formule sans pattern/expected_formula/fonction'
      });
    }
    
    if (cp.type === 'valeur' && cp.expected_value === undefined && !cp.expected) {
      audit.problems.push({
        type: 'INCOMPLETE_CHECKPOINT',
        file: template._filename,
        checkpointId: cp.id,
        issue: 'Checkpoint valeur sans expected_value'
      });
    }
  });
  
  // Vérifier les templates sans checkpoints
  if (checkpoints.length === 0) {
    audit.problems.push({
      type: 'NO_CHECKPOINTS',
      file: template._filename,
      id: template.id
    });
  }
}

function findOrphanCompetences() {
  // Compétences sans templates
  for (const [id, name] of Object.entries(KNOWN_COMPETENCES)) {
    const templates = audit.competenceIdToTemplates[parseInt(id)] || [];
    if (templates.length === 0) {
      audit.problems.push({
        type: 'ORPHAN_COMPETENCE',
        competenceId: parseInt(id),
        competenceName: name,
        issue: 'Aucun template pour cette compétence'
      });
    }
  }
}

function generateReport() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    AUDIT DES TEMPLATES');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Stats générales
  console.log('📊 STATISTIQUES GÉNÉRALES');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`   Templates totaux:     ${audit.stats.totalTemplates}`);
  console.log(`   - Débutant:           ${audit.stats.byLevel.debutant}`);
  console.log(`   - Intermédiaire:      ${audit.stats.byLevel.intermediaire}`);
  console.log(`   - Avancé:             ${audit.stats.byLevel.avance}`);
  console.log(`   Avec competences_ids: ${audit.stats.withCompetenceIds}`);
  console.log(`   Sans competences_ids: ${audit.stats.withoutCompetenceIds}`);
  console.log(`   Checkpoints totaux:   ${audit.stats.totalCheckpoints}`);
  console.log(`   Checkpoints visuels:  ${audit.stats.visualCheckpoints}`);
  
  // Noms de compétences uniques
  console.log('\n📝 NOMS DE COMPÉTENCES UTILISÉS (', audit.competenceNames.size, 'uniques)');
  console.log('─────────────────────────────────────────────────────────────');
  const sortedNames = [...audit.competenceNames].sort();
  sortedNames.forEach(name => {
    const templates = audit.competenceNameToTemplates[name] || [];
    const resolvedId = resolveCompetenceId(name);
    console.log(`   "${name}" → ID:${resolvedId || '?'} (${templates.length} templates)`);
  });
  
  // Couverture par compétence ID
  console.log('\n📈 COUVERTURE PAR COMPÉTENCE');
  console.log('─────────────────────────────────────────────────────────────');
  
  const coverage = {
    full: [],      // 2+ templates
    partial: [],   // 1 template
    none: []       // 0 template
  };
  
  for (const [id, name] of Object.entries(KNOWN_COMPETENCES)) {
    const templates = audit.competenceIdToTemplates[parseInt(id)] || [];
    if (templates.length >= 2) {
      coverage.full.push({ id: parseInt(id), name, count: templates.length });
    } else if (templates.length === 1) {
      coverage.partial.push({ id: parseInt(id), name, count: 1 });
    } else {
      coverage.none.push({ id: parseInt(id), name, count: 0 });
    }
  }
  
  console.log(`\n   ✅ COMPLÈTE (2+ templates): ${coverage.full.length} compétences`);
  coverage.full.slice(0, 10).forEach(c => {
    console.log(`      ${c.id}. ${c.name}: ${c.count} templates`);
  });
  if (coverage.full.length > 10) console.log(`      ... et ${coverage.full.length - 10} autres`);
  
  console.log(`\n   ⚠️ PARTIELLE (1 template): ${coverage.partial.length} compétences`);
  coverage.partial.forEach(c => {
    console.log(`      ${c.id}. ${c.name}: ${c.count} template`);
  });
  
  console.log(`\n   ❌ AUCUNE (0 template): ${coverage.none.length} compétences`);
  coverage.none.forEach(c => {
    console.log(`      ${c.id}. ${c.name}`);
  });
  
  // Problèmes
  console.log('\n⚠️ PROBLÈMES DÉTECTÉS (', audit.problems.length, ')');
  console.log('─────────────────────────────────────────────────────────────');
  
  const problemsByType = {};
  audit.problems.forEach(p => {
    if (!problemsByType[p.type]) problemsByType[p.type] = [];
    problemsByType[p.type].push(p);
  });
  
  for (const [type, problems] of Object.entries(problemsByType)) {
    console.log(`\n   ${type}: ${problems.length}`);
    problems.slice(0, 5).forEach(p => {
      if (p.file) {
        console.log(`      - ${p.file}: ${p.issue || p.competenceName || p.id || ''}`);
      } else if (p.competenceName) {
        console.log(`      - ${p.competenceName} (ID: ${p.competenceId})`);
      }
    });
    if (problems.length > 5) console.log(`      ... et ${problems.length - 5} autres`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  
  // Sauvegarder le rapport JSON
  const report = {
    timestamp: new Date().toISOString(),
    stats: audit.stats,
    competenceNames: [...audit.competenceNames].sort(),
    competenceNameToTemplates: audit.competenceNameToTemplates,
    competenceIdToTemplates: audit.competenceIdToTemplates,
    coverage: {
      full: coverage.full,
      partial: coverage.partial,
      none: coverage.none
    },
    problems: audit.problems
  };
  
  const reportPath = path.join(__dirname, '..', 'reports', 'template-audit.json');
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Rapport JSON sauvegardé: ${reportPath}\n`);
  
  return report;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('🔍 Démarrage de l\'audit des templates...\n');

loadTemplates();
findOrphanCompetences();
const report = generateReport();

// Retourner le code de sortie approprié
const criticalProblems = audit.problems.filter(p => 
  ['NO_CHECKPOINTS', 'PARSE_ERROR'].includes(p.type)
);
process.exit(criticalProblems.length > 0 ? 1 : 0);
