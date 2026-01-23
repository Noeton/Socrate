/**
 * REAL DATASET LOADER - v1.0
 * 
 * Charge et échantillonne les vrais datasets selon :
 * - Le métier de l'utilisateur (finance, marketing, RH, ventes, compta)
 * - Le niveau de maîtrise de la compétence
 * - La progression (nombre d'exercices réussis sur cette compétence)
 * 
 * PRINCIPES :
 * 1. Utiliser des VRAIES données (pas de génération fictive)
 * 2. Adapter la complexité à la progression
 * 3. Franciser les headers pour l'UX
 */

import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION DES DATASETS
// ═══════════════════════════════════════════════════════════════════════════

const DATASETS_CONFIG = {
  // ─────────────────────────────────────────────────────────────────────────
  // VENTES / COMMERCIAL
  // ─────────────────────────────────────────────────────────────────────────
  ventes: {
    primary: 'superstore_sales',
    alternatives: ['walmart_sales'],
    datasets: {
      superstore_sales: {
        path: 'ventes/superstore_sales.csv',
        delimiter: ',',
        headers_map: {
          'Row ID': 'ID',
          'Order ID': 'N_Commande',
          'Order Date': 'Date_Commande',
          'Ship Date': 'Date_Expedition',
          'Ship Mode': 'Mode_Livraison',
          'Customer ID': 'ID_Client',
          'Customer Name': 'Client',
          'Segment': 'Segment',
          'Country': 'Pays',
          'City': 'Ville',
          'State': 'Region',
          'Region': 'Zone',
          'Product ID': 'ID_Produit',
          'Category': 'Categorie',
          'Sub-Category': 'Sous_Categorie',
          'Product Name': 'Produit',
          'Sales': 'CA_HT',
          'Quantity': 'Quantite',
          'Discount': 'Remise',
          'Profit': 'Marge'
        },
        numeric_columns: ['CA_HT', 'Quantite', 'Remise', 'Marge'],
        text_columns: ['Segment', 'Categorie', 'Sous_Categorie', 'Region', 'Zone', 'Mode_Livraison'],
        date_columns: ['Date_Commande', 'Date_Expedition'],
        key_metrics: ['CA_HT', 'Marge', 'Quantite'],
        vocabulary: ['CA', 'marge', 'panier moyen', 'taux de remise', 'segment client']
      },
      walmart_sales: {
        path: 'ventes/walmart_sales.csv',
        delimiter: ',',
        headers_map: {
          'Store': 'Magasin',
          'Date': 'Date',
          'Weekly_Sales': 'CA_Hebdo',
          'Holiday_Flag': 'Jour_Ferie',
          'Temperature': 'Temperature',
          'Fuel_Price': 'Prix_Carburant',
          'CPI': 'Indice_Prix',
          'Unemployment': 'Chomage'
        },
        numeric_columns: ['CA_Hebdo', 'Temperature', 'Prix_Carburant', 'Indice_Prix', 'Chomage'],
        text_columns: ['Magasin', 'Jour_Ferie'],
        date_columns: ['Date'],
        key_metrics: ['CA_Hebdo'],
        vocabulary: ['ventes hebdo', 'saisonnalité', 'magasin', 'performance']
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCE
  // ─────────────────────────────────────────────────────────────────────────
  finance: {
    primary: 'company_financials',
    alternatives: [],
    datasets: {
      company_financials: {
        path: 'finance/company_financials.csv',
        delimiter: ',',
        headers_map: {
          'Segment': 'Segment',
          'Country': 'Pays',
          'Product': 'Produit',
          'Discount Band': 'Tranche_Remise',
          'Units Sold': 'Unites_Vendues',
          'Manufacturing Price': 'Cout_Fabrication',
          'Sale Price': 'Prix_Vente',
          'Gross Sales': 'CA_Brut',
          'Discounts': 'Remises',
          'Sales': 'CA_Net',
          'COGS': 'Cout_Revient',
          'Profit': 'Resultat',
          'Date': 'Date'
        },
        numeric_columns: ['Unites_Vendues', 'Cout_Fabrication', 'Prix_Vente', 'CA_Brut', 'Remises', 'CA_Net', 'Cout_Revient', 'Resultat'],
        text_columns: ['Segment', 'Pays', 'Produit', 'Tranche_Remise'],
        date_columns: ['Date'],
        key_metrics: ['CA_Net', 'Resultat', 'Cout_Revient'],
        vocabulary: ['P&L', 'marge brute', 'COGS', 'résultat opérationnel', 'segment']
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMPTABILITÉ
  // ─────────────────────────────────────────────────────────────────────────
  comptabilite: {
    primary: 'accounting_transactions',
    alternatives: [],
    datasets: {
      accounting_transactions: {
        path: 'compta/accounting_transactions.csv',
        delimiter: ',',
        headers_map: {
          'Transaction ID': 'ID_Ecriture',
          'Date': 'Date',
          'Account Type': 'Type_Compte',
          'Transaction Amount': 'Montant',
          'Cash Flow': 'Flux_Tresorerie',
          'Net Income': 'Resultat_Net',
          'Revenue': 'Produits',
          'Expenditure': 'Charges',
          'Profit Margin': 'Taux_Marge',
          'Debt-to-Equity Ratio': 'Ratio_Endettement'
        },
        numeric_columns: ['Montant', 'Flux_Tresorerie', 'Resultat_Net', 'Produits', 'Charges', 'Taux_Marge', 'Ratio_Endettement'],
        text_columns: ['Type_Compte'],
        date_columns: ['Date'],
        key_metrics: ['Montant', 'Resultat_Net', 'Flux_Tresorerie'],
        vocabulary: ['écriture', 'débit', 'crédit', 'compte', 'journal', 'rapprochement']
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RESSOURCES HUMAINES
  // ─────────────────────────────────────────────────────────────────────────
  rh: {
    primary: 'ibm_hr_analytics',
    alternatives: [],
    datasets: {
      ibm_hr_analytics: {
        path: 'rh/ibm_hr_analytics.csv',
        delimiter: ',',
        headers_map: {
          'Age': 'Age',
          'Attrition': 'Depart',
          'BusinessTravel': 'Deplacements',
          'DailyRate': 'Taux_Journalier',
          'Department': 'Departement',
          'DistanceFromHome': 'Distance_Domicile',
          'Education': 'Niveau_Etudes',
          'EducationField': 'Domaine_Etudes',
          'EmployeeCount': 'Nb_Employes',
          'EmployeeNumber': 'Matricule',
          'EnvironmentSatisfaction': 'Satisfaction_Environnement',
          'Gender': 'Genre',
          'HourlyRate': 'Taux_Horaire',
          'JobInvolvement': 'Implication',
          'JobLevel': 'Niveau_Poste',
          'JobRole': 'Poste',
          'JobSatisfaction': 'Satisfaction_Poste',
          'MaritalStatus': 'Statut_Marital',
          'MonthlyIncome': 'Salaire_Mensuel',
          'MonthlyRate': 'Taux_Mensuel',
          'NumCompaniesWorked': 'Nb_Entreprises',
          'OverTime': 'Heures_Sup',
          'PercentSalaryHike': 'Augmentation_Pct',
          'PerformanceRating': 'Note_Performance',
          'TotalWorkingYears': 'Experience_Totale',
          'YearsAtCompany': 'Anciennete',
          'YearsInCurrentRole': 'Annees_Poste_Actuel',
          'YearsSinceLastPromotion': 'Annees_Depuis_Promotion'
        },
        numeric_columns: ['Age', 'Taux_Journalier', 'Distance_Domicile', 'Salaire_Mensuel', 'Experience_Totale', 'Anciennete', 'Augmentation_Pct', 'Note_Performance'],
        text_columns: ['Depart', 'Departement', 'Poste', 'Genre', 'Deplacements', 'Heures_Sup'],
        date_columns: [],
        key_metrics: ['Salaire_Mensuel', 'Anciennete', 'Note_Performance'],
        vocabulary: ['turnover', 'attrition', 'masse salariale', 'effectif', 'ancienneté']
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MARKETING
  // ─────────────────────────────────────────────────────────────────────────
  marketing: {
    primary: 'marketing_campaign',
    alternatives: [],
    datasets: {
      marketing_campaign: {
        path: 'marketing/marketing_campaign.csv',
        delimiter: ',',
        headers_map: {
          'ID': 'ID_Client',
          'Year_Birth': 'Annee_Naissance',
          'Education': 'Niveau_Etudes',
          'Marital_Status': 'Statut_Marital',
          'Income': 'Revenu_Annuel',
          'Kidhome': 'Enfants_Maison',
          'Teenhome': 'Ados_Maison',
          'Dt_Customer': 'Date_Inscription',
          'Recency': 'Jours_Depuis_Achat',
          'MntWines': 'Achats_Vins',
          'MntFruits': 'Achats_Fruits',
          'MntMeatProducts': 'Achats_Viande',
          'MntFishProducts': 'Achats_Poisson',
          'MntSweetProducts': 'Achats_Confiserie',
          'MntGoldProds': 'Achats_Premium',
          'NumDealsPurchases': 'Achats_Promo',
          'NumWebPurchases': 'Achats_Web',
          'NumCatalogPurchases': 'Achats_Catalogue',
          'NumStorePurchases': 'Achats_Magasin',
          'NumWebVisitsMonth': 'Visites_Web_Mois',
          'AcceptedCmp1': 'Campagne_1',
          'AcceptedCmp2': 'Campagne_2',
          'AcceptedCmp3': 'Campagne_3',
          'AcceptedCmp4': 'Campagne_4',
          'AcceptedCmp5': 'Campagne_5',
          'Response': 'Reponse_Derniere_Campagne',
          'Complain': 'Reclamation'
        },
        numeric_columns: ['Revenu_Annuel', 'Jours_Depuis_Achat', 'Achats_Vins', 'Achats_Fruits', 'Achats_Viande', 'Achats_Web', 'Achats_Magasin', 'Visites_Web_Mois'],
        text_columns: ['Niveau_Etudes', 'Statut_Marital', 'Campagne_1', 'Campagne_2', 'Campagne_3', 'Reponse_Derniere_Campagne'],
        date_columns: ['Date_Inscription'],
        key_metrics: ['Revenu_Annuel', 'Achats_Web', 'Jours_Depuis_Achat'],
        vocabulary: ['RFM', 'segmentation', 'conversion', 'panier moyen', 'LTV', 'churn']
      }
    }
  }
};

// Mapping des métiers alternatifs vers les clés principales
const METIER_ALIASES = {
  'commercial': 'ventes',
  'vente': 'ventes',
  'sales': 'ventes',
  'financier': 'finance',
  'controle_gestion': 'finance',
  'comptable': 'comptabilite',
  'compta': 'comptabilite',
  'accounting': 'comptabilite',
  'ressources_humaines': 'rh',
  'hr': 'rh',
  'human_resources': 'rh',
  'mkt': 'marketing',
  'digital': 'marketing',
  'growth': 'marketing'
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION DE PROGRESSION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Définit la complexité selon la progression sur une compétence
 * exercicesReussis = nombre d'exercices réussis sur CETTE compétence
 */
const PROGRESSION_CONFIG = {
  // Premier contact avec la compétence
  discovery: {
    minRows: 15,
    maxRows: 25,
    complexity: 'simple',
    filtersCount: 0,
    multiCriteria: false,
    includeOutliers: false,
    description: 'Découverte - données simples et claires'
  },
  
  // 1-2 exercices réussis
  learning: {
    minRows: 25,
    maxRows: 50,
    complexity: 'standard',
    filtersCount: 1,
    multiCriteria: false,
    includeOutliers: false,
    description: 'Apprentissage - données standard'
  },
  
  // 3-4 exercices réussis
  consolidation: {
    minRows: 50,
    maxRows: 100,
    complexity: 'standard',
    filtersCount: 2,
    multiCriteria: true,
    includeOutliers: false,
    description: 'Consolidation - volume et critères multiples'
  },
  
  // 5-6 exercices réussis
  mastery: {
    minRows: 100,
    maxRows: 200,
    complexity: 'advanced',
    filtersCount: 3,
    multiCriteria: true,
    includeOutliers: true,
    description: 'Maîtrise - données complexes avec pièges'
  },
  
  // 7+ exercices réussis (autonomie)
  autonomy: {
    minRows: 150,
    maxRows: 300,
    complexity: 'expert',
    filtersCount: 4,
    multiCriteria: true,
    includeOutliers: true,
    description: 'Autonomie - conditions réelles'
  }
};

/**
 * Détermine le niveau de progression selon le nombre d'exercices réussis
 */
function getProgressionLevel(exercicesReussis) {
  if (exercicesReussis === 0) return 'discovery';
  if (exercicesReussis <= 2) return 'learning';
  if (exercicesReussis <= 4) return 'consolidation';
  if (exercicesReussis <= 6) return 'mastery';
  return 'autonomy';
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

class RealDatasetLoader {
  constructor() {
    this.cache = new Map(); // Cache des datasets chargés
    this.basePath = path.join(process.cwd(), 'shared', 'data', 'real-datasets');
  }

  /**
   * Charge et échantillonne un dataset adapté au contexte
   * 
   * @param {Object} options
   * @param {string} options.metier - Métier de l'utilisateur
   * @param {number} options.competenceId - ID de la compétence
   * @param {number} options.exercicesReussis - Nombre d'exercices réussis sur cette compétence
   * @param {string} options.exerciseType - Type d'exercice (discovery, consolidation, etc.)
   * @returns {Object} { headers, rows, metadata, config }
   */
  async loadForContext(options) {
    const {
      metier = 'ventes',
      competenceId,
      exercicesReussis = 0,
      exerciseType = 'consolidation'
    } = options;

    console.log(`📊 [DatasetLoader] Chargement pour métier=${metier}, compétence=${competenceId}, exercicesReussis=${exercicesReussis}`);

    // 1. Résoudre le métier
    const metierKey = this.resolveMetier(metier);
    const metierConfig = DATASETS_CONFIG[metierKey];
    
    if (!metierConfig) {
      console.warn(`⚠️ [DatasetLoader] Métier "${metier}" non trouvé, fallback sur ventes`);
      return this.loadForContext({ ...options, metier: 'ventes' });
    }

    // 2. Sélectionner le dataset
    const datasetKey = metierConfig.primary;
    const datasetConfig = metierConfig.datasets[datasetKey];

    // 3. Déterminer le niveau de progression
    const progressionLevel = exerciseType === 'discovery' ? 'discovery' : getProgressionLevel(exercicesReussis);
    const progressionConfig = PROGRESSION_CONFIG[progressionLevel];

    console.log(`📈 [DatasetLoader] Progression: ${progressionLevel} (${progressionConfig.description})`);

    // 4. Charger le dataset brut
    const rawData = await this.loadRawDataset(datasetConfig.path, datasetConfig.delimiter);

    // 5. Échantillonner selon la progression
    const sampledData = this.sampleData(rawData, progressionConfig, datasetConfig);

    // 6. Franciser les headers
    const frenchData = this.translateHeaders(sampledData, datasetConfig.headers_map);

    // 7. Construire les métadonnées
    const metadata = {
      source: datasetKey,
      metier: metierKey,
      originalRows: rawData.length,
      sampledRows: frenchData.rows.length,
      progressionLevel,
      complexity: progressionConfig.complexity,
      vocabulary: datasetConfig.vocabulary,
      numericColumns: datasetConfig.numeric_columns,
      textColumns: datasetConfig.text_columns,
      keyMetrics: datasetConfig.key_metrics
    };

    console.log(`✅ [DatasetLoader] ${frenchData.rows.length} lignes chargées (${progressionLevel})`);

    return {
      headers: frenchData.headers,
      rows: frenchData.rows,
      metadata,
      config: progressionConfig
    };
  }

  /**
   * Résout le métier vers une clé standard
   */
  resolveMetier(metier) {
    const normalized = metier?.toLowerCase().trim() || 'ventes';
    return METIER_ALIASES[normalized] || normalized;
  }

  /**
   * Charge un dataset brut depuis le CSV
   */
  async loadRawDataset(relativePath, delimiter = ',') {
    const fullPath = path.join(this.basePath, relativePath);
    
    // Vérifier le cache
    if (this.cache.has(fullPath)) {
      console.log(`💾 [DatasetLoader] Cache hit: ${relativePath}`);
      return this.cache.get(fullPath);
    }

    // Charger le fichier
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Dataset non trouvé: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Parser le CSV
    const headers = this.parseCSVLine(lines[0], delimiter);
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      if (values.length === headers.length) {
        // Convertir les nombres (gérer les formats monétaires $1,234.56)
        const typedValues = values.map((val, idx) => {
          const cleaned = this.cleanNumericValue(val);
          const num = parseFloat(cleaned);
          return !isNaN(num) && cleaned.trim() !== '' ? num : val.trim();
        });
        rows.push(typedValues);
      }
    }

    // Mettre en cache
    this.cache.set(fullPath, { headers, rows });
    
    console.log(`📂 [DatasetLoader] Chargé ${relativePath}: ${rows.length} lignes`);
    
    return { headers, rows };
  }

  /**
   * Parse une ligne CSV (gère les guillemets)
   */
  parseCSVLine(line, delimiter = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/^"|"$/g, '').replace(/\r$/, ''));
    
    return result;
  }

  /**
   * Nettoie une valeur pour la conversion numérique
   * Gère les formats : $1,234.56, 1 234,56€, (1234), -$1,234
   */
  cleanNumericValue(val) {
    if (typeof val !== 'string') return val;
    
    let cleaned = val.trim();
    
    // Supprimer les symboles monétaires et espaces
    cleaned = cleaned.replace(/[$€£¥₹]/g, '').trim();
    
    // Gérer les nombres négatifs entre parenthèses : (1234) -> -1234
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      cleaned = '-' + cleaned.slice(1, -1);
    }
    
    // Supprimer les espaces dans les nombres (format européen 1 234)
    cleaned = cleaned.replace(/\s/g, '');
    
    // Gérer le format américain avec virgules : 1,234.56 -> 1234.56
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Format US : virgules = milliers, point = décimales
      cleaned = cleaned.replace(/,/g, '');
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      // Pourrait être format EU (virgule = décimale) ou US (virgule = milliers)
      // Si plus de 2 chiffres après la virgule, c'est probablement des milliers
      const parts = cleaned.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Format EU : 1234,56 -> 1234.56
        cleaned = cleaned.replace(',', '.');
      } else {
        // Format US : 1,234 -> 1234
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    
    // Supprimer le tiret isolé (représente 0 ou vide)
    if (cleaned === '-' || cleaned === '- ' || cleaned === ' -') {
      cleaned = '0';
    }
    
    return cleaned;
  }

  /**
   * Échantillonne les données selon la progression
   */
  sampleData(rawData, progressionConfig, datasetConfig) {
    const { headers, rows } = rawData;
    const { minRows, maxRows, includeOutliers, filtersCount } = progressionConfig;

    // Déterminer le nombre de lignes
    const targetRows = Math.min(
      Math.floor(minRows + Math.random() * (maxRows - minRows)),
      rows.length
    );

    // Stratégie d'échantillonnage
    let sampledRows;
    
    if (includeOutliers) {
      // Inclure quelques outliers pour les niveaux avancés
      sampledRows = this.stratifiedSample(rows, headers, targetRows, datasetConfig);
    } else {
      // Échantillonnage simple pour les débutants
      sampledRows = this.simpleSample(rows, targetRows);
    }

    // Filtrer pour avoir des données "propres" si niveau débutant
    if (progressionConfig.complexity === 'simple') {
      sampledRows = this.cleanData(sampledRows, headers, datasetConfig);
    }

    return { headers, rows: sampledRows };
  }

  /**
   * Échantillonnage simple (aléatoire)
   */
  simpleSample(rows, targetRows) {
    const shuffled = [...rows].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, targetRows);
  }

  /**
   * Échantillonnage stratifié (garde la diversité des catégories)
   */
  stratifiedSample(rows, headers, targetRows, datasetConfig) {
    // Trouver une colonne catégorielle pour stratifier
    const textCols = datasetConfig.text_columns || [];
    const stratifyCol = textCols[0];
    
    if (!stratifyCol) {
      return this.simpleSample(rows, targetRows);
    }

    // Trouver l'index de la colonne (en utilisant le nom original)
    const reverseMap = {};
    for (const [orig, fr] of Object.entries(datasetConfig.headers_map)) {
      reverseMap[fr] = orig;
    }
    const origColName = reverseMap[stratifyCol] || stratifyCol;
    const colIdx = headers.findIndex(h => h === origColName || h === stratifyCol);
    
    if (colIdx === -1) {
      return this.simpleSample(rows, targetRows);
    }

    // Grouper par valeur
    const groups = {};
    rows.forEach(row => {
      const key = String(row[colIdx]);
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    // Prendre proportionnellement de chaque groupe
    const groupKeys = Object.keys(groups);
    const perGroup = Math.ceil(targetRows / groupKeys.length);
    
    let result = [];
    groupKeys.forEach(key => {
      const groupRows = groups[key].sort(() => Math.random() - 0.5);
      result = result.concat(groupRows.slice(0, perGroup));
    });

    // Mélanger et limiter
    return result.sort(() => Math.random() - 0.5).slice(0, targetRows);
  }

  /**
   * Nettoie les données (supprime les valeurs manquantes/aberrantes)
   */
  cleanData(rows, headers, datasetConfig) {
    const numericCols = datasetConfig.numeric_columns || [];
    
    // Construire le reverse map : nom français -> nom original
    const reverseMap = {};
    for (const [orig, fr] of Object.entries(datasetConfig.headers_map)) {
      reverseMap[fr] = orig;
    }
    
    // Trouver les indices des colonnes numériques (en utilisant le nom original)
    const numericIndices = numericCols.map(frName => {
      const origName = reverseMap[frName] || frName;
      // Chercher en ignorant les espaces et la casse
      const idx = headers.findIndex(h => {
        const hClean = h.trim().toLowerCase();
        const origClean = origName.trim().toLowerCase();
        return hClean === origClean || hClean.includes(origClean) || origClean.includes(hClean);
      });
      return idx;
    }).filter(idx => idx !== -1);

    // Si aucune colonne trouvée, ne pas filtrer
    if (numericIndices.length === 0) {
      console.log('⚠️ [DatasetLoader] Aucune colonne numérique trouvée pour le nettoyage');
      return rows;
    }

    // Filtrer les lignes avec des valeurs manquantes dans les colonnes clés
    const cleanedRows = rows.filter(row => {
      return numericIndices.every(idx => {
        const val = row[idx];
        return val !== null && val !== undefined && val !== '' && (typeof val === 'number' || !isNaN(parseFloat(val)));
      });
    });

    // Si trop de lignes filtrées, on est plus permissif
    if (cleanedRows.length < rows.length * 0.3) {
      console.log(`⚠️ [DatasetLoader] Nettoyage trop agressif (${cleanedRows.length}/${rows.length}), on garde tout`);
      return rows;
    }

    return cleanedRows;
  }

  /**
   * Traduit les headers en français
   */
  translateHeaders(data, headersMap) {
    const { headers, rows } = data;
    
    const frenchHeaders = headers.map(h => {
      // Nettoyer le header (espaces, BOM)
      const cleaned = h.trim().replace(/^\uFEFF/, '');
      return headersMap[cleaned] || headersMap[h] || h;
    });

    return { headers: frenchHeaders, rows };
  }

  /**
   * Retourne la configuration pour un métier donné
   */
  getMetierConfig(metier) {
    const metierKey = this.resolveMetier(metier);
    return DATASETS_CONFIG[metierKey] || DATASETS_CONFIG.ventes;
  }

  /**
   * Liste tous les métiers disponibles
   */
  getAvailableMetiers() {
    return Object.keys(DATASETS_CONFIG);
  }

  /**
   * Retourne les infos de progression
   */
  getProgressionInfo(exercicesReussis) {
    const level = getProgressionLevel(exercicesReussis);
    return {
      level,
      ...PROGRESSION_CONFIG[level]
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

const loaderInstance = new RealDatasetLoader();

export {
  RealDatasetLoader,
  DATASETS_CONFIG,
  PROGRESSION_CONFIG,
  getProgressionLevel
};

export default loaderInstance;