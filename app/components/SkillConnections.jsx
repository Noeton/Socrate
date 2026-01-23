'use client';

import { useEffect, useState, useRef } from 'react';

export default function SkillConnections({ competences, getSkillStatus, hoveredSkill }) {
  const [connections, setConnections] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!hoveredSkill) {
      setConnections([]);
      return;
    }

    // Trouver les connexions pour le skill survolé
    const lines = [];
    
    // Connexions vers les prérequis (parents)
    if (hoveredSkill.prerequis && hoveredSkill.prerequis.length > 0) {
      hoveredSkill.prerequis.forEach(prereqId => {
        const prereqSkill = competences.find(c => c.id === prereqId);
        if (prereqSkill) {
          const fromElement = document.querySelector(`[data-skill-id="${prereqSkill.id}"]`);
          const toElement = document.querySelector(`[data-skill-id="${hoveredSkill.id}"]`);
          
          if (fromElement && toElement) {
            const fromRect = fromElement.getBoundingClientRect();
            const toRect = toElement.getBoundingClientRect();
            const svgRect = svgRef.current?.getBoundingClientRect();
            
            if (svgRect) {
              lines.push({
                x1: fromRect.left + fromRect.width / 2 - svgRect.left,
                y1: fromRect.top + fromRect.height / 2 - svgRect.top,
                x2: toRect.left + toRect.width / 2 - svgRect.left,
                y2: toRect.top + toRect.height / 2 - svgRect.top,
                type: 'prerequis',
                status: getSkillStatus(prereqSkill)
              });
            }
          }
        }
      });
    }

    // Connexions vers les skills débloqués (enfants)
    const unlockedSkills = competences.filter(skill => 
      skill.prerequis && skill.prerequis.includes(hoveredSkill.id)
    );

    unlockedSkills.forEach(skill => {
      const fromElement = document.querySelector(`[data-skill-id="${hoveredSkill.id}"]`);
      const toElement = document.querySelector(`[data-skill-id="${skill.id}"]`);
      
      if (fromElement && toElement) {
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const svgRect = svgRef.current?.getBoundingClientRect();
        
        if (svgRect) {
          lines.push({
            x1: fromRect.left + fromRect.width / 2 - svgRect.left,
            y1: fromRect.top + fromRect.height / 2 - svgRect.top,
            x2: toRect.left + toRect.width / 2 - svgRect.left,
            y2: toRect.top + toRect.height / 2 - svgRect.top,
            type: 'unlocks',
            status: getSkillStatus(skill)
          });
        }
      }
    });

    setConnections(lines);
  }, [hoveredSkill, competences, getSkillStatus]);

  const getLineColor = (type, status) => {
    if (type === 'prerequis') {
      // Lignes vers les prérequis (parents) - plus visible
      return '#3b82f6'; // bleu
    } else {
      // Lignes vers ce qui est débloqué (enfants) - plus subtil
      return '#10b981'; // vert
    }
  };

  return (
    <svg 
      ref={svgRef}
      className="connections-svg" 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <defs>
        <marker
          id="arrowhead-prerequis"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-unlocks"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
        </marker>
      </defs>

      {connections.map((conn, idx) => (
        <g key={`conn-${idx}`}>
          {/* Ligne avec glow effect */}
          <line
            x1={conn.x1}
            y1={conn.y1}
            x2={conn.x2}
            y2={conn.y2}
            stroke={getLineColor(conn.type, conn.status)}
            strokeWidth="3"
            opacity="0.8"
            markerEnd={`url(#arrowhead-${conn.type})`}
            className="connection-line"
            style={{
              filter: `drop-shadow(0 0 4px ${getLineColor(conn.type, conn.status)})`,
              animation: 'drawLine 0.3s ease-out'
            }}
          />
        </g>
      ))}

      <style jsx>{`
        @keyframes drawLine {
          from {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            opacity: 0;
          }
          to {
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
            opacity: 0.8;
          }
        }

        .connection-line {
          transition: all 0.3s ease;
        }
      `}</style>
    </svg>
  );
}
