'use client';

import { useState, useEffect } from 'react';

export default function StreakDisplay({ userId }) {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchStreak();
    }
  }, [userId]);

  const fetchStreak = async () => {
    try {
      const response = await fetch(`/api/streak?userId=${userId}`);
      const data = await response.json();
      setStreak(data);
    } catch (error) {
      console.error('Erreur fetch streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const useFreeze = async () => {
    if (!confirm('Utiliser un Streak Freeze pour sauver ta série ?')) return;

    try {
      const response = await fetch('/api/streak', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('✅ ' + data.message);
        fetchStreak();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      console.error('Erreur use freeze:', error);
    }
  };

  if (loading) {
    return <div className="streak-loading">⏳</div>;
  }

  if (!streak) return null;

  const getFlameIntensity = () => {
    if (streak.current_streak === 0) return 'none';
    if (streak.current_streak < 3) return 'small';
    if (streak.current_streak < 7) return 'medium';
    if (streak.current_streak < 30) return 'large';
    return 'epic';
  };

  const intensity = getFlameIntensity();

    // CACHER COMPLÈTEMENT si streak = 0 (pas de "Commence ta série !")
    if (streak.current_streak === 0) {
      return null;
    }

    // Version compacte pour petits streaks (1-2)
    if (streak.current_streak < 3) {
        return (
          <div className="streak-container-compact">
            <div className="streak-flame-small">🔥</div>
            <div className="streak-text-compact">
              {streak.current_streak} jour{streak.current_streak > 1 ? 's' : ''}
            </div>
    
            <style jsx>{`
              .streak-container-compact {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0.875rem;
                background: var(--slate-50);
                border: 1px solid var(--slate-200);
                border-radius: 8px;
                transition: all 0.2s;
              }
    
              .streak-container-compact:hover {
                background: var(--slate-100);
                border-color: var(--slate-300);
              }
    
              .streak-flame-small {
                font-size: 1rem;
                opacity: 0.5;
              }
    
              .streak-text-compact {
                font-size: 0.8rem;
                color: var(--slate-500);
                font-weight: 500;
              }
            `}</style>
          </div>
        );
      }
    
      return (
        <div className={`streak-container ${intensity}`}>
          <div className="streak-flame">🔥</div>
          
          <div className="streak-info">
            <span className="streak-current">{streak.current_streak}j</span>
            {streak.longest_streak > streak.current_streak && (
              <span className="streak-record">· Record {streak.longest_streak}j</span>
            )}
          </div>

      {!streak.is_active_today && streak.current_streak > 0 && streak.streak_freeze_available > 0 && (
        <button className="freeze-button" onClick={useFreeze}>
          ❄️ {streak.streak_freeze_available}
        </button>
      )}

<style jsx>{`
        .streak-container {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.65rem;
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: 6px;
          transition: all 0.2s;
          font-size: 0.8rem;
        }

        .streak-container:hover {
          border-color: var(--slate-300);
        }

        .streak-container.small,
        .streak-container.medium,
        .streak-container.large,
        .streak-container.epic {
          border-color: var(--accent-base);
          background: rgba(90, 124, 101, 0.05);
        }

        .streak-flame {
          font-size: 1rem;
          line-height: 1;
        }

        .streak-info {
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
        }

        .streak-current {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--slate-800);
          line-height: 1;
        }

        .streak-label {
          font-size: 0.65rem;
          color: var(--slate-500);
          font-weight: 500;
        }

        .streak-record {
          font-size: 0.65rem;
          color: var(--slate-500);
          font-weight: 500;
          margin-left: 0.25rem;
        }

        .freeze-button {
          padding: 0.25rem 0.5rem;
          background: var(--accent-base);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: 0.25rem;
        }

        .freeze-button:hover {
          background: var(--accent-dark);
        }

        .streak-loading {
          font-size: 1rem;
          text-align: center;
          padding: 0.25rem;
        }
      `}</style>

    </div>
  );
}