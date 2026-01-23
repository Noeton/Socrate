import logger from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Charger metadata
const metadataPath = path.join(process.cwd(), 'shared', 'data', 'real-datasets', 'metadata.json');
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

/**
 * Charge un dataset CSV depuis son ID
 * @param {string} datasetId - ID du dataset (ex: "superstore_sales")
 * @returns {Array} Tableau d'objets [{colonne: valeur}]
 */
function loadDataset(datasetId) {
  const meta = metadata[datasetId];
  if (!meta) {
    throw new Error(`Dataset introuvable: ${datasetId}`);
  }

  const csvPath = path.join(process.cwd(), 'shared', 'data', 'real-datasets', meta.path);
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Fichier CSV introuvable: ${csvPath}`);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
    // Détecter le séparateur (virgule ou point-virgule)
    const delimiter = fileContent.includes(';') && !fileContent.split('\n')[0].includes(',') ? ';' : ',';
  
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: delimiter
    });
  
    console.log(`✅ [DatasetLoader] Chargé ${datasetId}: ${records.length} lignes (séparateur: ${delimiter})`);
  


  return records;
}

/**
 * Pioche N lignes aléatoires dans un dataset
 * @param {Array} dataset - Dataset complet
 * @param {number} nbRows - Nombre de lignes à piocher
 * @returns {Array} Sous-ensemble aléatoire
 */
function pickRandomRows(dataset, nbRows) {
  if (nbRows >= dataset.length) return dataset;
  
  const shuffled = [...dataset].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, nbRows);
}

/**
 * Retourne les datasets adaptés à un métier/niveau
 * @param {string} metier - "vente", "finance", "rh", "comptabilite", "marketing"
 * @param {string} niveau - "debutant", "intermediaire", "avance"
 * @returns {Array} Liste d'IDs datasets compatibles
 */
function getDatasetsByMetier(metier, niveau) {
  return Object.keys(metadata).filter(id => {
    const meta = metadata[id];
    return meta.metier === metier && meta.niveau.includes(niveau);
  });
}

/**
 * Convertit dataset en format exercice JSON {headers, rows}
 * @param {Array} dataset - Dataset d'objets
 * @param {number} maxRows - Limite lignes (optionnel)
 * @returns {Object} {headers: [], rows: [[]]}
 */
function convertToExerciseFormat(dataset, maxRows = null) {
  const subset = maxRows ? pickRandomRows(dataset, maxRows) : dataset;
  
  if (subset.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(subset[0]);
  const rows = subset.map(record => headers.map(h => record[h]));

  return { headers, rows };
}

export default {
  loadDataset,
  pickRandomRows,
  getDatasetsByMetier,
  convertToExerciseFormat,
  metadata
};