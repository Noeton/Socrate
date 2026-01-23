/**
 * COMPÉTENCES DISPONIBLES POUR SOCRATE - v2.0 (AUDITÉ)
 * 
 * Ce fichier est la SOURCE DE VÉRITÉ basée sur l'audit réel du code.
 * 
 * MISE À JOUR : 22 janvier 2026 - Après audit exhaustif
 */

// ═══════════════════════════════════════════════════════════════
// SANDBOX INTERACTIFS - 100% FONCTIONNELS (26)
// L'utilisateur tape sa formule, validation automatique immédiate
// ═══════════════════════════════════════════════════════════════

export const SANDBOX_INTERACTIFS = {
  debutant: [
    { id: 'SOMME', nom: 'SOMME', description: 'Additionner des cellules', expectedResult: 8000 },
    { id: 'MOYENNE', nom: 'MOYENNE', description: 'Calculer une moyenne', expectedResult: 13 },
    { id: 'MIN_MAX', nom: 'MIN / MAX', description: 'Trouver minimum et maximum', expectedResult: 15 },
    { id: 'SI', nom: 'SI', description: 'Conditions simples', expectedResult: 'Admis' },
    { id: 'SAISIE', nom: 'Saisie de données', description: 'Entrer des données', validation: 'custom' },
    { id: 'COPIER_COLLER', nom: 'Copier-coller', description: 'Dupliquer des cellules', expectedResult: 30 },
  ],
  
  intermediaire: [
    { id: 'NB.SI', nom: 'NB.SI', description: 'Compter avec condition', expectedResult: 3 },
    { id: 'NB.SI.ENS', nom: 'NB.SI.ENS', description: 'Compter avec plusieurs conditions', expectedResult: 2 },
    { id: 'SOMME.SI', nom: 'SOMME.SI', description: 'Additionner avec condition', expectedResult: 7000 },
    { id: 'SOMME.SI.ENS', nom: 'SOMME.SI.ENS', description: 'Additionner avec plusieurs conditions', expectedResult: 5000 },
    { id: 'SI_IMBRIQUES', nom: 'SI imbriqués', description: 'Conditions multiples', expectedResult: 'TB' },
    { id: 'SIERREUR', nom: 'SIERREUR', description: 'Gérer les erreurs', expectedResult: 'Erreur' },
    { id: 'RECHERCHEV', nom: 'RECHERCHEV', description: 'Recherche verticale', expectedResult: 29 },
    { id: 'RECHERCHEV_APPROCHEE', nom: 'RECHERCHEV approchée', description: 'Pour barèmes et tranches', expectedResult: '7%' },
    { id: 'RECHERCHEH', nom: 'RECHERCHEH', description: 'Recherche horizontale', expectedResult: 1100 },
    { id: 'REFERENCES_ABSOLUES', nom: 'Références absolues ($)', description: 'Figer les références', expectedResult: 120 },
    { id: 'REFERENCES_MIXTES', nom: 'Références mixtes', description: '$A1 ou A$1', expectedResult: 10 },
    { id: 'CONCATENER', nom: 'CONCATENER / &', description: 'Assembler du texte', expectedResult: 'jean.dupont@email.com' },
    { id: 'TEXTE_EXTRACTION', nom: 'GAUCHE/DROITE/STXT', description: 'Extraire du texte', expectedResult: 'FR' },
    { id: 'DATES', nom: 'Fonctions date', description: 'AUJOURDHUI, DATEDIF, etc.' },
    { id: 'DATEDIF', nom: 'DATEDIF', description: 'Calculer des durées', expectedResult: 5 },
    { id: 'SOMMEPROD', nom: 'SOMMEPROD', description: 'Multiplier et additionner', expectedResult: 175 },
  ],
  
  avance: [
    { id: 'INDEX_EQUIV', nom: 'INDEX + EQUIV', description: 'Alternative puissante à RECHERCHEV', expectedResult: 4200 },
    { id: 'DECALER', nom: 'DECALER', description: 'Références dynamiques', expectedResult: 500 },
    { id: 'MATRICIELLES', nom: 'Formules matricielles', description: 'Calculs sur plages', expectedResult: 1282.5 },
    { id: 'XLOOKUP', nom: 'RECHERCHEX', description: 'RECHERCHEV moderne (Excel 365)', expectedResult: 29 },
  ],
};

// ═══════════════════════════════════════════════════════════════
// DÉMO UNIQUEMENT - ReadOnly (18)
// La sandbox montre le concept mais pas d'exercice interactif
// L'utilisateur doit télécharger un fichier Excel pour pratiquer
// ═══════════════════════════════════════════════════════════════

