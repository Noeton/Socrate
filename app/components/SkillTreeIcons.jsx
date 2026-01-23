/**
 * Icônes SVG pour le Skill Tree
 * Chaque compétence a une icône minimaliste
 */

// Icône par défaut
const DefaultIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
  
  // Bases
  const SaisieIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
  
  const FormatageIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
    </svg>
  );
  
  const CopierCollerIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
  
  const TriIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M3 6h18M3 12h12M3 18h6" />
    </svg>
  );
  
  const FiltresIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" fill="none" />
    </svg>
  );
  
  // Formules de base
  const SommeIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
  
  const MoyenneIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 20L20 4" />
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
  
  const MinMaxIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M7 17l5-5 5 5M7 7l5 5 5-5" />
    </svg>
  );
  
  // Logique
  const SiIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
  
  const SiImbriquesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
  
  // Comptage & Somme conditionnelle
  const NbSiIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M5 3v18M3 5h4M3 9h4M3 13h4M3 17h4M3 21h4" />
      <path d="M12 8h7M12 12h7M12 16h5" />
    </svg>
  );
  
  const NbSiEnsIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 4h4v4H4zM4 10h4v4H4zM10 4h4v4h-4zM10 10h4v4h-4z" />
      <path d="M16 8h4M16 12h4" />
    </svg>
  );
  
  const SommeSiIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
      <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
    </svg>
  );
  
  const SommeSiEnsIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
    </svg>
  );
  
  // Références
  const ReferencesAbsoluesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9z" />
      <path d="M4 9h5M15 9h5M9 4v5M9 15v5" />
    </svg>
  );
  
  const ReferencesMixtesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 12h16M12 4v16" strokeDasharray="4 2" />
    </svg>
  );
  
  // MFC
  const MfcIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 14l3 3 7-7" />
    </svg>
  );
  
  const MfcAvanceeIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
  
  // Recherche
  const RechercheVIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 8v6" />
    </svg>
  );
  
  const RechercheHIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8 11h6" />
    </svg>
  );
  
  const IndexEquivIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  );
  
  const XlookupIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8 11h6M11 8v6" />
    </svg>
  );
  
  // Texte
  const ConcatenerIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 7h6M14 7h6M4 12h16M4 17h10" />
    </svg>
  );
  
  const TexteExtractionIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h4M7 13h6" />
      <path d="M15 9v6" strokeDasharray="2 2" />
    </svg>
  );
  
  // Dates
  const DatesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  );
  
  const SeriesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 6h4M10 6h4M16 6h4" />
      <path d="M5 10l2 2-2 2M11 10l2 2-2 2M17 10l2 2-2 2" />
    </svg>
  );
  
  // Validation
  const ValidationIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
  
  // TCD & Analyse
  const TcdIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
      <path d="M14 14h4M14 17h2" />
    </svg>
  );
  
  const TableauxStructuresIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  );
  
  // Graphiques
  const GraphiquesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
  
  const GraphiquesCombinesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6" />
      <path d="M3 14l4-4 4 2 6-6 4 2" />
    </svg>
  );
  
  const GraphiquesDynamiquesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6" />
      <circle cx="18" cy="7" r="3" />
    </svg>
  );
  
  // Avancé
  const SommeprodIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
  
  const DecalerIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="4" y="4" width="8" height="8" rx="1" />
      <rect x="12" y="12" width="8" height="8" rx="1" strokeDasharray="3 2" />
      <path d="M10 10l4 4" />
    </svg>
  );
  
  const MatriciellesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
  
  const LetIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 7h6l2 10 2-10h6" />
    </svg>
  );
  
  const LambdaIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M6 4l6 16M18 4l-8 12" />
    </svg>
  );
  
  const FilterSortUniqueIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M3 6h18M7 12h10M10 18h4" />
    </svg>
  );
  
  // Power Tools
  const PowerQueryIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
  
  const PowerQueryEtlIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 4h16v4H4zM4 16h16v4H4z" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
  
  const PowerQueryMIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <path d="M12 9v6" />
    </svg>
  );
  
  const PowerPivotIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9l6 3" />
    </svg>
  );
  
  const DaxBasiqueIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 12h10M12 7v10" />
    </svg>
  );
  
  const DaxAvanceIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 12h10M12 7v10" />
      <circle cx="17" cy="7" r="2" />
    </svg>
  );
  
  const RelationsTablesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="2" y="6" width="6" height="6" rx="1" />
      <rect x="16" y="6" width="6" height="6" rx="1" />
      <rect x="9" y="14" width="6" height="6" rx="1" />
      <path d="M8 9h8M12 12v2" />
    </svg>
  );
  
  // VBA
  const VbaDebutantIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
  
  const VbaAvanceIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <polyline points="4 17 10 11 4 5" />
      <polyline points="12 17 18 11 12 5" />
    </svg>
  );
  
  const VbaUserformsIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="6" y="6" width="5" height="3" rx="0.5" />
      <rect x="6" y="11" width="12" height="2" rx="0.5" />
      <rect x="6" y="15" width="8" height="3" rx="0.5" />
    </svg>
  );
  
  const VbaApiIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 12h4l3-9 3 18 3-9h4" />
    </svg>
  );
  
  // Expert
  const OptimisationIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
  
  const PowerBiIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="10" width="4" height="10" rx="1" />
      <rect x="10" y="6" width="4" height="14" rx="1" />
      <rect x="17" y="2" width="4" height="18" rx="1" />
    </svg>
  );
  
  const PythonRIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 2C6.5 2 6 4.5 6 6v2h6v1H5c-2 0-3 1.5-3 4s1 4 3 4h2v-2c0-1.5 1-3 3-3h6c1.5 0 3-1 3-3V6c0-2-1.5-4-7-4z" />
      <circle cx="9" cy="5" r="1" />
    </svg>
  );
  
  const ArchitectureIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
  
  // Fonctions BD
  const FonctionsBdIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
  
  const RefStructureesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
      <path d="M12 13h6M12 17h4" />
    </svg>
  );
  
  const FiltresAvancesIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" fill="none" />
      <path d="M16 8l2 2-2 2" />
    </svg>
  );
  
  const CollageSpecialIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      <path d="M13 15h4M15 13v4" />
    </svg>
  );
  
  const RechercheVApprocheeIcon = () => (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8 11h6" strokeDasharray="2 2" />
    </svg>
  );
  
  // Mapping clé → composant icône
  export const SKILL_ICONS = {
    // Bases
    SAISIE: SaisieIcon,
    FORMATAGE: FormatageIcon,
    COPIER_COLLER: CopierCollerIcon,
    TRI: TriIcon,
    FILTRES: FiltresIcon,
    SERIES: SeriesIcon,
    COLLAGE_SPECIAL: CollageSpecialIcon,
    
    // Formules de base
    SOMME: SommeIcon,
    MOYENNE: MoyenneIcon,
    MIN_MAX: MinMaxIcon,
    
    // Logique
    SI: SiIcon,
    SI_IMBRIQUES: SiImbriquesIcon,
    
    // Comptage conditionnel
    NB_SI: NbSiIcon,
    NB_SI_ENS: NbSiEnsIcon,
    SOMME_SI: SommeSiIcon,
    SOMME_SI_ENS: SommeSiEnsIcon,
    
    // Références
    REFERENCES_ABSOLUES: ReferencesAbsoluesIcon,
    REFERENCES_MIXTES: ReferencesMixtesIcon,
    
    // MFC
    MFC: MfcIcon,
    MFC_AVANCEE: MfcAvanceeIcon,
    
    // Recherche
    RECHERCHEV: RechercheVIcon,
    RECHERCHEH: RechercheHIcon,
    RECHERCHEV_APPROCHEE: RechercheVApprocheeIcon,
    INDEX_EQUIV: IndexEquivIcon,
    XLOOKUP: XlookupIcon,
    
    // Texte
    CONCATENER: ConcatenerIcon,
    TEXTE_EXTRACTION: TexteExtractionIcon,
    
    // Dates
    DATES: DatesIcon,
    
    // Validation
    VALIDATION: ValidationIcon,
    
    // TCD & Analyse
    TCD: TcdIcon,
    TABLEAUX_STRUCTURES: TableauxStructuresIcon,
    REF_STRUCTUREES: RefStructureesIcon,
    FILTRES_AVANCES: FiltresAvancesIcon,
    FONCTIONS_BD: FonctionsBdIcon,
    
    // Graphiques
    GRAPHIQUES: GraphiquesIcon,
    GRAPHIQUES_COMBINES: GraphiquesCombinesIcon,
    GRAPHIQUES_DYNAMIQUES: GraphiquesDynamiquesIcon,
    
    // Avancé
    SOMMEPROD: SommeprodIcon,
    DECALER: DecalerIcon,
    MATRICIELLES: MatriciellesIcon,
    LET: LetIcon,
    LAMBDA: LambdaIcon,
    FILTER_SORT_UNIQUE: FilterSortUniqueIcon,
    
    // Power Tools
    POWER_QUERY: PowerQueryIcon,
    POWER_QUERY_ETL: PowerQueryEtlIcon,
    POWER_QUERY_M: PowerQueryMIcon,
    POWER_PIVOT: PowerPivotIcon,
    DAX_BASIQUE: DaxBasiqueIcon,
    DAX_AVANCE: DaxAvanceIcon,
    RELATIONS_TABLES: RelationsTablesIcon,
    
    // VBA
    VBA_DEBUTANT: VbaDebutantIcon,
    VBA_AVANCE: VbaAvanceIcon,
    VBA_USERFORMS: VbaUserformsIcon,
    VBA_API: VbaApiIcon,
    
    // Expert
    OPTIMISATION: OptimisationIcon,
    POWER_BI: PowerBiIcon,
    PYTHON_R: PythonRIcon,
    ARCHITECTURE: ArchitectureIcon,
  };
  
  export function getSkillIcon(key) {
    const IconComponent = SKILL_ICONS[key] || DefaultIcon;
    return <IconComponent />;
  }
  
  export default SKILL_ICONS;