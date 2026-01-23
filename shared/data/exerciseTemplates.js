/**
 * EXERCISE TEMPLATES
 * 
 * Structure des exercices SANS données.
 * Claude génère le contexte narratif + questions + checkpoints au runtime
 * en fonction du profil utilisateur et du dataset.
 * 
 * 80% des exercices = générés dynamiquement avec ces templates
 * 20% des exercices = templates statiques pour première découverte (dans /exercises/)
 */

export const EXERCISE_TEMPLATES = {
  
    // ============================================
    // NIVEAU DÉBUTANT
    // ============================================
    
    budget_previsionnel: {
      id: 'budget_previsionnel',
      niveau: 'debutant',
      competences: ['SOMME', 'Multiplication', 'Recopie'],
      
      // Dataset recommandé + fallback
      dataset: {
        recommended: 'compta/accounting_transactions.csv',
        fallback: 'finance/company_financials.csv',
        rowsRange: [20, 50], // min-max lignes à utiliser
        columnsNeeded: ['montant', 'categorie', 'date'] // colonnes requises
      },
      
      // Structure des checkpoints (Claude remplit les valeurs)
      checkpointStructure: [
        { type: 'formule', fonction: 'SOMME', description: 'Total des dépenses' },
        { type: 'formule', fonction: 'multiplication', description: 'Calcul avec taux' },
        { type: 'formule', fonction: 'SOMME', description: 'Total général' }
      ],
      
      // Objectifs pédagogiques
      objectifs: [
        'Calculer des totaux avec SOMME',
        'Appliquer un taux (multiplication)',
        'Recopier une formule'
      ],
      
      // Métiers compatibles (pour personnalisation)
      metiersCompatibles: ['comptabilite', 'finance', 'gestion', 'audit', 'all'],
      
      dureeEstimee: '15 min'
    },
    
    suivi_ventes: {
      id: 'suivi_ventes',
      niveau: 'debutant',
      competences: ['SOMME', 'MOYENNE', 'MIN', 'MAX', 'NB'],
      
      dataset: {
        recommended: 'ventes/superstore_sales.csv',
        fallback: 'ventes/walmart_sales.csv',
        rowsRange: [30, 80],
        columnsNeeded: ['sales', 'quantity', 'product', 'region']
      },
      
      checkpointStructure: [
        { type: 'formule', fonction: 'SOMME', description: 'CA total' },
        { type: 'formule', fonction: 'MOYENNE', description: 'Vente moyenne' },
        { type: 'formule', fonction: 'MAX', description: 'Meilleure vente' },
        { type: 'formule', fonction: 'NB', description: 'Nombre de transactions' }
      ],
      
      objectifs: [
        'Calculer un chiffre d\'affaires',
        'Analyser avec MOYENNE, MIN, MAX',
        'Compter des éléments'
      ],
      
      metiersCompatibles: ['vente', 'commerce', 'retail', 'ecommerce', 'all'],
      
      dureeEstimee: '15 min'
    },
    
    analyse_rh_simple: {
      id: 'analyse_rh_simple',
      niveau: 'debutant',
      competences: ['SOMME', 'MOYENNE', 'NB', 'NB.SI'],
      
      dataset: {
        recommended: 'rh/ibm_hr_analytics.csv',
        fallback: null,
        rowsRange: [30, 60],
        columnsNeeded: ['salary', 'department', 'age', 'years_at_company']
      },
      
      checkpointStructure: [
        { type: 'formule', fonction: 'MOYENNE', description: 'Salaire moyen' },
        { type: 'formule', fonction: 'NB', description: 'Effectif total' },
        { type: 'formule', fonction: 'NB.SI', description: 'Effectif par département' }
      ],
      
      objectifs: [
        'Calculer des moyennes RH',
        'Compter des effectifs',
        'Utiliser NB.SI pour filtrer'
      ],
      
      metiersCompatibles: ['rh', 'management', 'direction', 'all'],
      
      dureeEstimee: '15 min'
    },
    
    // ============================================
    // NIVEAU INTERMÉDIAIRE
    // ============================================
    
    commissions_vendeurs: {
      id: 'commissions_vendeurs',
      niveau: 'intermediaire',
      competences: ['SI', 'Références absolues ($)', 'SOMME', 'Recopie'],
      
      dataset: {
        recommended: 'ventes/superstore_sales.csv',
        fallback: 'ventes/walmart_sales.csv',
        rowsRange: [40, 100],
        columnsNeeded: ['sales', 'salesperson', 'region', 'profit']
      },
      
      checkpointStructure: [
        { type: 'formule', fonction: 'multiplication_$', description: 'Commission avec taux fixe ($)' },
        { type: 'formule', fonction: 'SI', description: 'Bonus conditionnel' },
        { type: 'formule', fonction: 'SOMME', description: 'Total commissions' }
      ],
      
      objectifs: [
        'Utiliser les références absolues ($)',
        'Créer des conditions avec SI',
        'Recopier sans casser les références'
      ],
      
      metiersCompatibles: ['vente', 'commerce', 'finance', 'all'],
      
      dureeEstimee: '20 min'
    },
    
    recherche_produits: {
      id: 'recherche_produits',
      niveau: 'intermediaire',
      competences: ['RECHERCHEV', 'SIERREUR', 'Références absolues ($)'],
      
      dataset: {
        recommended: 'ventes/superstore_sales.csv',
        fallback: 'finance/company_financials.csv',
        rowsRange: [50, 150],
        columnsNeeded: ['product_id', 'product_name', 'price', 'category']
      },
      
      checkpointStructure: [
        { type: 'formule', fonction: 'RECHERCHEV', description: 'Recherche prix produit' },
        { type: 'formule', fonction: 'SIERREUR', description: 'Gestion erreur #N/A' },
        { type: 'formule', fonction: 'RECHERCHEV', description: 'Recherche catégorie' }
      ],
      
      objectifs: [
        'Maîtriser RECHERCHEV',
        'Gérer les erreurs avec SIERREUR',
        'Figer la table de référence'
      ],
      
      metiersCompatibles: ['logistique', 'achat', 'vente', 'commerce', 'all'],
      
      dureeEstimee: '25 min'
    },
    
    analyse_marketing: {
      id: 'analyse_marketing',
      niveau: 'intermediaire',
      competences: ['NB.SI', 'SOMME.SI', 'MOYENNE.SI', 'SI'],
      
      dataset: {
        recommended: 'marketing/marketing_campaign.csv',
        fallback: 'ventes/superstore_sales.csv',
        rowsRange: [50, 150],
        columnsNeeded: ['campaign', 'channel', 'spend', 'conversions', 'revenue']
      },
      
      checkpointStructure: [
        { type: 'formule', fonction: 'SOMME.SI', description: 'Dépenses par canal' },
        { type: 'formule', fonction: 'NB.SI', description: 'Nombre campagnes par type' },
        { type: 'formule', fonction: 'MOYENNE.SI', description: 'ROI moyen par canal' }
      ],
      
      objectifs: [
        'Analyser par critère avec SOMME.SI',
        'Compter conditionnellement',
        'Calculer des moyennes filtrées'
      ],
      
      metiersCompatibles: ['marketing', 'digital', 'communication', 'all'],
      
      dureeEstimee: '25 min'
    },
    
    rapprochement_comptable: {
      id: 'rapprochement_comptable',
      niveau: 'intermediaire',
      competences: ['RECHERCHEV', 'SI', 'SIERREUR', 'Mise en forme conditionnelle'],
      
      dataset: {
        recommended: 'compta/accounting_transactions.csv',
        fallback: 'finance/company_financials.csv',
        rowsRange: [40, 100],
        columnsNeeded: ['transaction_id', 'amount', 'date', 'status', 'type']
      },
      
      checkpointStructure: [
        { type: 'formule', fonction: 'RECHERCHEV', description: 'Rapprochement facture/paiement' },
        { type: 'formule', fonction: 'SI', description: 'Statut (Payé/En attente)' },
        { type: 'formule', fonction: 'SOMME.SI', description: 'Total par statut' }
      ],
      
      objectifs: [
        'Rapprocher deux tables',
        'Identifier les écarts',
        'Calculer par statut'
      ],
      
      metiersCompatibles: ['comptabilite', 'finance', 'audit', 'tresorerie', 'all'],
      
      dureeEstimee: '25 min'
    },
    
    // ============================================
    // NIVEAU AVANCÉ
    // ============================================
    
    dashboard_ventes: {
      id: 'dashboard_ventes',
      niveau: 'avance',
      competences: ['SOMME.SI.ENS', 'INDEX/EQUIV', 'Formules matricielles', 'Graphiques'],
      
      dataset: {
        recommended: 'ventes/superstore_sales.csv',
        fallback: 'ventes/walmart_sales.csv',
        rowsRange: [200, 500],
        columnsNeeded: ['sales', 'profit', 'region', 'category', 'date', 'segment']
      },
      
      checkpointStructure: [
        { type: 'formule', fonction: 'SOMME.SI.ENS', description: 'CA par région ET catégorie' },
        { type: 'formule', fonction: 'INDEX/EQUIV', description: 'Top produit par région' },
        { type: 'formule', fonction: 'calcul', description: 'Évolution M/M-1' }
      ],
      
      objectifs: [
        'Créer des analyses multicritères',
        'Utiliser INDEX/EQUIV',
        'Construire un mini-dashboard'
      ],
      
      metiersCompatibles: ['data', 'finance', 'direction', 'conseil', 'all'],
      
      dureeEstimee: '40 min'
    },
    
    analyse_rh_avancee: {
      id: 'analyse_rh_avancee',
      niveau: 'avance',
      competences: ['SOMME.SI.ENS', 'NB.SI.ENS', 'MOYENNE.SI.ENS', 'INDEX/EQUIV'],
      
      dataset: {
        recommended: 'rh/ibm_hr_analytics.csv',
        fallback: null,
        rowsRange: [200, 500],
        columnsNeeded: ['salary', 'department', 'job_role', 'performance_rating', 'years_at_company', 'attrition']
      },
      
      checkpointStructure: [
        { type: 'formule', fonction: 'MOYENNE.SI.ENS', description: 'Salaire moyen par dept ET ancienneté' },
        { type: 'formule', fonction: 'NB.SI.ENS', description: 'Turnover par critères' },
        { type: 'formule', fonction: 'INDEX/EQUIV', description: 'Département avec plus haut turnover' }
      ],
      
      objectifs: [
        'Analyses RH multicritères',
        'Identifier patterns de turnover',
        'Extraire des insights'
      ],
      
      metiersCompatibles: ['rh', 'management', 'direction', 'conseil', 'all'],
      
      dureeEstimee: '40 min'
    },
    
    modelisation_financiere: {
      id: 'modelisation_financiere',
      niveau: 'avance',
      competences: ['VAN', 'TRI', 'Scénarios', 'Tables de données', 'SI imbriqués'],
      
      dataset: {
        recommended: 'finance/company_financials.csv',
        fallback: null,
        rowsRange: [50, 100],
        columnsNeeded: ['revenue', 'costs', 'year', 'growth_rate', 'margin']
      },
      
      checkpointStructure: [
        { type: 'formule', fonction: 'VAN', description: 'Valeur Actuelle Nette' },
        { type: 'formule', fonction: 'TRI', description: 'Taux de Rentabilité Interne' },
        { type: 'formule', fonction: 'SI_imbrique', description: 'Sensibilité aux hypothèses' }
      ],
      
      objectifs: [
        'Calculer VAN et TRI',
        'Créer des scénarios',
        'Analyser la sensibilité'
      ],
      
      metiersCompatibles: ['finance', 'investissement', 'ma', 'conseil', 'direction'],
      
      dureeEstimee: '45 min'
    }
  };
  
  /**
   * Récupère un template par ID
   */
  export function getTemplateById(templateId) {
    return EXERCISE_TEMPLATES[templateId] || null;
  }
  
  /**
   * Récupère tous les templates d'un niveau
   */
  export function getTemplatesByLevel(niveau) {
    return Object.values(EXERCISE_TEMPLATES).filter(t => t.niveau === niveau);
  }
  
  /**
   * Récupère les templates compatibles avec un métier
   */
  export function getTemplatesForMetier(metier, niveau = null) {
    let templates = Object.values(EXERCISE_TEMPLATES).filter(t => 
      t.metiersCompatibles.includes(metier) || t.metiersCompatibles.includes('all')
    );
    
    if (niveau) {
      templates = templates.filter(t => t.niveau === niveau);
    }
    
    return templates;
  }
  
  /**
   * Récupère les templates qui travaillent une compétence
   */
  export function getTemplatesForCompetence(competence) {
    return Object.values(EXERCISE_TEMPLATES).filter(t =>
      t.competences.some(c => c.toLowerCase().includes(competence.toLowerCase()))
    );
  }
  
  export default EXERCISE_TEMPLATES;