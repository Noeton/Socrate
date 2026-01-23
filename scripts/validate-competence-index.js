#!/usr/bin/env node

/**
 * VALIDATION DE L'INDEX ET DES TEMPLATES
 * 
 * Ce script vérifie l'intégrité de l'index centralisé et des templates JSON.
 * À exécuter avant chaque commit modifiant les templates ou l'index.
 * 
 * Vérifications:
 * - Tous les templates référencés dans l'index existent
 * - Tous les competence_ids sont valides
 * - Pas de conflits dans les aliases
 * - Coverage correctement calculée
 * - Checkpoints valides dans les templates
 * - Pas de templates orphelins (non référencés)
 * 
 * Usage: 
 *   node scripts/validate-competence-index.js
 *   node scripts/validate-competence-index.js --fix  (régénère l'index si invalide)
 * 
 * Exit codes:
 *   0 = Tout est valide
 *   1 = Erreurs critiques (bloque le commit)
 *   2 = Warnings (ne bloque pas)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const EXERCISES_DIR = path.join(__dirname, '..', 'shared', 'data', 'exercises');
const INDEX_PATH = path.join(__dirname, '..', 'shared', 'data', 'competenceIndex.js');
const FIX_MODE = process.argv.includes('--fix');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

// Compétences connues (doit matcher PEDAGOGIE)
const VALID_COMPETENCE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  51, 52, 53, 54, 55, 56, 57, 58
];

// ═══════════════════════════════════════════════════════════════════════════
// RÉSULTATS
// ═══════════════════════════════════════════════════════════════════════════

const results = {
  errors: [],    // Bloquants
  warnings: [],  // Non bloquants
  info: [],      // Informatif
  stats: {
    templatesChecked: 0,
    competencesChecked: 0,
    aliasesChecked: 0,
    checkpointsChecked: 0
  }
};

function error(message, details = null) {
  results.errors.push({ message, details });
}

function warn(message, details = null) {
  results.warnings.push({ message, details });
}

function info(message) {
  results.info.push(message);
}

// ═══════════════════════════════════════════════════════════════════════════
// CHARGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    error('Index introuvable', INDEX_PATH);
    return null;
  }
  
  try {
    // Lire le fichier et extraire le JSON
    const content = fs.readFileSync(INDEX_PATH, 'utf-8');
    
    // Extraire l'objet COMPETENCE_INDEX du fichier JS
    const match = content.match(/export const COMPETENCE_INDEX = (\{[\s\S]*?\});/);
    if (!match) {
      error('Format d\'index invalide - impossible d\'extraire COMPETENCE_INDEX');
      return null;
    }
    
    // Parser le JSON (attention: le JSON dans le fichier est valide)
    const jsonStr = match[1];
    const index = JSON.parse(jsonStr);
    
    info(`Index chargé: ${Object.keys(index.byCompetence || {}).length} compétences, ${Object.keys(index.byTemplate || {}).length} templates`);
    return index;
  } catch (err) {
    error('Erreur parsing index', err.message);
    return null;
  }
}

function loadAllTemplates() {
  const templates = new Map();
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
        template._filepath = filepath;
        template._level = level;
        
        if (template.id) {
          templates.set(template.id, template);
        } else {
          warn(`Template sans ID`, file);
        }
        
        results.stats.templatesChecked++;
      } catch (err) {
        error(`Erreur parsing template`, `${file}: ${err.message}`);
      }
    });
  });
  
  info(`${templates.size} templates chargés depuis le filesystem`);
  return templates;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATIONS
// ═══════════════════════════════════════════════════════════════════════════

function validateIndexStructure(index) {
  console.log('\n🔍 Validation structure de l\'index...');
  
  if (!index.byCompetence) {
    error('Index manque byCompetence');
    return false;
  }
  
  if (!index.byTemplate) {
    error('Index manque byTemplate');
    return false;
  }
  
  if (!index.aliases) {
    error('Index manque aliases');
    return false;
  }
  
  if (!index.meta) {
    warn('Index manque meta (non critique)');
  }
  
  return true;
}

function validateTemplatesExist(index, templates) {
  console.log('\n🔍 Validation existence des templates...');
  
  let valid = true;
  
  // Vérifier que tous les templates référencés dans l'index existent
  for (const [compId, compData] of Object.entries(index.byCompetence)) {
    const templateIds = compData.templates || [];
    
    for (const templateId of templateIds) {
      if (!templates.has(templateId)) {
        error(`Template référencé mais inexistant`, `Compétence ${compId} référence "${templateId}"`);
        valid = false;
      }
    }
  }
  
  // Vérifier que tous les templates du filesystem sont dans l'index
  for (const [templateId, template] of templates) {
    if (!index.byTemplate[templateId]) {
      warn(`Template non indexé`, `"${templateId}" existe mais n'est pas dans l'index`);
    }
  }
  
  return valid;
}

function validateCompetenceIds(index, templates) {
  console.log('\n🔍 Validation des competence_ids...');
  
  let valid = true;
  
  // Vérifier que tous les IDs dans l'index sont valides
  for (const compId of Object.keys(index.byCompetence)) {
    const id = parseInt(compId);
    if (!VALID_COMPETENCE_IDS.includes(id)) {
      warn(`ID de compétence inconnu dans l'index`, `ID ${compId} n'est pas dans la liste connue`);
    }
    results.stats.competencesChecked++;
  }
  
  // Vérifier les competence_ids dans les templates
  for (const [templateId, template] of templates) {
    const compIds = template.competence_ids || template.competences_ids || [];
    
    for (const id of compIds) {
      if (!VALID_COMPETENCE_IDS.includes(id)) {
        warn(`competence_id invalide dans template`, `"${templateId}" a l'ID ${id} qui n'est pas connu`);
      }
    }
  }
  
  return valid;
}

function validateAliases(index) {
  console.log('\n🔍 Validation des aliases...');
  
  let valid = true;
  const aliasToId = {};
  
  for (const [alias, compId] of Object.entries(index.aliases)) {
    results.stats.aliasesChecked++;
    
    // Vérifier que l'ID cible existe
    if (!index.byCompetence[compId]) {
      warn(`Alias pointe vers compétence inexistante`, `"${alias}" -> ${compId}`);
    }
    
    // Vérifier les conflits (même alias normalisé pointant vers différents IDs)
    const normalized = alias.toUpperCase().replace(/[.\s-]/g, '_');
    if (aliasToId[normalized] && aliasToId[normalized] !== compId) {
      warn(`Conflit d'alias potentiel`, `"${alias}" (ID ${compId}) vs alias existant (ID ${aliasToId[normalized]})`);
    }
    aliasToId[normalized] = compId;
  }
  
  return valid;
}

function validateCoverage(index) {
  console.log('\n🔍 Validation de la couverture...');
  
  let valid = true;
  let fullCount = 0, partialCount = 0, noneCount = 0;
  
  for (const [compId, compData] of Object.entries(index.byCompetence)) {
    const templateCount = (compData.templates || []).length;
    const expectedCoverage = templateCount >= 2 ? 'full' : templateCount === 1 ? 'partial' : 'none';
    
    if (compData.coverage !== expectedCoverage) {
      error(`Coverage incorrecte`, `Compétence ${compId}: ${templateCount} templates -> devrait être "${expectedCoverage}" mais est "${compData.coverage}"`);
      valid = false;
    }
    
    if (expectedCoverage === 'full') fullCount++;
    else if (expectedCoverage === 'partial') partialCount++;
    else noneCount++;
  }
  
  // Vérifier les stats meta
  if (index.meta?.coverageStats) {
    const stats = index.meta.coverageStats;
    if (stats.full !== fullCount || stats.partial !== partialCount || stats.none !== noneCount) {
      warn(`Stats de couverture incorrectes`, 
        `Index: full=${stats.full}, partial=${stats.partial}, none=${stats.none} | ` +
        `Calculé: full=${fullCount}, partial=${partialCount}, none=${noneCount}`);
    }
  }
  
  info(`Couverture: ✅ ${fullCount} complètes, 📝 ${partialCount} partielles, 🚧 ${noneCount} vides`);
  
  return valid;
}

function validateCheckpoints(templates) {
  console.log('\n🔍 Validation des checkpoints...');
  
  let valid = true;
  
  for (const [templateId, template] of templates) {
    const checkpoints = template.checkpoints || [];
    
    if (checkpoints.length === 0) {
      warn(`Template sans checkpoints`, templateId);
      continue;
    }
    
    checkpoints.forEach((cp, idx) => {
      results.stats.checkpointsChecked++;
      
      // Vérifier les champs requis
      if (!cp.cellule && !cp.type) {
        warn(`Checkpoint incomplet`, `${templateId}[${idx}]: manque cellule ou type`);
      }
      
      // Vérifier les checkpoints de type formule
      if (cp.type === 'formule') {
        if (!cp.pattern && !cp.expected_formula && !cp.fonction) {
          if (VERBOSE) {
            warn(`Checkpoint formule sans validation`, `${templateId}[${idx}]: pas de pattern/expected_formula/fonction`);
          }
        }
      }
      
      // Vérifier les checkpoints de type valeur
      if (cp.type === 'valeur') {
        if (cp.expected_value === undefined && cp.expected === undefined) {
          if (VERBOSE) {
            warn(`Checkpoint valeur sans expected`, `${templateId}[${idx}]`);
          }
        }
      }
    });
  }
  
  return valid;
}

function validateIndexFreshness(index, templates) {
  console.log('\n🔍 Validation fraîcheur de l\'index...');
  
  // Comparer le nombre de templates
  const indexTemplateCount = Object.keys(index.byTemplate || {}).length;
  const fsTemplateCount = templates.size;
  
  if (indexTemplateCount !== fsTemplateCount) {
    warn(`Nombre de templates différent`, 
      `Index: ${indexTemplateCount}, Filesystem: ${fsTemplateCount} - Régénérer l'index recommandé`);
    return false;
  }
  
  // Vérifier la date de génération
  if (index.meta?.generatedAt) {
    const generatedDate = new Date(index.meta.generatedAt);
    const now = new Date();
    const hoursSinceGeneration = (now - generatedDate) / (1000 * 60 * 60);
    
    if (hoursSinceGeneration > 24 * 7) { // Plus d'une semaine
      info(`Index généré il y a ${Math.round(hoursSinceGeneration / 24)} jours`);
    }
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// RÉGÉNÉRATION (mode --fix)
// ═══════════════════════════════════════════════════════════════════════════

function regenerateIndex() {
  console.log('\n🔧 Régénération de l\'index...');
  
  try {
    execSync('node scripts/generate-competence-index.js', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    return true;
  } catch (err) {
    error('Échec régénération index', err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RAPPORT
// ═══════════════════════════════════════════════════════════════════════════

function printReport() {
  console.log('\n' + '═'.repeat(70));
  console.log('                        RAPPORT DE VALIDATION');
  console.log('═'.repeat(70));
  
  // Stats
  console.log('\n📊 Statistiques:');
  console.log(`   Templates vérifiés:    ${results.stats.templatesChecked}`);
  console.log(`   Compétences vérifiées: ${results.stats.competencesChecked}`);
  console.log(`   Aliases vérifiés:      ${results.stats.aliasesChecked}`);
  console.log(`   Checkpoints vérifiés:  ${results.stats.checkpointsChecked}`);
  
  // Infos
  if (results.info.length > 0) {
    console.log('\nℹ️  Informations:');
    results.info.forEach(msg => console.log(`   ${msg}`));
  }
  
  // Warnings
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${results.warnings.length}):`);
    results.warnings.slice(0, 10).forEach(w => {
      console.log(`   • ${w.message}`);
      if (w.details && VERBOSE) console.log(`     └─ ${w.details}`);
    });
    if (results.warnings.length > 10) {
      console.log(`   ... et ${results.warnings.length - 10} autres`);
    }
  }
  
  // Erreurs
  if (results.errors.length > 0) {
    console.log(`\n❌ Erreurs (${results.errors.length}):`);
    results.errors.forEach(e => {
      console.log(`   • ${e.message}`);
      if (e.details) console.log(`     └─ ${e.details}`);
    });
  }
  
  // Résultat final
  console.log('\n' + '─'.repeat(70));
  
  if (results.errors.length > 0) {
    console.log('❌ ÉCHEC - Erreurs critiques détectées');
    console.log('   Corrigez les erreurs avant de committer.');
    if (!FIX_MODE) {
      console.log('   Utilisez --fix pour tenter une régénération automatique.');
    }
    return 1;
  } else if (results.warnings.length > 0) {
    console.log(`⚠️  OK avec ${results.warnings.length} warning(s)`);
    console.log('   Les warnings ne bloquent pas le commit.');
    return 2;
  } else {
    console.log('✅ SUCCÈS - Index et templates valides');
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('🔍 Validation de l\'index des compétences...');
console.log(`   Mode: ${FIX_MODE ? '--fix (régénération si erreur)' : 'validation seule'}`);
console.log(`   Verbose: ${VERBOSE ? 'oui' : 'non'}`);

// Charger les données
const templates = loadAllTemplates();
let index = loadIndex();

// Si pas d'index et mode fix, générer
if (!index && FIX_MODE) {
  console.log('\n⚠️  Index introuvable, tentative de génération...');
  if (regenerateIndex()) {
    index = loadIndex();
  }
}

// Si toujours pas d'index, échec
if (!index) {
  console.log('\n❌ Impossible de charger l\'index');
  process.exit(1);
}

// Exécuter les validations
let hasErrors = false;

hasErrors = !validateIndexStructure(index) || hasErrors;
hasErrors = !validateTemplatesExist(index, templates) || hasErrors;
hasErrors = !validateCompetenceIds(index, templates) || hasErrors;
hasErrors = !validateAliases(index) || hasErrors;
hasErrors = !validateCoverage(index) || hasErrors;
validateCheckpoints(templates);
validateIndexFreshness(index, templates);

// Si erreurs et mode fix, tenter régénération
if (results.errors.length > 0 && FIX_MODE) {
  console.log('\n🔧 Erreurs détectées, tentative de régénération...');
  if (regenerateIndex()) {
    // Recharger et revalider
    console.log('\n🔄 Revalidation après régénération...');
    results.errors = [];
    results.warnings = [];
    results.info = [];
    
    const newIndex = loadIndex();
    if (newIndex) {
      validateIndexStructure(newIndex);
      validateTemplatesExist(newIndex, templates);
      validateCompetenceIds(newIndex, templates);
      validateAliases(newIndex);
      validateCoverage(newIndex);
    }
  }
}

// Afficher le rapport et sortir
const exitCode = printReport();
process.exit(exitCode);
