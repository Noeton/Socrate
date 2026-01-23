/**
 * MAPPING BILINGUE FONCTIONS EXCEL
 * FR ↔ EN pour compatibilité ExcelJS (stocke en anglais)
 */

const FR_TO_EN = {
    // Mathématiques & Statistiques
    'SOMME': 'SUM',
    'MOYENNE': 'AVERAGE',
    'MIN': 'MIN',
    'MAX': 'MAX',
    'NB': 'COUNT',
    'NBVAL': 'COUNTA',
    'NB.VIDE': 'COUNTBLANK',
    'ARRONDI': 'ROUND',
    'ARRONDI.SUP': 'ROUNDUP',
    'ARRONDI.INF': 'ROUNDDOWN',
    'ENT': 'INT',
    'ABS': 'ABS',
    'ALEA': 'RAND',
    'ALEA.ENTRE.BORNES': 'RANDBETWEEN',
    'MOD': 'MOD',
    'PUISSANCE': 'POWER',
    'RACINE': 'SQRT',
    'MEDIANE': 'MEDIAN',
    'ECARTYPE': 'STDEV',
    'VAR': 'VAR',
  
    // Logique
    'SI': 'IF',
    'ET': 'AND',
    'OU': 'OR',
    'NON': 'NOT',
    'SIERREUR': 'IFERROR',
    'SI.CONDITIONS': 'IFS',
    'SI.NON.DISP': 'IFNA',
    'VRAI': 'TRUE',
    'FAUX': 'FALSE',
  
    // Recherche & Référence
    'RECHERCHEV': 'VLOOKUP',
    'RECHERCHEH': 'HLOOKUP',
    'RECHERCHEX': 'XLOOKUP',
    'INDEX': 'INDEX',
    'EQUIV': 'MATCH',
    'CHOISIR': 'CHOOSE',
    'INDIRECT': 'INDIRECT',
    'DECALER': 'OFFSET',
    'LIGNE': 'ROW',
    'COLONNE': 'COLUMN',
    'LIGNES': 'ROWS',
    'COLONNES': 'COLUMNS',
  
    // Conditionnelles
    'NB.SI': 'COUNTIF',
    'NB.SI.ENS': 'COUNTIFS',
    'SOMME.SI': 'SUMIF',
    'SOMME.SI.ENS': 'SUMIFS',
    'MOYENNE.SI': 'AVERAGEIF',
    'MOYENNE.SI.ENS': 'AVERAGEIFS',
    'MAX.SI.ENS': 'MAXIFS',
    'MIN.SI.ENS': 'MINIFS',
  
    // Texte
    'CONCATENER': 'CONCATENATE',
    'CONCAT': 'CONCAT',
    'TEXTE': 'TEXT',
    'GAUCHE': 'LEFT',
    'DROITE': 'RIGHT',
    'STXT': 'MID',
    'NBCAR': 'LEN',
    'MAJUSCULE': 'UPPER',
    'MINUSCULE': 'LOWER',
    'NOMPROPRE': 'PROPER',
    'SUPPRESPACE': 'TRIM',
    'CHERCHE': 'SEARCH',
    'TROUVE': 'FIND',
    'SUBSTITUE': 'SUBSTITUTE',
    'REMPLACER': 'REPLACE',
    'CNUM': 'VALUE',
    'CTXT': 'TEXT',
  
    // Date & Heure
    'AUJOURDHUI': 'TODAY',
    'MAINTENANT': 'NOW',
    'ANNEE': 'YEAR',
    'MOIS': 'MONTH',
    'JOUR': 'DAY',
    'HEURE': 'HOUR',
    'MINUTE': 'MINUTE',
    'SECONDE': 'SECOND',
    'DATE': 'DATE',
    'DATEDIF': 'DATEDIF',
    'JOURSEM': 'WEEKDAY',
    'NO.SEMAINE': 'WEEKNUM',
    'FIN.MOIS': 'EOMONTH',
    'NB.JOURS.OUVRES': 'NETWORKDAYS',
  
    // Information
    'ESTVIDE': 'ISBLANK',
    'ESTNUM': 'ISNUMBER',
    'ESTTEXTE': 'ISTEXT',
    'ESTERREUR': 'ISERROR',
    'ESTNA': 'ISNA',
    'TYPE': 'TYPE'
  };
  
  // Génération automatique du mapping inverse EN → FR
  const EN_TO_FR = Object.fromEntries(
    Object.entries(FR_TO_EN).map(([fr, en]) => [en, fr])
  );
  
  /**
   * Traduit un nom de fonction FR → EN
   * @param {string} fnName - Nom de fonction (ex: "SOMME")
   * @returns {string} Nom anglais (ex: "SUM") ou original si non trouvé
   */
  function toEnglish(fnName) {
    if (!fnName) return fnName;
    const upper = fnName.toUpperCase();
    return FR_TO_EN[upper] || upper;
  }
  
  /**
   * Traduit un nom de fonction EN → FR
   * @param {string} fnName - Nom de fonction (ex: "SUM")
   * @returns {string} Nom français (ex: "SOMME") ou original si non trouvé
   */
  function toFrench(fnName) {
    if (!fnName) return fnName;
    const upper = fnName.toUpperCase();
    return EN_TO_FR[upper] || upper;
  }
  
  export { FR_TO_EN, EN_TO_FR, toEnglish, toFrench };