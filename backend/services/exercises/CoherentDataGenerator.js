/**
 * COHERENT DATA GENERATOR - v1.0
 * 
 * Génère des données cohérentes et réalistes pour les exercices Socrate.
 * 
 * PRINCIPES :
 * 1. Les données racontent une histoire (pas de valeurs random)
 * 2. Cohérence interne (un commercial = une région)
 * 3. Réalisme métier (montants, dates, proportions)
 * 4. Patterns intégrés (top performers, saisonnalité, outliers)
 */

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DE RÉFÉRENCE
// ═══════════════════════════════════════════════════════════════════════════

const PRENOMS = ['Marie', 'Thomas', 'Sophie', 'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan', 'Julie', 'Antoine', 'Sarah', 'Nicolas', 'Camille', 'Maxime', 'Clara', 'Alexandre'];
const NOMS = ['Dubois', 'Martin', 'Laurent', 'Bernard', 'Petit', 'Moreau', 'Richard', 'Roux', 'Leroy', 'Simon', 'Michel', 'Garcia', 'David', 'Bertrand', 'Robert', 'Fontaine'];

const REGIONS_FRANCE = [
  { nom: 'Île-de-France', poids: 0.30, ville_principale: 'Paris' },
  { nom: 'Auvergne-Rhône-Alpes', poids: 0.15, ville_principale: 'Lyon' },
  { nom: 'PACA', poids: 0.12, ville_principale: 'Marseille' },
  { nom: 'Nouvelle-Aquitaine', poids: 0.10, ville_principale: 'Bordeaux' },
  { nom: 'Occitanie', poids: 0.10, ville_principale: 'Toulouse' },
  { nom: 'Hauts-de-France', poids: 0.08, ville_principale: 'Lille' },
  { nom: 'Grand Est', poids: 0.07, ville_principale: 'Strasbourg' },
  { nom: 'Bretagne', poids: 0.05, ville_principale: 'Rennes' },
  { nom: 'Pays de la Loire', poids: 0.03, ville_principale: 'Nantes' }
];

const CATEGORIES_PRODUITS = {
  informatique: [
    { nom: 'Ordinateurs', prix_min: 800, prix_max: 3000 },
    { nom: 'Périphériques', prix_min: 50, prix_max: 500 },
    { nom: 'Réseau', prix_min: 200, prix_max: 2000 },
    { nom: 'Stockage', prix_min: 100, prix_max: 1000 },
    { nom: 'Logiciels', prix_min: 50, prix_max: 500 }
  ],
  alimentaire: [
    { nom: 'Épicerie', prix_min: 20, prix_max: 150 },
    { nom: 'Frais', prix_min: 30, prix_max: 200 },
    { nom: 'Boissons', prix_min: 15, prix_max: 100 },
    { nom: 'Bio', prix_min: 40, prix_max: 250 }
  ],
  services: [
    { nom: 'Conseil', prix_min: 1000, prix_max: 15000 },
    { nom: 'Formation', prix_min: 500, prix_max: 5000 },
    { nom: 'Support', prix_min: 200, prix_max: 2000 }
  ]
};

const NOMS_ENTREPRISES_CLIENTS = [
  'TechStartup', 'Digital Agency', 'Consulting Plus', 'InnovateCorp', 'DataSolutions',
  'SmartServices', 'CloudTech', 'WebFactory', 'MobileFirst', 'AILab',
  'GreenEnergy', 'FinanceHub', 'MediaGroup', 'RetailPro', 'LogisTech',
  'BioPharm', 'AgroTech', 'EduSmart', 'HealthCare Plus', 'SecurIT'
];

const SUFFIXES_ENTREPRISES = ['SAS', 'SARL', 'SA', 'EURL', 'Group', 'France', 'International'];

// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATEURS DE BASE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère un nom complet
 */
function generateFullName() {
  const prenom = PRENOMS[Math.floor(Math.random() * PRENOMS.length)];
  const nom = NOMS[Math.floor(Math.random() * NOMS.length)];
  return `${prenom} ${nom}`;
}

