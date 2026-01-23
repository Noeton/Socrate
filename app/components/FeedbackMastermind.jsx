'use client';

import { useState } from 'react';

/**
 * FEEDBACK MASTERMIND
 * Affiche le détail des checkpoints avec indices progressifs
 */
export default function FeedbackMastermind({ detailedFeedback }) {
  const [revealedHints, setRevealedHints] = useState({});

  if (!detailedFeedback || !detailedFeedback.checkpoints) {
    return null;
  }

  const { globalMessage, scoreBreakdown, checkpoints, nextSteps } = detailedFeedback;

  const toggleHint = (cellule) => {
    setRevealedHints(prev => ({
      ...prev,
      [cellule]: !prev[cellule]
    }));
  };

  return (
    <div className="feedback-mastermind">
      {/* Score breakdown */}
      {scoreBreakdown && (
        <div className="score-section">
          <div className="score-main">
            <span className="score-value">{scoreBreakdown.adjusted_score}</span>
            <span className="score-max">/ 100</span>
          </div>
          {scoreBreakdown.hints_penalty > 0 && (
            <div className="score-penalty">
              (-{scoreBreakdown.hints_penalty} pts pour indices utilisés)
            </div>
          )}
        </div>
      )}

      {/* Liste des checkpoints */}
      <div className="checkpoints-list">
        <div className="checkpoints-header">Détail par checkpoint</div>
        
        {checkpoints.map((cp, idx) => (
          <div 
            key={idx} 
            className={`checkpoint-item ${cp.status === 'success' ? 'success' : 'failed'}`}
          >
            <div className="checkpoint-main">
              <span className="checkpoint-icon">
                {cp.status === 'success' ? '✅' : '❌'}
              </span>
              <span className="checkpoint-cell">{cp.cellule}</span>
              <span className="checkpoint-desc">{cp.description}</span>
              <span className="checkpoint-points">{cp.points}</span>
            </div>

            {/* Message d'erreur si échoué */}
            {cp.status === 'failed' && cp.message && (
              <div className="checkpoint-error">{cp.message}</div>
            )}

            {/* Bouton indice si disponible */}
            {cp.status === 'failed' && cp.hint_available && (
              <div className="checkpoint-hint-section">
                <button 
                  className="hint-button"
                  onClick={() => toggleHint(cp.cellule)}
                >
                  {revealedHints[cp.cellule] 
                    ? '🙈 Masquer l\'indice' 
                    : `💡 Indice niveau ${cp.hint_level}`
                  }
                </button>
                
                {revealedHints[cp.cellule] && (
                  <div className="hint-content">
                    {cp.hint_text}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prochaines étapes */}
      {nextSteps && (
        <div className="next-steps">
          💪 {nextSteps}
        </div>
      )}

      <style jsx>{`
        .feedback-mastermind {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          margin-top: 0.75rem;
          font-size: 0.9rem;
        }

        .score-section {
          text-align: center;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 0.75rem;
        }

        .score-main {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.25rem;
        }

        .score-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e40af;
        }

        .score-max {
          font-size: 1rem;
          color: #64748b;
        }

        .score-penalty {
          font-size: 0.75rem;
          color: #dc2626;
          margin-top: 0.25rem;
        }

        .checkpoints-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkpoints-header {
          font-weight: 600;
          color: #475569;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .checkpoint-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem;
        }

        .checkpoint-item.success {
          border-left: 3px solid #22c55e;
        }

        .checkpoint-item.failed {
          border-left: 3px solid #ef4444;
        }

        .checkpoint-main {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .checkpoint-icon {
          font-size: 1rem;
        }

        .checkpoint-cell {
          font-family: monospace;
          background: #f1f5f9;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .checkpoint-desc {
          flex: 1;
          color: #475569;
        }

        .checkpoint-points {
          font-weight: 600;
          color: #64748b;
          font-size: 0.8rem;
        }

        .checkpoint-error {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #fef2f2;
          border-radius: 6px;
          color: #dc2626;
          font-size: 0.85rem;
        }

        .checkpoint-hint-section {
          margin-top: 0.5rem;
        }

        .hint-button {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          padding: 0.375rem 0.75rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hint-button:hover {
          background: #fde68a;
        }

        .hint-content {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          color: #92400e;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .next-steps {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e2e8f0;
          color: #475569;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}