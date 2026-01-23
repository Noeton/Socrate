'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PEDAGOGIE, getCategories } from '@/shared/data/pedagogie';
import { 
  getCompetenceCoverage, 
  competenceNeedsScreenshot 
} from '@/shared/data/competenceIndex';

export default function CataloguePage() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = ['all', ...getCategories()];
  
  // Construire la liste des compétences depuis PEDAGOGIE
  const allSkills = Object.entries(PEDAGOGIE)
    .filter(([key, value]) => value && value.nom)
    .map(([key, value]) => {
      // Récupérer la couverture depuis l'index
      const coverage = value.id ? getCompetenceCoverage(value.id) : 'none';
      return {
        key,
        ...value,
        coverage
      };
    });
  
  // Séparer disponibles (coverage full) et en développement (partial/none ou inDevelopment)
  const availableSkills = allSkills.filter(s => 
    !s.inDevelopment && s.id && s.coverage === 'full'
  );
  const devSkills = allSkills.filter(s => 
    s.inDevelopment || !s.id || s.coverage !== 'full'
  );
  
  const filterSkills = (skills) => skills.filter(skill => {
    const matchesLevel = filter === 'all' || skill.niveau === filter;
    const matchesCategory = categoryFilter === 'all' || skill.categorie === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      skill.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesCategory && matchesSearch;
  });
  
  const filteredAvailable = filterSkills(availableSkills);
  const filteredDev = filterSkills(devSkills);
  
  const handleStartSkill = (skill) => {
    localStorage.setItem('socrate-selected-skill', JSON.stringify(skill));
    router.push(`/catalogue/${skill.key}`);
  };
  
  const niveauColors = {
    debutant: { bg: 'bg-[var(--accent-base)]/10', text: 'text-[var(--accent-dark)]', border: 'border-[var(--accent-base)]/30' },
    intermediaire: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    avance: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    expert: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
  };
  
  const niveauLabels = {
    debutant: '🌱 Débutant',
    intermediaire: '⚡ Intermédiaire',
    avance: '🚀 Avancé',
    expert: '👑 Expert'
  };

  const SkillCard = ({ skill, onClick, disabled, inDevSection = false }) => {
    const colors = niveauColors[skill.niveau] || niveauColors.debutant;
    
    // Utiliser la couverture pré-calculée ou la récupérer
    const coverage = skill.coverage || (skill.id ? getCompetenceCoverage(skill.id) : 'none');
    const needsScreenshot = skill.id ? competenceNeedsScreenshot(skill.id) : false;
    
    // Partial est cliquable (a 1 exercice), none est disabled
    const isDisabled = disabled || coverage === 'none';
    
    const coverageIndicator = {
      'full': { icon: '✅', label: 'Prêt', className: 'text-[var(--accent-base)]', badge: null },
      'partial': { icon: '📝', label: '1 exercice', className: 'text-yellow-600', badge: '1 exercice' },
      'none': { icon: '🚧', label: 'Bientôt', className: 'text-slate-400', badge: 'Bientôt' }
    };
    
    const coverageInfo = coverageIndicator[coverage] || coverageIndicator.none;
    
    return (
      <div
        className={`bg-white rounded-xl border ${colors.border} p-5 transition-all ${
          isDisabled ? 'opacity-50 cursor-default bg-slate-50' : 'hover:shadow-lg cursor-pointer group'
        }`}
        onClick={() => !isDisabled && onClick(skill)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`font-bold text-slate-900 ${!isDisabled && 'group-hover:text-[var(--accent-base)]'} transition-colors`}>
              {skill.nom}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`${colors.bg} ${colors.text} text-xs px-2 py-1 rounded-full font-medium`}>
              {skill.niveau}
            </span>
            {/* Badge de statut pour les compétences en dev */}
            {inDevSection && coverageInfo.badge && (
              <span className={`text-xs ${coverageInfo.className} bg-slate-100 px-2 py-0.5 rounded`}>
                {coverageInfo.badge}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{skill.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{skill.categorie}</span>
            {/* Badge screenshot si nécessaire */}
            {needsScreenshot && (
              <span className="text-xs bg-[var(--accent-base)]/10 text-[var(--accent-base)] px-1.5 py-0.5 rounded" title="Capture d'écran requise">
                📷
              </span>
            )}
          </div>
          {!isDisabled && (
            <div className="flex items-center gap-1 text-[var(--accent-base)] text-sm font-medium group-hover:translate-x-1 transition-transform">
              {coverage === 'partial' ? 'Essayer' : 'Commencer'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
          {isDisabled && coverage === 'none' && (
            <span className="text-xs text-slate-400">En développement</span>
          )}
        </div>
      </div>
    );
  };

  const SectionHeader = ({ icon, title, count, subtitle, collapsible, isOpen, onToggle }) => (
    <div 
      className={`flex items-center gap-2 mb-4 ${collapsible ? 'cursor-pointer' : ''}`}
      onClick={collapsible ? onToggle : undefined}
    >
      <span className="text-2xl">{icon}</span>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <span className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-full">
        {count}
      </span>
      {subtitle && <span className="text-slate-500 text-xs ml-2">{subtitle}</span>}
      {collapsible && (
        <svg 
          className={`w-5 h-5 ml-auto text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </div>
  );

  const [showInDev, setShowInDev] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/?menu=true')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span className="text-xl font-semibold text-[var(--slate-900)]" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Socrate</span>
              </button>
              
              <span className="text-slate-300">|</span>
              
              <div>
                <h1 className="text-lg font-bold text-slate-900">Catalogue</h1>
                <p className="text-xs text-slate-500">
                  <span className="text-[var(--accent-base)] font-medium">{availableSkills.length} opérationnelles</span>
                  <span className="mx-1">•</span>
                  <span className="text-yellow-600" title="En développement avec 1 exercice">📝 {devSkills.filter(s => s.coverage === 'partial').length}</span>
                  <span className="mx-1">•</span>
                  <span className="text-slate-400" title="À venir">🚧 {devSkills.filter(s => s.coverage === 'none' || !s.coverage).length}</span>
                </p>
              </div>
            </div>
            
            {/* Liens navigation */}
            <div className="flex items-center gap-2">
              <a 
                href="/learn" 
                className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                📚 Apprendre
              </a>
              <a 
                href="/ask" 
                className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                💬 Demander
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Filtres */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Recherche */}
          <div className="mb-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher (SOMME, SI, RECHERCHEV...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Filtres niveau */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-sm text-slate-600 self-center mr-2">Niveau :</span>
            {['all', 'debutant', 'intermediaire', 'avance', 'expert'].map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === level ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {level === 'all' ? '📚 Tous' : niveauLabels[level]}
              </button>
            ))}
          </div>
          
          {/* Filtres catégorie */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-slate-600 self-center mr-2">Catégorie :</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Toutes' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Compétences disponibles */}
        <section className="mb-10">
          <SectionHeader 
            icon="📊" 
            title="Compétences Excel" 
            count={filteredAvailable.length}
            subtitle="Apprendre → Pratiquer → Maîtriser"
          />
          <p className="text-sm text-slate-500 mb-4">
            Chaque compétence propose une explication détaillée puis un exercice Excel à compléter
          </p>
          
          {filteredAvailable.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailable.map(skill => (
                <SkillCard 
                  key={skill.key} 
                  skill={skill} 
                  onClick={handleStartSkill}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-100 rounded-xl">
              <p className="text-slate-500">Aucun résultat pour ces filtres</p>
            </div>
          )}
        </section>

        {/* En développement */}
        {filteredDev.length > 0 && (
          <section className="border-t border-slate-200 pt-8">
            <SectionHeader 
              icon="🚧" 
              title="En développement" 
              count={filteredDev.length}
              subtitle={`${filteredDev.filter(s => s.coverage === 'partial').length} avec exercice • ${filteredDev.filter(s => s.coverage === 'none').length} à venir`}
              collapsible
              isOpen={showInDev}
              onToggle={() => setShowInDev(!showInDev)}
            />
            
            {showInDev && (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  Compétences en cours de développement. Celles marquées "1 exercice" sont déjà utilisables.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDev.map(skill => (
                    <SkillCard 
                      key={skill.key} 
                      skill={skill} 
                      onClick={handleStartSkill}
                      inDevSection={true}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}