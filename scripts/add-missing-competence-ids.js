#!/usr/bin/env node

/**
 * AJOUT DES COMPETENCE_IDS AUX TEMPLATES MANQUANTS
 * 
 * Ce script ajoute les competence_ids aux 18 templates qui n'en ont pas.
 * 
 * Usage: node scripts/add-missing-competence-ids.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// MAPPING DES TEMPLATES VERS COMPETENCE_IDS
// ═══════════════════════════════════════════════════════════════════════════

const TEMPLATE_MAPPINGS = {
  // DÉBUTANT
  'debutant_04_planning_travail': {
    competence_ids: [6, 2],  // COPIER_COLLER, FORMATAGE_CELLULES
    notes: 'copier_coller, formatage'
  },
  'debutant_05_tri_ventes': {
    competence_ids: [7, 8],  // TRI_SIMPLE, FILTRES_BASIQUES
    notes: 'tri, filtres'
  },
  'debutant_07_temperatures': {
    competence_ids: [10],  // MFC_SIMPLE
    notes: 'mise_en_forme_conditionnelle'
  },
  'debutant_08_annuaire_entreprise': {
    competence_ids: [2],  // FORMATAGE_CELLULES
    notes: 'formatage'
  },
  'debutant_09_graphique_ca': {
    competence_ids: [21],  // GRAPHIQUES_BASIQUES
    notes: 'graphiques'
  },
  'debutant_10_formulaire_conges': {
    competence_ids: [25],  // VALIDATION_DONNEES
    notes: 'validation_donnees'
  },
  'debutant_11_grille_tarifaire': {
    competence_ids: [15, 51],  // REFERENCES_ABSOLUES, REFERENCES_MIXTES
    notes: 'Références absolues ($), Références mixtes'
  },
  'debutant_13_planning_mensuel': {
    competence_ids: [52, 20],  // SERIES_AUTOMATIQUES, FONCTIONS_DATE
    notes: 'Génération de séries, Formules date'
  },
  'debutant_15_premier_graphique': {
    competence_ids: [21],  // GRAPHIQUES_BASIQUES
    notes: 'Graphiques simples'
  },
  
  // INTERMÉDIAIRE
  'intermediaire_13_calcul_remises': {
    competence_ids: [15],  // REFERENCES_ABSOLUES
    notes: 'references_absolues'
  },
  'intermediaire_19_anciennete_employes': {
    competence_ids: [20],  // FONCTIONS_DATE
    notes: 'formules_date'
  },
  'intermediaire_20_analyse_tcd': {
    competence_ids: [23],  // TCD_BASIQUE
    notes: 'tableaux_croises_dynamiques'
  },
  'intermediaire_21_moyennes_classes': {
    competence_ids: [4, 13],  // MOYENNE, SOMME_SI (MOYENNE.SI est proche de SOMME.SI)
    notes: 'MOYENNE.SI'
  },
  'intermediaire_22_heatmap_ventes': {
    competence_ids: [32],  // MFC_AVANCEE
    notes: 'mise_forme_conditionnelle_avancee'
  },
  
  // AVANCÉ
  'avance_24_tarification_dynamique': {
    competence_ids: [24],  // INDEX_EQUIV
    notes: 'INDEX+EQUIV_avance'
  },
  'avance_25_tableaux_structures': {
    competence_ids: [27],  // TABLEAUX_STRUCTURES
    notes: 'tableaux_structures'
  },
  'avance_26_dashboard_graphiques': {
    competence_ids: [31, 40],  // GRAPHIQUES_AVANCES, TABLEAUX_BORD
    notes: 'graphiques_combines, visualisation'
  },
  'avance_29_formules_dynamiques': {
    competence_ids: [29, 39],  // FORMULES_MATRICIELLES, FORMULES_DYNAMIQUES
    notes: 'formules_matricielles, FILTRE, UNIQUE, SORT'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

const EXERCISES_DIR = path.join(__dirname, '..', 'shared', 'data', 'exercises');

console.log('🔧 Ajout des competence_ids manquants...\n');

let updated = 0;
let errors = 0;

for (const [templateId, mapping] of Object.entries(TEMPLATE_MAPPINGS)) {
  // Déterminer le niveau à partir de l'ID
  let level;
  if (templateId.startsWith('debutant')) level = 'debutant';
  else if (templateId.startsWith('intermediaire')) level = 'intermediaire';
  else if (templateId.startsWith('avance')) level = 'avance';
  else {
    console.error(`❌ Niveau inconnu pour ${templateId}`);
    errors++;
    continue;
  }
  
  // Trouver le fichier
  const levelDir = path.join(EXERCISES_DIR, level);
  const files = fs.readdirSync(levelDir).filter(f => f.endsWith('.json'));
  
  const file = files.find(f => {
    const content = JSON.parse(fs.readFileSync(path.join(levelDir, f), 'utf-8'));
    return content.id === templateId;
  });
  
  if (!file) {
    console.error(`❌ Fichier non trouvé pour ${templateId}`);
    errors++;
    continue;
  }
  
  const filepath = path.join(levelDir, file);
  
  try {
    // Lire le template
    const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    
    // Vérifier si déjà présent
    if (content.competence_ids?.length > 0) {
      console.log(`⏭️  ${templateId} - déjà des competence_ids`);
      continue;
    }
    
    // Ajouter competence_ids
    content.competence_ids = mapping.competence_ids;
    
    // Écrire le fichier
    fs.writeFileSync(filepath, JSON.stringify(content, null, 2), 'utf-8');
    
    console.log(`✅ ${templateId}`);
    console.log(`   IDs: [${mapping.competence_ids.join(', ')}] (${mapping.notes})`);
    updated++;
    
  } catch (err) {
    console.error(`❌ Erreur ${templateId}: ${err.message}`);
    errors++;
  }
}

console.log('\n' + '─'.repeat(50));
console.log(`📊 Résultat: ${updated} templates mis à jour, ${errors} erreurs`);

if (updated > 0) {
  console.log('\n⚠️  N\'oubliez pas de régénérer l\'index:');
  console.log('   npm run templates:generate-index');
}
