'use client';
import { Award } from 'lucide-react';

export default function SkillNode({ 
  skill, 
  status, 
  isSelected, 
  isHovered, 
  onClick, 
  onHover, 
  onLeave,
  badges = []
}) {
  const getStatusIcon = () => {
    switch(status) {
      case 'locked': return '🔒';
      case 'available': return '⚪';
      case 'beginner': return '🥉';
      case 'intermediate': return '🥈';
      case 'mastered': return '🥇';
      default: return '⚪';
    }
  };

  const getCategoryColor = () => {
    const colors = {
      'basique': '#3b82f6',      // bleu
      'formule': '#10b981',      // vert
      'analyse': '#f59e0b',      // orange
      'visualisation': '#8b5cf6', // violet
      'automatisation': '#ef4444' // rouge
    };
    return colors[skill.categorie] || '#6b7280';
  };

  const getStatusColor = () => {
    switch(status) {
      case 'locked': return '#374151';
      case 'available': return '#4b5563';
      case 'beginner': return '#cd7f32'; // bronze
      case 'intermediate': return '#c0c0c0'; // silver
      case 'mastered': return '#ffd700'; // gold
      default: return '#4b5563';
    };
  }
  const isExpert = badges.some(b => b.id === 'expert_competence')|| false;

  return (
    <div
      className={`skill-node ${status} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      data-skill-id={skill.id}
    >
      <div className="skill-icon">{getStatusIcon()}</div>
      <div className="skill-name">{skill.nom}</div>
      <div className="skill-level">Nv.{skill.niveau}
      {isExpert && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-2">
          <div className="bg-yellow-400 p-1.5 rounded-full shadow-lg border-4 border-white">
            <span className="text-white font-bold text-sm">🏆</span>
          </div>
        </div>
      )}
      </div>


      <style jsx>{`
        .skill-node {
          position: relative;
          width: 140px;
          padding: 1rem;
          background: ${getStatusColor()};
          border: 3px solid ${getCategoryColor()};
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .skill-node.locked {
          cursor: not-allowed;
          opacity: 0.5;
          filter: grayscale(0.8);
        }

        .skill-node:not(.locked):hover,
        .skill-node.hovered {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.5);
          border-color: ${getCategoryColor()};
          filter: brightness(1.2);
        }

        .skill-node.selected {
          transform: scale(1.1);
          box-shadow: 0 0 20px ${getCategoryColor()};
          border-width: 4px;
        }

        .skill-node.mastered {
          animation: glow 2s ease-in-out infinite;
        }

        .skill-icon {
          font-size: 2rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        }

        .skill-name {
          text-align: center;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.2;
          min-height: 2.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .skill-level {
          color: #bbb;
          font-size: 0.75rem;
          font-weight: 500;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.2rem 0.6rem;
          border-radius: 10px;
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), 0 0 20px ${getCategoryColor()}40;
          }
          50% {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), 0 0 30px ${getCategoryColor()}80;
          }
        }

        @media (max-width: 768px) {
          .skill-node {
            width: 120px;
            padding: 0.8rem;
          }

          .skill-icon {
            font-size: 1.5rem;
          }

          .skill-name {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