export const DEMO_READONLY = [
  // Ces compétences ont un template sandbox en mode DÉMO
  // Pour pratiquer, l'utilisateur télécharge un fichier Excel
  { id: 'SERIES', nom: 'Séries automatiques', competenceId: 52 },
  { id: 'COLLAGE_SPECIAL', nom: 'Collage spécial', competenceId: 58 },
  { id: 'FORMATAGE', nom: 'Formatage', competenceId: 2 },
  { id: 'TRI', nom: 'Tri de données', competenceId: 7 },
  { id: 'FILTRES', nom: 'Filtres', competenceId: 8 },
  { id: 'MFC', nom: 'Mise en forme conditionnelle', competenceId: 10 },
  { id: 'MFC_AVANCEE', nom: 'MFC avec formules', competenceId: 24 },
  { id: 'TCD', nom: 'Tableau Croisé Dynamique', competenceId: 17 },
  { id: 'GRAPHIQUES', nom: 'Graphiques', competenceId: 25 },
  { id: 'GRAPHIQUES_COMBINES', nom: 'Graphiques combinés', competenceId: 32 },
  { id: 'GRAPHIQUES_DYNAMIQUES', nom: 'Graphiques croisés dynamiques', competenceId: 33 },
  { id: 'VALIDATION', nom: 'Validation de données', competenceId: 22 },
  { id: 'TABLEAUX_STRUCTURES', nom: 'Tableaux structurés', competenceId: 27 },
  { id: 'POWER_QUERY', nom: 'Power Query', competenceId: 30 },
  { id: 'POWER_QUERY_ETL', nom: 'Power Query ETL', competenceId: 31 },
  { id: 'VBA_DEBUTANT', nom: 'VBA débutant', competenceId: 34 },
  { id: 'POWER_PIVOT', nom: 'Power Pivot', competenceId: 35 },
  { id: 'DAX_BASIQUE', nom: 'DAX basique', competenceId: 36 },
];

// ═══════════════════════════════════════════════════════════════
// EXCEL REQUIRED - Génération fichier OK, Correction partielle
// ═══════════════════════════════════════════════════════════════

export const EXCEL_REQUIRED = {
  // Ces compétences ont des exercices JSON avec données
  // Génération Excel : ✅ Fonctionne
  // Correction : ⚠️ Claude API (pas 100% déterministe)
  
  correction_ok: [
    // Formules dans fichier Excel → checkpoints type 'formule'/'valeur' fonctionnent
    { id: 'TRI', nom: 'Tri', correction: 'claude_api', fiabilite: '85%' },
    { id: 'FILTRES', nom: 'Filtres', correction: 'claude_api', fiabilite: '85%' },
    { id: 'VALIDATION', nom: 'Validation données', correction: 'claude_api', fiabilite: '80%' },
    { id: 'TABLEAUX_STRUCTURES', nom: 'Tableaux structurés', correction: 'claude_api', fiabilite: '80%' },
  ],
  
  correction_partielle: [
    // Checkpoints TCD non supportés, fallback Claude API
    { id: 'TCD', nom: 'TCD', correction: 'claude_api', fiabilite: '70%', note: 'checkpoints tcd_* non supportés' },
    { id: 'POWER_QUERY', nom: 'Power Query', correction: 'claude_api', fiabilite: '70%' },
  ],
  
  screenshot_requis: [
    // Nécessitent screenshot pour vraie validation (non implémenté frontend)
    { id: 'GRAPHIQUES', nom: 'Graphiques', correction: 'visual', note: 'screenshot non implémenté' },
    { id: 'MFC', nom: 'MFC', correction: 'visual', note: 'screenshot non implémenté' },
    { id: 'MFC_AVANCEE', nom: 'MFC avancée', correction: 'visual', note: 'screenshot non implémenté' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// NON DISPONIBLES - En développement
// ═══════════════════════════════════════════════════════════════

export const NON_DISPONIBLES = [
  'VBA_AVANCE', 'VBA_USERFORMS', 'VBA_API',
  'DAX_AVANCE',
  'POWER_BI',
  'LAMBDA', 'LET',
  'PYTHON_R', 'ARCHITECTURE', 'OPTIMISATION', 'RELATIONS_TABLES'
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Retourne TOUS les sandbox interactifs (formules avec validation auto)
 */
export function getSandboxInteractifs() {
  return [
    ...SANDBOX_INTERACTIFS.debutant,
    ...SANDBOX_INTERACTIFS.intermediaire,
    ...SANDBOX_INTERACTIFS.avance,
  ];
}

/**
 * Vérifie si une compétence a un sandbox interactif
 */
export function hasSandboxInteractif(competenceId) {
  const id = competenceId?.toUpperCase()?.replace(/\./g, '_');
  return getSandboxInteractifs().some(c => 
    c.id === id || c.id.replace('_', '.') === competenceId
  );
}

/**
 * Vérifie si une compétence est en mode démo uniquement
 */
export function isDemoOnly(competenceId) {
  const id = competenceId?.toUpperCase()?.replace(/\./g, '_');
  return DEMO_READONLY.some(c => c.id === id);
}

/**
 * Vérifie si une compétence est non disponible
 */
export function isNonDisponible(competenceId) {
  const id = competenceId?.toUpperCase()?.replace(/\./g, '_');
  return NON_DISPONIBLES.includes(id);
}

export default {
  SANDBOX_INTERACTIFS,
  DEMO_READONLY,
  EXCEL_REQUIRED,
  NON_DISPONIBLES,
  getSandboxInteractifs,
  hasSandboxInteractif,
  isDemoOnly,
  isNonDisponible
};
