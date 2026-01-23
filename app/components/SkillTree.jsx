'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PEDAGOGIE, getSkillTreeData, ID_TO_KEY } from '@/shared/data/pedagogie';
import { getSkillIcon } from './SkillTreeIcons';

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const LEVEL_LABELS = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert'
};

const LEVEL_ORDER = ['debutant', 'intermediaire', 'avance', 'expert'];

// Couleurs pastel par catégorie
const CATEGORY_COLORS = {
  'Bases': { bg: '#e0f2fe', icon: '#0284c7', border: '#7dd3fc' },           // Bleu ciel
  'Mathématiques': { bg: '#fce7f3', icon: '#db2777', border: '#f9a8d4' },   // Rose
  'Statistiques': { bg: '#fae8ff', icon: '#a855f7', border: '#e879f9' },    // Violet
  'Logique': { bg: '#dcfce7', icon: '#16a34a', border: '#86efac' },         // Vert
  'Analyse': { bg: '#fff7ed', icon: '#ea580c', border: '#fdba74' },         // Orange
  'Visualisation': { bg: '#fef3c7', icon: '#d97706', border: '#fcd34d' },   // Ambre
  'Texte': { bg: '#f0fdf4', icon: '#15803d', border: '#86efac' },           // Vert menthe
  'Recherche': { bg: '#ede9fe', icon: '#7c3aed', border: '#c4b5fd' },       // Indigo
  'Formules': { bg: '#e0e7ff', icon: '#4f46e5', border: '#a5b4fc' },        // Bleu indigo
  'Dates': { bg: '#ffedd5', icon: '#c2410c', border: '#fed7aa' },           // Orange pêche
  'Manipulation': { bg: '#e0f2fe', icon: '#0369a1', border: '#7dd3fc' },    // Bleu
  'Formatage': { bg: '#fdf4ff', icon: '#c026d3', border: '#f0abfc' },       // Fuchsia
  'ETL': { bg: '#ecfeff', icon: '#0891b2', border: '#67e8f9' },             // Cyan
  'BI': { bg: '#f0fdfa', icon: '#0d9488', border: '#5eead4' },              // Teal
  'Programmation': { bg: '#f5f5f4', icon: '#57534e', border: '#d6d3d1' },   // Stone
  'Avancé': { bg: '#fef2f2', icon: '#dc2626', border: '#fca5a5' },          // Rouge
  'default': { bg: '#f8fafc', icon: '#64748b', border: '#e2e8f0' }          // Slate
};

