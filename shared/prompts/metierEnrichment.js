// Vocabulaire métier à AJOUTER aux prompts existants
const VOCABULAIRE_METIER = {
    finance: `
  VOCABULAIRE FINANCE À UTILISER :
  - Revenus → "CA", "Top Line", "Chiffre d'affaires"
  - Profit → "EBITDA", "Marge opérationnelle", "Free Cash Flow"
  - Analyse → "Variance", "Bridge", "Waterfall", "Sensibilité"
  - Valorisation → "DCF", "Multiples", "WACC", "Terminal Value"
  - Dette → "Covenant", "Leverage", "Net Debt/EBITDA"
  
  EXEMPLES MÉTIER :
  - "Tu es analyste chez Rothschild et tu valorises une cible SaaS"
  - "Construis un modèle 3-statements pour une acquisition"
  - "Calcule le WACC pour un DCF"`,
  
    vente: `
  VOCABULAIRE VENTES/MARKETING À UTILISER :
  - Acquisition → "CAC", "CPA", "CPL", "CTR"
  - Rétention → "Churn rate", "LTV", "Cohorte"
  - Conversion → "Funnel", "Conversion rate", "Attribution"
  - Performance → "ROAS", "ROI marketing", "Payback period"
  
  EXEMPLES MÉTIER :
  - "Tu es Growth Manager chez Blablacar"
  - "Analyse tes cohortes de rétention mois par mois"
  - "Calcule le CAC par canal d'acquisition"`,
  
    marketing: `
  VOCABULAIRE MARKETING À UTILISER :
  - Acquisition → "CAC", "CPA", "CPL", "CTR"
  - Rétention → "Churn rate", "LTV", "Cohorte"
  - Conversion → "Funnel", "Conversion rate", "Attribution"
  - Performance → "ROAS", "ROI marketing", "Payback period"
  
  EXEMPLES MÉTIER :
  - "Tu es Growth Manager chez Blablacar"
  - "Analyse tes cohortes de rétention mois par mois"
  - "Calcule le CAC par canal d'acquisition"`,
  
    comptabilité: `
  VOCABULAIRE COMPTA À UTILISER :
  - Grand livre, Balance, Lettrage, TVA déductible
  - Rapprochement bancaire, Écritures comptables
  - Compte de résultat, Bilan, Liasse fiscale
  
  EXEMPLES MÉTIER :
  - "Tu es comptable et tu prépares la clôture mensuelle"
  - "Fais le lettrage des comptes clients"
  - "Calcule la TVA à déclarer"`,
    
    rh: `
  VOCABULAIRE RH À UTILISER :
  - Masse salariale, Turnover, Ancienneté
  - Charges patronales, Coût total employeur
  - Pyramide des âges, Taux d'absentéisme
  
  EXEMPLES MÉTIER :
  - "Tu es RRH et tu analyses la masse salariale"
  - "Calcule le turnover par département"
  - "Projette les coûts de recrutement"`
  };
  
  export function enrichWithMetier(basePrompt, metier) {
    if (!metier) return basePrompt;
    
    const metierNormalized = metier.toLowerCase().trim();
    const enrichment = VOCABULAIRE_METIER[metierNormalized] || '';
    
    if (!enrichment) return basePrompt;
    
    return `${basePrompt}\n\n${enrichment}`;
  }
  
  export default { enrichWithMetier };
  