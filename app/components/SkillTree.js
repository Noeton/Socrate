'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { COMPETENCES_EXCEL } from '@/shared/data/competencesExcel';
import { getLessonByCompetenceId } from '@/shared/data/learningPath';
import SkillNode from './SkillNode';
import SkillConnections from './SkillConnections';

export default function SkillTree({ userProfile, badges, onStartExercise }) {
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);

  // Handler pour démarrer un exercice
  const handleStartExercise = () => {
    if (selectedSkill) {
      // Utiliser onStartExercise si fourni, sinon rediriger vers le catalogue
      if (onStartExercise) {
        onStartExercise(selectedSkill);
      } else {
        const lesson = getLessonByCompetenceId(selectedSkill.id);
        if (lesson && lesson.sandboxKey) {
          router.push(`/catalogue/${lesson.sandboxKey.toLowerCase()}`);
        } else {
          // Fallback vers Socrate
          localStorage.setItem('socrate-pending-skill', JSON.stringify(selectedSkill));
          router.push('/ask');
        }
      }
    }
    setSelectedSkill(null);
  };

  // Calculer le statut de chaque compétence
  const getSkillStatus = (competence) => {
    if (!userProfile?.competences) return 'locked';
    
    const userComp = userProfile.competences[competence.nom];
    if (!userComp) {
      // Vérifier si les prérequis sont remplis
      const prerequisFulfilled = competence.prerequis.every(prereqId => {
        const prereqComp = COMPETENCES_EXCEL.find(c => c.id === prereqId);
        return userProfile.competences[prereqComp?.nom]?.score >= 0.5;
      });
      return prerequisFulfilled ? 'available' : 'locked';
    }
    
    const score = userComp.score || 0;
    if (score >= 0.85) return 'mastered'; // 🥇
    if (score >= 0.6) return 'intermediate'; // 🥈
    if (score >= 0.3) return 'beginner'; // 🥉
    return 'available';
  };

  // Organiser les compétences par niveaux (arbre vertical)
  const organizeByLevels = () => {
    const levels = {};
    COMPETENCES_EXCEL.forEach(comp => {
      const tier = Math.ceil(comp.niveau / 10); // 1-10 = tier 1, 11-20 = tier 2, etc.
      if (!levels[tier]) levels[tier] = [];
      levels[tier].push(comp);
    });
    return levels;
  };

  const skillLevels = organizeByLevels();

  return (
    <div className="skill-tree-container">
      <div className="skill-tree-header">
        <a href="/" className="back-button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 10H5m0 0l4-4m-4 4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour au chat
        </a>
        
        <h2>🎯 Arbre de Compétences Excel</h2>
        <div className="legend">
          <span className="legend-item">🔒 Verrouillé</span>
          <span className="legend-item">⚪ Disponible</span>
          <span className="legend-item">🥉 Débutant</span>
          <span className="legend-item">🥈 Intermédiaire</span>
          <span className="legend-item">🥇 Maîtrisé</span>
        </div>
      </div>

      <div className="skill-tree-canvas">
        <svg className="connections-layer" width="100%" height="100%">
          <SkillConnections 
            competences={COMPETENCES_EXCEL} 
            getSkillStatus={getSkillStatus}
            hoveredSkill={hoveredSkill}
          />
        </svg>

        <div className="nodes-layer">
          {Object.entries(skillLevels).map(([tier, skills]) => (
            <div key={tier} className="skill-tier" data-tier={tier}>
              <div className="tier-label">Niveau {(tier - 1) * 10 + 1}-{tier * 10}</div>
              <div className="tier-nodes">
                {skills.map(skill => (
                  <SkillNode
                    key={skill.id}
                    skill={skill}
                    status={getSkillStatus(skill)}
                    isSelected={selectedSkill?.id === skill.id}
                    isHovered={hoveredSkill?.id === skill.id}
                    onClick={() => setSelectedSkill(skill)}
                    onHover={() => setHoveredSkill(skill)}
                    onLeave={() => setHoveredSkill(null)}
                    badges={userProfile.badges}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de détails */}
      {selectedSkill && (() => {
        const lesson = getLessonByCompetenceId(selectedSkill.id);
        const status = getSkillStatus(selectedSkill);
        
        return (
        <div className="skill-modal" onClick={() => setSelectedSkill(null)}>
          <div className="skill-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedSkill(null)}>✕</button>
            <h3>{selectedSkill.nom}</h3>
            <p className="skill-category">Catégorie : {selectedSkill.categorie}</p>
            <p className="skill-level">Niveau : {selectedSkill.niveau}/58</p>
            
            {selectedSkill.prerequis.length > 0 && (
              <div className="prerequisites">
                <h4>Prérequis :</h4>
                <ul>
                  {selectedSkill.prerequis.map(prereqId => {
                    const prereq = COMPETENCES_EXCEL.find(c => c.id === prereqId);
                    return <li key={prereqId}>{prereq?.nom}</li>;
                  })}
                </ul>
              </div>
            )}
            
            {userProfile?.competences?.[selectedSkill.nom] && (
              <div className="progress-section">
                <h4>Ta progression :</h4>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(userProfile.competences[selectedSkill.nom].score || 0) * 100}%` }}
                  />
                </div>
                <p>{Math.round((userProfile.competences[selectedSkill.nom].score || 0) * 100)}% maîtrisé</p>
              </div>
            )}

            {/* Info sur la leçon */}
            {lesson && (
              <div className="lesson-info">
                <p>📚 Leçon disponible : <strong>{lesson.titre}</strong></p>
                <p className="lesson-meta">⏱ {lesson.duration} • ⭐ +{lesson.xpReward} XP</p>
              </div>
            )}
            
            <button 
              className="start-exercise-btn"
              onClick={handleStartExercise}
              disabled={status === 'locked'}
            >
              {status === 'locked' 
                ? '🔒 Débloquer les prérequis d\'abord'
                : lesson 
                  ? '🎯 Commencer la leçon'
                  : '💬 Pratiquer avec Socrate'}
            </button>
          </div>
        </div>
        );
      })()}

      <style jsx>{`
        .skill-tree-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
          border-radius: 20px;
          position: relative;
        }

        .skill-tree-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .skill-tree-header h2 {
          color: #fff;
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .legend {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .legend-item {
          color: #bbb;
          font-size: 0.9rem;
        }

        .skill-tree-canvas {
          position: relative;
          min-height: 800px;
          overflow-x: auto;
          overflow-y: visible;
        }

        .connections-layer {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 1;
        }

        .nodes-layer {
          position: relative;
          z-index: 2;
        }

        .skill-tier {
          margin-bottom: 3rem;
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .tier-label {
          min-width: 120px;
          color: #888;
          font-weight: bold;
          font-size: 0.85rem;
          text-align: right;
          padding-right: 1rem;
          border-right: 2px solid #444;
        }

        .tier-nodes {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          flex: 1;
        }

        .skill-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s;
        }

        .skill-modal-content {
          background: #2a2a3e;
          padding: 2rem;
          border-radius: 15px;
          max-width: 500px;
          width: 90%;
          color: #fff;
          position: relative;
          animation: slideUp 0.3s;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: #888;
          font-size: 1.5rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #fff;
        }

        .skill-category {
          color: #888;
          text-transform: uppercase;
          font-size: 0.85rem;
          margin: 0.5rem 0;
        }

        .skill-level {
          color: #aaa;
          font-size: 0.9rem;
        }

        .prerequisites {
          margin-top: 1.5rem;
        }

        .prerequisites h4 {
          color: #ccc;
          margin-bottom: 0.5rem;
        }

        .prerequisites ul {
          list-style: none;
          padding: 0;
        }

        .prerequisites li {
          padding: 0.3rem 0;
          color: #aaa;
          font-size: 0.9rem;
        }

        .prerequisites li:before {
          content: "→ ";
          color: #666;
        }

        .progress-section {
          margin-top: 1.5rem;
        }

        .progress-section h4 {
          color: #ccc;
          margin-bottom: 0.5rem;
        }

        .progress-bar {
          height: 10px;
          background: #444;
          border-radius: 5px;
          overflow: hidden;
          margin: 0.5rem 0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd700, #ffed4e);
          transition: width 0.5s ease;
        }

        .lesson-info {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 8px;
          border-left: 3px solid #667eea;
        }

        .lesson-info p {
          margin: 0;
          color: #ccc;
          font-size: 0.9rem;
        }

        .lesson-info .lesson-meta {
          margin-top: 0.5rem;
          color: #888;
          font-size: 0.8rem;
        }

        .start-exercise-btn {
          margin-top: 1.5rem;
          width: 100%;
          padding: 0.8rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .start-exercise-btn:hover:not(:disabled) {
          transform: scale(1.02);
        }

        .start-exercise-btn:disabled {
          background: #444;
          cursor: not-allowed;
          opacity: 0.6;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .skill-tier {
            flex-direction: column;
            align-items: flex-start;
          }

          .tier-label {
            border-right: none;
            border-bottom: 2px solid #444;
            padding-right: 0;
            padding-bottom: 0.5rem;
            text-align: left;
          }
        }
        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #374151;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          margin-bottom: 1rem;
        }

        .back-button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateX(-2px);
        }

      `}</style>
    </div>
  );
}