function getCategoryColor(categorie) {
  return CATEGORY_COLORS[categorie] || CATEGORY_COLORS['default'];
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function SkillTree({ 
  userProfile = {}, 
  onStartExercise,
  showBackButton = true 
}) {
  const router = useRouter();
  const containerRef = useRef(null);
  const nodeRefs = useRef({});
  
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [connections, setConnections] = useState([]);
  const [containerRect, setContainerRect] = useState(null);

  // Charger les données des compétences
  const skills = useMemo(() => getSkillTreeData(), []);

  // Grouper par niveau
  const skillsByLevel = useMemo(() => {
    const grouped = {
      debutant: [],
      intermediaire: [],
      avance: [],
      expert: []
    };
    skills.forEach(skill => {
      if (grouped[skill.niveau]) {
        grouped[skill.niveau].push(skill);
      }
    });
    return grouped;
  }, [skills]);

  // ─────────────────────────────────────────────────────────────
  // LOGIQUE DE STATUT
  // ─────────────────────────────────────────────────────────────

  const getSkillStatus = useCallback((skill) => {
    const competences = userProfile?.competences || {};
    const userComp = competences[skill.key] || competences[skill.nom];
    
    // Si l'utilisateur a une progression
    if (userComp) {
      const score = userComp.score || 0;
      if (score >= 0.85) return 'done';
      if (score > 0) return 'progress';
    }
    
    // Vérifier les prérequis
    if (!skill.prerequis || skill.prerequis.length === 0) {
      return 'available';
    }
    
    const prereqsMet = skill.prerequis.every(prereqKey => {
      const prereqComp = competences[prereqKey] || competences[PEDAGOGIE[prereqKey]?.nom];
      return prereqComp && prereqComp.score >= 0.5;
    });
    
    return prereqsMet ? 'available' : 'locked';
  }, [userProfile]);

  const getSkillProgress = useCallback((skill) => {
    const competences = userProfile?.competences || {};
    const userComp = competences[skill.key] || competences[skill.nom];
    return userComp ? Math.round((userComp.score || 0) * 100) : 0;
  }, [userProfile]);

  // ─────────────────────────────────────────────────────────────
  // CONNEXIONS SVG
  // ─────────────────────────────────────────────────────────────

  const updateContainerRect = useCallback(() => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    updateContainerRect();
    window.addEventListener('resize', updateContainerRect);
    window.addEventListener('scroll', updateContainerRect);
    return () => {
      window.removeEventListener('resize', updateContainerRect);
      window.removeEventListener('scroll', updateContainerRect);
    };
  }, [updateContainerRect]);

  const calculateConnections = useCallback((skill) => {
    if (!containerRef.current || !skill || !containerRect) return [];
    
    const newConnections = [];
    
    const getNodeCenter = (key) => {
      const node = nodeRefs.current[key];
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
      };
    };
    
    const skillCenter = getNodeCenter(skill.key);
    if (!skillCenter) return [];
    
    // Connexions vers les prérequis (lignes pointillées)
    skill.prerequis.forEach(prereqKey => {
      const prereqCenter = getNodeCenter(prereqKey);
      if (prereqCenter) {
        newConnections.push({
          from: prereqCenter,
          to: skillCenter,
          type: 'prereq',
          fromKey: prereqKey,
          toKey: skill.key
        });
      }
    });
    
    // Connexions vers ce que ça débloque (lignes pleines)
    const status = getSkillStatus(skill);
    if (status !== 'locked') {
      skill.unlocks.forEach(unlockKey => {
        const unlockCenter = getNodeCenter(unlockKey);
        if (unlockCenter) {
          newConnections.push({
            from: skillCenter,
            to: unlockCenter,
            type: 'unlocks',
            fromKey: skill.key,
            toKey: unlockKey
          });
        }
      });
    }
    
    return newConnections;
  }, [containerRect, getSkillStatus]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleMouseEnter = useCallback((skill) => {
    setHoveredSkill(skill);
    // Petit délai pour laisser le DOM se mettre à jour
    requestAnimationFrame(() => {
      const conns = calculateConnections(skill);
      setConnections(conns);
    });
  }, [calculateConnections]);

  const handleMouseLeave = useCallback(() => {
    setHoveredSkill(null);
    setConnections([]);
  }, []);

  const handleClick = useCallback((skill) => {
    setSelectedSkill(skill);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedSkill(null);
  }, []);

  const handlePractice = useCallback((skill) => {
    closeModal();
    if (onStartExercise) {
      onStartExercise(skill);
    } else {
      router.push(`/catalogue/${skill.key.toLowerCase()}`);
    }
  }, [router, onStartExercise, closeModal]);

  // ─────────────────────────────────────────────────────────────
  // HELPERS DE RENDU
  // ─────────────────────────────────────────────────────────────

  const getConnectedKeys = useCallback(() => {
    if (!hoveredSkill) return new Set();
    const keys = new Set([hoveredSkill.key]);
    hoveredSkill.prerequis.forEach(k => keys.add(k));
    if (getSkillStatus(hoveredSkill) !== 'locked') {
      hoveredSkill.unlocks.forEach(k => keys.add(k));
    }
    return keys;
  }, [hoveredSkill, getSkillStatus]);

  const connectedKeys = getConnectedKeys();

  const generatePath = (from, to) => {
    const dy = to.y - from.y;
    const dx = to.x - from.x;
    
    // Courbe de Bézier verticale
    if (Math.abs(dy) > Math.abs(dx)) {
      const midY = from.y + dy * 0.5;
      return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
    }
    // Courbe de Bézier horizontale
    const midX = from.x + dx * 0.5;
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  };

  // Stats
  const masteredCount = skills.filter(s => getSkillStatus(s) === 'done').length;
  const totalCount = skills.filter(s => !s.inDevelopment).length;

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="skill-tree-wrapper">
      {/* Header */}
      <div className="skill-tree-header">
        {showBackButton && (
          <a href="/" className="back-link">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4L4 8l8 4" />
            </svg>
            Retour
          </a>
        )}
        
        <div className="header-center">
          <h1 className="header-title">Arbre de Compétences</h1>
          <p className="header-subtitle">{masteredCount} / {totalCount} maîtrisées</p>
        </div>

        <div className="legend">
          <span className="legend-item">
            <span className="legend-dot locked"></span>
            Verrouillée
          </span>
          <span className="legend-item">
            <span className="legend-dot available"></span>
            Disponible
          </span>
          <span className="legend-item">
            <span className="legend-dot progress"></span>
            En cours
          </span>
          <span className="legend-item">
            <span className="legend-dot done"></span>
            Maîtrisée
          </span>
        </div>
      </div>

      {/* Arbre */}
      <div className="skill-tree" ref={containerRef}>
        {/* Connexions SVG */}
        <svg className="connections-svg">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="4"
              refX="5"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 6 2, 0 4" fill="var(--accent-base)" />
            </marker>
          </defs>
          {connections.map((conn, i) => (
            <path
              key={`${conn.fromKey}-${conn.toKey}-${i}`}
              d={generatePath(conn.from, conn.to)}
              className={`stem ${conn.type}`}
            />
          ))}
        </svg>

        {/* Niveaux */}
        {LEVEL_ORDER.map(level => {
          const levelSkills = skillsByLevel[level];
          if (!levelSkills || levelSkills.length === 0) return null;

          return (
            <div key={level} className="level">
              <div className="level-header">
                <span className="level-label">{LEVEL_LABELS[level]}</span>
                <span className="level-count">
                  {levelSkills.filter(s => getSkillStatus(s) === 'done').length}/{levelSkills.length}
                </span>
              </div>
              
              <div className="level-nodes">
                {levelSkills.map(skill => {
                  const status = getSkillStatus(skill);
                  const progress = getSkillProgress(skill);
                  const isHovered = hoveredSkill?.key === skill.key;
                  const isConnected = connectedKeys.has(skill.key);
                  const isDimmed = hoveredSkill && !isConnected;
                  const catColor = getCategoryColor(skill.categorie);

                  return (
                    <div
                      key={skill.key}
                      ref={el => nodeRefs.current[skill.key] = el}
                      className={`node ${status} ${isHovered ? 'hovered' : ''} ${isConnected && !isHovered ? 'highlight' : ''} ${isDimmed ? 'dim' : ''} ${skill.inDevelopment ? 'in-dev' : ''}`}
                      onMouseEnter={() => handleMouseEnter(skill)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick(skill)}
                      data-key={skill.key}
                      data-category={skill.categorie}
                      style={{
                        '--cat-bg': catColor.bg,
                        '--cat-icon': catColor.icon,
                        '--cat-border': catColor.border
                      }}
                    >
                      {/* Badge */}
                      {status === 'done' && (
                        <span className="node-badge check" style={{ background: catColor.icon }}>
                          <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      {status === 'locked' && (
                        <span className="node-badge lock">
                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                        </span>
                      )}

                      {/* Icône */}
                      <div className="node-icon" style={{ 
                        background: status === 'done' ? 'rgba(255,255,255,0.25)' : catColor.bg,
                        color: status === 'done' ? 'white' : catColor.icon
                      }}>
                        {getSkillIcon(skill.key)}
                      </div>

                      {/* Nom */}
                      <div className="node-name" title={skill.nom}>
                        {skill.nom}
                      </div>

                      {/* Catégorie */}
                      <div className="node-cat" style={{ color: status === 'done' ? 'rgba(255,255,255,0.8)' : catColor.icon }}>
                        {skill.categorie}
                      </div>

                      {/* Barre de progression */}
                      {status === 'progress' && progress > 0 && (
                        <div className="node-progress">
                          <div 
                            className="node-progress-fill" 
                            style={{ width: `${progress}%`, background: catColor.icon }}
                          />
                        </div>
                      )}

                      {/* Badge "En dev" */}
                      {skill.inDevelopment && (
                        <span className="dev-badge">Bientôt</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedSkill && (() => {
        const modalColor = getCategoryColor(selectedSkill.categorie);
        return (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </button>

            <div className="modal-header">
              <div className="modal-icon" style={{ background: modalColor.icon }}>
                {getSkillIcon(selectedSkill.key)}
              </div>
              <div className="modal-title-group">
                <h2 className="modal-title">{selectedSkill.nom}</h2>
                <p className="modal-meta" style={{ color: modalColor.icon }}>
                  {selectedSkill.categorie} · {LEVEL_LABELS[selectedSkill.niveau]}
                </p>
              </div>
            </div>

            <div className="modal-body">
              {/* Description */}
              <div className="modal-section">
                <label className="modal-label">Description</label>
                <p className="modal-text">{selectedSkill.description}</p>
              </div>

              {/* Syntaxe */}
              {selectedSkill.syntaxe?.formule && (
                <div className="modal-section">
                  <label className="modal-label">Syntaxe</label>
                  <code className="modal-code">{selectedSkill.syntaxe.formule}</code>
                </div>
              )}

              {/* Prérequis */}
              <div className="modal-section">
                <label className="modal-label">Prérequis</label>
                <div className="modal-tags">
                  {selectedSkill.prerequis.length > 0 ? (
                    selectedSkill.prerequis.map(prereqKey => {
                      const prereq = PEDAGOGIE[prereqKey];
                      const prereqStatus = getSkillStatus({ 
                        key: prereqKey, 
                        prerequis: prereq?.prerequis || [] 
                      });
                      const prereqColor = getCategoryColor(prereq?.categorie);
                      return (
                        <span 
                          key={prereqKey} 
                          className={`tag ${prereqStatus === 'done' ? 'done' : ''}`}
                          style={{ 
                            background: prereqStatus === 'done' ? prereqColor.bg : undefined,
                            color: prereqStatus === 'done' ? prereqColor.icon : undefined
                          }}
                        >
                          {prereq?.nom || prereqKey}
                          {prereqStatus === 'done' && ' ✓'}
                        </span>
                      );
                    })
                  ) : (
                    <span className="tag none">Aucun prérequis</span>
                  )}
                </div>
              </div>

              {/* Débloque */}
              {selectedSkill.unlocks.length > 0 && (
                <div className="modal-section">
                  <label className="modal-label">Débloque</label>
                  <div className="modal-tags">
                    {selectedSkill.unlocks.map(unlockKey => {
                      const unlock = PEDAGOGIE[unlockKey];
                      const unlockColor = getCategoryColor(unlock?.categorie);
                      return (
                        <span 
                          key={unlockKey} 
                          className="tag"
                          style={{ background: unlockColor.bg, color: unlockColor.icon }}
                        >
                          {unlock?.nom || unlockKey}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Progression */}
              {(getSkillStatus(selectedSkill) === 'progress' || getSkillStatus(selectedSkill) === 'done') && (
                <div className="modal-section">
                  <label className="modal-label">Progression</label>
                  <div className="modal-progress">
                    <div 
                      className="modal-progress-fill"
                      style={{ 
                        width: `${getSkillStatus(selectedSkill) === 'done' ? 100 : getSkillProgress(selectedSkill)}%`,
                        background: modalColor.icon
                      }}
                    />
                  </div>
                  <span className="modal-progress-label">
                    {getSkillStatus(selectedSkill) === 'done' 
                      ? 'Compétence maîtrisée !' 
                      : `${getSkillProgress(selectedSkill)}% complété`}
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>
                Fermer
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handlePractice(selectedSkill)}
                disabled={getSkillStatus(selectedSkill) === 'locked' || selectedSkill.inDevelopment}
                style={{ 
                  background: getSkillStatus(selectedSkill) === 'locked' || selectedSkill.inDevelopment 
                    ? undefined 
                    : modalColor.icon 
                }}
              >
                {selectedSkill.inDevelopment
                  ? 'Bientôt disponible'
                  : getSkillStatus(selectedSkill) === 'locked'
                    ? 'Verrouillée'
                    : 'Pratiquer →'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      <style jsx>{`
        /* ═══════════════════════════════════════════════════════════
           WRAPPER & HEADER
           ═══════════════════════════════════════════════════════════ */
        
        .skill-tree-wrapper {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .skill-tree-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .back-link {
          position: absolute;
          left: 1.5rem;
          top: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8rem;
          color: var(--slate-500);
          text-decoration: none;
          transition: color 0.15s;
        }

        .back-link:hover {
          color: var(--accent-base);
        }

        .header-center {
          text-align: center;
        }

        .header-title {
          font-family: var(--font-display, 'Source Serif 4', Georgia, serif);
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--slate-900);
          margin: 0 0 0.25rem 0;
        }

        .header-subtitle {
          font-size: 0.85rem;
          color: var(--slate-500);
          margin: 0;
        }

        .legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.7rem;
          color: var(--slate-500);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .legend-dot.locked {
          background: var(--slate-200);
          border: 1.5px solid var(--slate-300);
        }

        .legend-dot.available {
          background: white;
          border: 1.5px dashed var(--accent-base);
        }

        .legend-dot.progress {
          background: var(--accent-light, rgba(90, 124, 101, 0.15));
          border: 1.5px solid var(--accent-base);
        }

        .legend-dot.done {
          background: var(--accent-base);
        }

        /* ═══════════════════════════════════════════════════════════
           SKILL TREE
           ═══════════════════════════════════════════════════════════ */

        .skill-tree {
          position: relative;
          background: var(--slate-50, #f8fafc);
          border-radius: 16px;
          padding: 2rem 1.5rem;
        }

        .connections-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .stem {
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          transition: opacity 0.2s ease;
        }

        .stem.prereq {
          stroke: var(--accent-base);
          stroke-dasharray: 6 4;
          opacity: 0.7;
        }

        .stem.unlocks {
          stroke: var(--accent-base);
          opacity: 0.9;
        }

        /* ═══════════════════════════════════════════════════════════
           LEVELS
           ═══════════════════════════════════════════════════════════ */

        .level {
          position: relative;
          z-index: 2;
          margin-bottom: 2rem;
        }

        .level:last-child {
          margin-bottom: 0;
        }

        .level-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .level-label {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--slate-400);
          background: white;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
        }

        .level-count {
          font-size: 0.65rem;
          color: var(--slate-400);
        }

        .level-nodes {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
        }

        /* ═══════════════════════════════════════════════════════════
           NODES
           ═══════════════════════════════════════════════════════════ */

        .node {
          position: relative;
          width: 115px;
          background: white;
          border: 2px solid var(--cat-border, var(--slate-200));
          border-radius: 12px;
          padding: 0.875rem 0.5rem 0.75rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 2;
        }

        .node:hover {
          border-color: var(--cat-icon, var(--accent-base));
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          background: var(--cat-bg, white);
        }

        .node.highlight {
          border-color: var(--cat-icon, var(--accent-base));
          box-shadow: 0 0 0 3px var(--cat-bg, var(--accent-light));
        }

        .node.dim {
          opacity: 0.25;
          transform: scale(0.97);
        }

        /* États */
        .node.locked {
          opacity: 0.5;
          border-color: var(--slate-200);
        }

        .node.locked:hover {
          border-color: var(--slate-300);
          transform: translateY(-2px);
          background: white;
        }

        .node.available {
          border-style: dashed;
          border-color: var(--cat-icon, var(--accent-base));
          background: var(--cat-bg, white);
        }

        .node.progress {
          border-color: var(--cat-icon, var(--accent-base));
          border-style: solid;
          background: linear-gradient(
            180deg,
            white 40%,
            var(--cat-bg, var(--accent-light)) 100%
          );
        }

        .node.done {
          border-color: var(--cat-icon, var(--accent-base));
          background: var(--cat-icon, var(--accent-base));
        }

        .node.done:hover {
          filter: brightness(0.9);
        }

        .node.done .node-name {
          color: white;
        }

        .node.in-dev {
          opacity: 0.6;
        }

        /* Icône */
        .node-icon {
          width: 32px;
          height: 32px;
          margin: 0 auto 0.5rem;
          background: var(--cat-bg, var(--slate-100));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--slate-500);
          transition: all 0.2s;
        }

        .node-icon :global(svg) {
          width: 16px;
          height: 16px;
        }

        .node-name {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--slate-800);
          line-height: 1.2;
          margin-bottom: 0.125rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .node-cat {
          font-size: 0.58rem;
          color: var(--slate-400);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* Progress bar sur le node */
        .node-progress {
          position: absolute;
          bottom: 5px;
          left: 8px;
          right: 8px;
          height: 3px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 2px;
          overflow: hidden;
        }

        .node.done .node-progress {
          background: rgba(255, 255, 255, 0.3);
        }

        .node-progress-fill {
          height: 100%;
          background: var(--accent-dark, #3d5a47);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .node.done .node-progress-fill {
          background: white;
        }

        /* Badges */
        .node-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          z-index: 3;
        }

        .node-badge.check {
          background: var(--accent-dark, #3d5a47);
        }

        .node-badge.lock {
          background: var(--slate-300);
        }

        .node-badge :global(svg) {
          width: 10px;
          height: 10px;
          color: white;
        }

        .dev-badge {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          background: var(--slate-200);
          color: var(--slate-500);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          white-space: nowrap;
        }

        /* ═══════════════════════════════════════════════════════════
           MODAL
           ═══════════════════════════════════════════════════════════ */

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 28px;
          height: 28px;
          border: none;
          background: var(--slate-100);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--slate-400);
          transition: all 0.15s;
          z-index: 1;
        }

        .modal-close:hover {
          background: var(--slate-200);
          color: var(--slate-600);
        }

        .modal-header {
          display: flex;
          gap: 1rem;
          padding: 1.5rem 1.5rem 0;
        }

        .modal-icon {
          width: 52px;
          height: 52px;
          background: var(--accent-base);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
        }

        .modal-icon :global(svg) {
          width: 24px;
          height: 24px;
        }

        .modal-title-group {
          flex: 1;
          min-width: 0;
        }

        .modal-title {
          font-family: var(--font-display, 'Source Serif 4', Georgia, serif);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--slate-900);
          margin: 0 0 0.125rem 0;
        }

        .modal-meta {
          font-size: 0.75rem;
          color: var(--slate-500);
          margin: 0;
          text-transform: capitalize;
        }

        .modal-body {
          padding: 1.25rem 1.5rem;
        }

        .modal-section {
          margin-bottom: 1rem;
        }

        .modal-section:last-child {
          margin-bottom: 0;
        }

        .modal-label {
          display: block;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--slate-400);
          margin-bottom: 0.375rem;
        }

        .modal-text {
          font-size: 0.875rem;
          color: var(--slate-600);
          line-height: 1.5;
          margin: 0;
        }

        .modal-code {
          display: block;
          font-family: 'SF Mono', Monaco, Consolas, monospace;
          font-size: 0.8rem;
          background: var(--slate-100);
          padding: 0.625rem 0.875rem;
          border-radius: 8px;
          color: var(--slate-700);
          overflow-x: auto;
        }

        .modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .tag {
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          background: var(--slate-100);
          color: var(--slate-600);
          border-radius: 4px;
        }

        .tag.done {
          background: var(--accent-light, rgba(90, 124, 101, 0.15));
          color: var(--accent-dark, #3d5a47);
        }

        .tag.none {
          font-style: italic;
          color: var(--slate-400);
        }

        .modal-progress {
          height: 6px;
          background: var(--slate-200);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.375rem;
        }

        .modal-progress-fill {
          height: 100%;
          background: var(--accent-base);
          transition: width 0.3s ease;
        }

        .modal-progress-label {
          font-size: 0.75rem;
          color: var(--slate-500);
        }

        .modal-footer {
          display: flex;
          gap: 0.75rem;
          padding: 0 1.5rem 1.5rem;
        }

        .btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }

        .btn-primary {
          background: var(--accent-base);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-dark, #3d5a47);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-ghost {
          background: transparent;
          color: var(--slate-600);
          border: 1px solid var(--slate-200);
        }

        .btn-ghost:hover {
          background: var(--slate-50);
          border-color: var(--slate-300);
        }

        /* ═══════════════════════════════════════════════════════════
           RESPONSIVE
           ═══════════════════════════════════════════════════════════ */

        @media (max-width: 768px) {
          .skill-tree-wrapper {
            padding: 1rem;
          }

          .skill-tree {
            padding: 1.5rem 1rem;
          }

          .node {
            width: 100px;
            padding: 0.625rem 0.375rem 0.625rem;
          }

          .node-icon {
            width: 28px;
            height: 28px;
            margin-bottom: 0.375rem;
          }

          .node-icon :global(svg) {
            width: 14px;
            height: 14px;
          }

          .node-name {
            font-size: 0.65rem;
          }

          .node-cat {
            font-size: 0.52rem;
          }

          .level-nodes {
            gap: 0.5rem;
          }

          .header-title {
            font-size: 1.4rem;
          }

          .legend {
            gap: 0.5rem;
          }

          .legend-item {
            font-size: 0.6rem;
          }
        }

        @media (max-width: 480px) {
          .node {
            width: 85px;
            padding: 0.5rem 0.25rem;
          }

          .node-icon {
            width: 24px;
            height: 24px;
          }

          .node-name {
            font-size: 0.58rem;
          }

          .level-nodes {
            gap: 0.375rem;
          }
        }
      `}</style>
    </div>
  );
}