/**
 * Génère un nom d'entreprise cliente
 */
function generateClientName() {
  const base = NOMS_ENTREPRISES_CLIENTS[Math.floor(Math.random() * NOMS_ENTREPRISES_CLIENTS.length)];
  const suffix = SUFFIXES_ENTREPRISES[Math.floor(Math.random() * SUFFIXES_ENTREPRISES.length)];
  return Math.random() > 0.5 ? `${base} ${suffix}` : base;
}

/**
 * Génère une date dans une période
 */
function generateDate(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const randomTime = start + Math.random() * (end - start);
  const date = new Date(randomTime);
  return date.toISOString().split('T')[0];
}

/**
 * Génère un montant réaliste
 */
function generateAmount(min, max, distribution = 'normal') {
  if (distribution === 'normal') {
    // Distribution normale centrée sur la moyenne
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 6;
    let amount = mean + stdDev * (Math.random() + Math.random() + Math.random() - 1.5) * 2;
    amount = Math.max(min, Math.min(max, amount));
    return Math.round(amount * 100) / 100;
  } else {
    // Distribution uniforme
    return Math.round((min + Math.random() * (max - min)) * 100) / 100;
  }
}

/**
 * Sélectionne un élément selon des poids
 */
function weightedSelect(items, weightKey = 'poids') {
  const totalWeight = items.reduce((sum, item) => sum + (item[weightKey] || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item[weightKey] || 1;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * Génère un ID unique
 */
function generateId(prefix, index) {
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATEURS DE DATASETS MÉTIER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère un dataset de ventes commerciales
 * @param {Object} options
 * @param {number} options.nbRows - Nombre de lignes
 * @param {number} options.nbCommerciaux - Nombre de commerciaux
 * @param {string} options.periode - 'Q4_2025', 'annee_2025', etc.
 * @param {string} options.secteur - 'informatique', 'alimentaire', 'services'
 * @returns {Object} { headers, rows, metadata, commerciaux, stats }
 */
export function generateSalesData(options = {}) {
  const {
    nbRows = 150,
    nbCommerciaux = 6,
    periode = 'Q4_2025',
    secteur = 'informatique'
  } = options;
  
  // 1. Créer les commerciaux avec leurs régions
  const commerciaux = [];
  const regionsUsed = [...REGIONS_FRANCE].slice(0, nbCommerciaux);
  
  for (let i = 0; i < nbCommerciaux; i++) {
    const region = regionsUsed[i];
    commerciaux.push({
      nom: generateFullName(),
      region: region.nom,
      poids_region: region.poids,
      performance: 0.8 + Math.random() * 0.4, // 80% à 120% de performance
      objectif: Math.round((50000 + Math.random() * 100000) / 1000) * 1000
    });
  }
  
  // Définir un "top performer"
  const topPerformerIndex = Math.floor(Math.random() * nbCommerciaux);
  commerciaux[topPerformerIndex].performance = 1.2 + Math.random() * 0.3;
  
  // 2. Déterminer la période
  let startDate, endDate;
  if (periode === 'Q4_2025') {
    startDate = '2025-10-01';
    endDate = '2025-12-31';
  } else if (periode === 'Q1_2026') {
    startDate = '2026-01-01';
    endDate = '2026-03-31';
  } else {
    startDate = '2025-01-01';
    endDate = '2025-12-31';
  }
  
  // 3. Récupérer les catégories produits
  const categories = CATEGORIES_PRODUITS[secteur] || CATEGORIES_PRODUITS.informatique;
  
  // 4. Générer les lignes
  const rows = [];
  const headers = ['ID_Commande', 'Date', 'Commercial', 'Region', 'Client', 'Categorie', 'Montant_HT'];
  
  for (let i = 0; i < nbRows; i++) {
    // Sélectionner un commercial (pondéré par performance région)
    const commercial = weightedSelect(commerciaux.map(c => ({
      ...c,
      poids: c.poids_region * c.performance
    })));
    
    // Sélectionner une catégorie
    const categorie = categories[Math.floor(Math.random() * categories.length)];
    
    // Générer le montant (ajusté par performance)
    const baseAmount = generateAmount(categorie.prix_min, categorie.prix_max, 'normal');
    const adjustedAmount = Math.round(baseAmount * commercial.performance * 100) / 100;
    
    rows.push([
      generateId('CMD-2025', 1000 + i),
      generateDate(startDate, endDate),
      commercial.nom,
      commercial.region,
      generateClientName(),
      categorie.nom,
      adjustedAmount
    ]);
  }
  
  // 5. Trier par date
  rows.sort((a, b) => new Date(a[1]) - new Date(b[1]));
  
  // 6. Calculer les statistiques
  const stats = calculateDatasetStats(headers, rows, commerciaux);
  
  return {
    headers,
    rows,
    metadata: {
      periode,
      secteur,
      nbCommerciaux,
      source: 'Généré par CoherentDataGenerator',
      date_generation: new Date().toISOString()
    },
    commerciaux: commerciaux.map(c => ({
      nom: c.nom,
      region: c.region,
      objectif: c.objectif
    })),
    stats
  };
}

/**
 * Génère un dataset RH (employés)
 */
export function generateHRData(options = {}) {
  const {
    nbRows = 100,
    departments = ['IT', 'Sales', 'Marketing', 'Finance', 'RH', 'Operations']
  } = options;
  
  const headers = ['ID_Employe', 'Nom', 'Department', 'Poste', 'Date_Embauche', 'Salaire_Annuel', 'Performance', 'Anciennete_Ans'];
  const rows = [];
  
  const postes = {
    'IT': ['Développeur', 'Tech Lead', 'DevOps', 'Data Analyst'],
    'Sales': ['Commercial', 'Account Manager', 'Sales Director'],
    'Marketing': ['Chargé Marketing', 'Content Manager', 'Growth Manager'],
    'Finance': ['Contrôleur de gestion', 'Comptable', 'Analyste financier'],
    'RH': ['Chargé RH', 'Talent Acquisition', 'HR Business Partner'],
    'Operations': ['Chef de projet', 'Coordinateur', 'Responsable qualité']
  };
  
  const salairesBase = {
    'IT': { min: 38000, max: 75000 },
    'Sales': { min: 35000, max: 80000 },
    'Marketing': { min: 32000, max: 60000 },
    'Finance': { min: 40000, max: 70000 },
    'RH': { min: 35000, max: 55000 },
    'Operations': { min: 35000, max: 60000 }
  };
  
  for (let i = 0; i < nbRows; i++) {
    const department = departments[Math.floor(Math.random() * departments.length)];
    const postesList = postes[department] || ['Employé'];
    const poste = postesList[Math.floor(Math.random() * postesList.length)];
    const salaireRange = salairesBase[department] || { min: 30000, max: 50000 };
    
    const anciennete = Math.floor(Math.random() * 15);
    const dateEmbauche = new Date();
    dateEmbauche.setFullYear(dateEmbauche.getFullYear() - anciennete);
    dateEmbauche.setMonth(Math.floor(Math.random() * 12));
    
    const baseSalaire = generateAmount(salaireRange.min, salaireRange.max);
    const salaire = Math.round(baseSalaire * (1 + anciennete * 0.03)); // +3% par an d'ancienneté
    
    const performance = Math.round((2 + Math.random() * 3) * 10) / 10; // 2.0 à 5.0
    
    rows.push([
      generateId('EMP', i + 1),
      generateFullName(),
      department,
      poste,
      dateEmbauche.toISOString().split('T')[0],
      salaire,
      performance,
      anciennete
    ]);
  }
  
  return {
    headers,
    rows,
    metadata: {
      type: 'hr',
      departments,
      source: 'Généré par CoherentDataGenerator'
    }
  };
}

/**
 * Génère un dataset financier (transactions comptables)
 */
export function generateFinanceData(options = {}) {
  const {
    nbRows = 100,
    periode = 'annee_2025'
  } = options;
  
  const headers = ['ID_Transaction', 'Date', 'Type', 'Categorie', 'Description', 'Montant', 'Solde_Cumule'];
  const rows = [];
  
  const types = [
    { nom: 'Revenu', signe: 1, categories: ['Ventes', 'Services', 'Intérêts', 'Autres revenus'] },
    { nom: 'Dépense', signe: -1, categories: ['Salaires', 'Loyer', 'Fournitures', 'Marketing', 'IT', 'Déplacements', 'Autres charges'] }
  ];
  
  let startDate, endDate;
  if (periode === 'annee_2025') {
    startDate = '2025-01-01';
    endDate = '2025-12-31';
  } else {
    startDate = '2025-10-01';
    endDate = '2025-12-31';
  }
  
  let soldeCumule = 50000; // Solde initial
  
  for (let i = 0; i < nbRows; i++) {
    const type = types[Math.random() > 0.4 ? 1 : 0]; // Plus de dépenses que de revenus
    const categorie = type.categories[Math.floor(Math.random() * type.categories.length)];
    
    let montant;
    if (type.nom === 'Revenu') {
      montant = generateAmount(500, 15000);
    } else {
      montant = -generateAmount(100, 5000);
    }
    
    soldeCumule += montant;
    
    rows.push([
      generateId('TRX', i + 1),
      generateDate(startDate, endDate),
      type.nom,
      categorie,
      `${categorie} - Transaction ${i + 1}`,
      montant,
      Math.round(soldeCumule * 100) / 100
    ]);
  }
  
  // Trier par date
  rows.sort((a, b) => new Date(a[1]) - new Date(b[1]));
  
  // Recalculer le solde cumulé après tri
  soldeCumule = 50000;
  rows.forEach(row => {
    soldeCumule += row[5];
    row[6] = Math.round(soldeCumule * 100) / 100;
  });
  
  return {
    headers,
    rows,
    metadata: {
      type: 'finance',
      periode,
      solde_initial: 50000,
      source: 'Généré par CoherentDataGenerator'
    }
  };
}

/**
 * Génère un dataset budget personnel
 */
export function generateBudgetData(options = {}) {
  const {
    mois = 'decembre_2025'
  } = options;
  
  const headers = ['Date', 'Description', 'Categorie', 'Montant'];
  const rows = [];
  
  // Structure d'un mois type
  const transactions = [
    // Revenus
    { jour: 1, desc: 'Salaire', cat: 'Revenu', montant: [1800, 2200] },
    { jour: 15, desc: 'Prime', cat: 'Revenu', montant: [0, 300], proba: 0.3 },
    
    // Charges fixes
    { jour: 1, desc: 'Loyer', cat: 'Logement', montant: [-750, -850] },
    { jour: 1, desc: 'Électricité', cat: 'Logement', montant: [-40, -60] },
    { jour: 6, desc: 'Métro - Pass Navigo', cat: 'Transport', montant: [-86, -86] },
    { jour: 20, desc: 'Internet', cat: 'Logement', montant: [-30, -35] },
    { jour: 3, desc: 'Netflix', cat: 'Loisirs', montant: [-13, -14] },
    { jour: 3, desc: 'Spotify', cat: 'Loisirs', montant: [-10, -10] },
    { jour: 30, desc: 'Mutuelle', cat: 'Santé', montant: [-40, -50] },
    
    // Variables
    { jour: 'random', desc: 'Courses', cat: 'Alimentation', montant: [-30, -80], count: [4, 6] },
    { jour: 'random', desc: 'Restaurant', cat: 'Alimentation', montant: [-25, -60], count: [2, 4] },
    { jour: 'random', desc: 'Uber/Taxi', cat: 'Transport', montant: [-15, -30], count: [0, 2] },
    { jour: 'random', desc: 'Loisirs', cat: 'Loisirs', montant: [-15, -50], count: [1, 3] },
    { jour: 'random', desc: 'Shopping', cat: 'Loisirs', montant: [-30, -150], count: [0, 2] },
    { jour: 'random', desc: 'Pharmacie', cat: 'Santé', montant: [-10, -30], count: [0, 1] },
    { jour: 'random', desc: 'Divers', cat: 'Divers', montant: [-10, -50], count: [1, 3] }
  ];
  
  // Générer les transactions
  transactions.forEach(t => {
    // Vérifier probabilité
    if (t.proba && Math.random() > t.proba) return;
    
    const count = t.count ? t.count[0] + Math.floor(Math.random() * (t.count[1] - t.count[0] + 1)) : 1;
    
    for (let i = 0; i < count; i++) {
      const jour = t.jour === 'random' ? 1 + Math.floor(Math.random() * 28) : t.jour;
      const montant = Math.round((t.montant[0] + Math.random() * (t.montant[1] - t.montant[0])) * 100) / 100;
      const date = `2025-12-${String(jour).padStart(2, '0')}`;
      
      let description = t.desc;
      if (t.desc === 'Courses') {
        const enseignes = ['Monoprix', 'Carrefour', 'Franprix', 'Lidl', 'Marché'];
        description = `Courses ${enseignes[Math.floor(Math.random() * enseignes.length)]}`;
      }
      
      rows.push([date, description, t.cat, montant]);
    }
  });
  
  // Trier par date
  rows.sort((a, b) => new Date(a[0]) - new Date(b[0]));
  
  return {
    headers,
    rows,
    metadata: {
      type: 'budget_personnel',
      mois,
      source: 'Généré par CoherentDataGenerator'
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcule les statistiques d'un dataset
 */
function calculateDatasetStats(headers, rows, commerciaux = null) {
  const stats = {
    rowCount: rows.length,
    columns: {}
  };
  
  headers.forEach((header, colIndex) => {
    const values = rows.map(row => row[colIndex]).filter(v => v !== null && v !== '');
    const numericValues = values.filter(v => typeof v === 'number' || !isNaN(parseFloat(v)));
    
    if (numericValues.length > values.length * 0.5) {
      // Colonne numérique
      const nums = numericValues.map(v => parseFloat(v));
      stats.columns[header] = {
        type: 'number',
        min: Math.min(...nums),
        max: Math.max(...nums),
        sum: nums.reduce((a, b) => a + b, 0),
        avg: nums.reduce((a, b) => a + b, 0) / nums.length,
        count: nums.length
      };
    } else {
      // Colonne texte
      const uniqueValues = [...new Set(values)];
      stats.columns[header] = {
        type: 'text',
        uniqueCount: uniqueValues.length,
        uniqueValues: uniqueValues.slice(0, 20) // Max 20 valeurs
      };
    }
  });
  
  // Ajouter stats commerciaux si disponibles
  if (commerciaux) {
    stats.commerciaux = commerciaux.map(c => ({
      nom: c.nom,
      region: c.region,
      objectif: c.objectif
    }));
  }
  
  return stats;
}

/**
 * Formate les stats pour le prompt Claude
 */
export function formatStatsForPrompt(stats) {
  let output = `**Dataset** : ${stats.rowCount} lignes\n\n`;
  output += `**Colonnes disponibles** :\n`;
  
  for (const [name, col] of Object.entries(stats.columns)) {
    if (col.type === 'number') {
      output += `- ${name} (nombre) : min=${col.min}, max=${col.max}, somme=${Math.round(col.sum)}, moy=${Math.round(col.avg * 100) / 100}\n`;
    } else {
      output += `- ${name} (texte) : ${col.uniqueCount} valeurs uniques [${col.uniqueValues.slice(0, 5).join(', ')}${col.uniqueCount > 5 ? '...' : ''}]\n`;
    }
  }
  
  if (stats.commerciaux) {
    output += `\n**Commerciaux** :\n`;
    stats.commerciaux.forEach(c => {
      output += `- ${c.nom} (${c.region}) - Objectif: ${c.objectif}€\n`;
    });
  }
  
  return output;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  generateSalesData,
  generateHRData,
  generateFinanceData,
  generateBudgetData,
  formatStatsForPrompt,
  // Helpers
  generateFullName,
  generateClientName,
  generateDate,
  generateAmount
};