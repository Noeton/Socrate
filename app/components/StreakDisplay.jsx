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

    // Version compacte si streak = 0
    if (streak.current_streak === 0) {
        return (
          <div className="streak-container-compact">
            <div className="streak-flame-small">🔥</div>
            <div className="streak-text-compact">
              Commence ta série !
            </div>
    
            <style jsx>{`
              .streak-container-compact {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0.875rem;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                transition: all 0.2s;
              }
    
              .streak-container-compact:hover {
                background: #f3f4f6;
                border-color: #d1d5db;
              }
    
              .streak-flame-small {
                font-size: 1.125rem;
                opacity: 0.5;
              }
    
              .streak-text-compact {
                font-size: 0.875rem;
                color: #6b7280;
                font-weight: 500;
              }
            `}</style>
          </div>
        );
      }
    
      return (
        <div className={`streak-container ${intensity}`}>
          <div className="streak-flame">
            🔥
          </div>
          
          <div className="streak-info">
            <div className="streak-current">
              {streak.current_streak} {streak.current_streak <= 1 ? 'jour' : 'jours'}
            </div>
            <div className="streak-label">
              {streak.is_active_today ? '✅ Actif aujourd\'hui' : '⏰ Fais un exercice !'}
            </div>
          </div>
    

      {streak.longest_streak > 0 && (
        <div className="streak-record">
          🏆 Record: {streak.longest_streak}j
        </div>
      )}

      {!streak.is_active_today && streak.current_streak > 0 && streak.streak_freeze_available > 0 && (
        <button className="freeze-button" onClick={useFreeze}>
          ❄️ Utiliser Freeze ({streak.streak_freeze_available})
        </button>
      )}

<style jsx>{`
        .streak-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          transition: all 0.2s;
        }

        .streak-container:hover {
          border-color: #d1d5db;
          background: #fafafa;
        }

        .streak-container.small {
          border-color: #fbbf24;
        }

        .streak-container.medium {
          border-color: #f97316;
        }

        .streak-container.large {
          border-color: #ef4444;
        }

        .streak-container.epic {
          border-color: #dc2626;
          background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
        }

        .streak-flame {
          font-size: 1.5rem;
          line-height: 1;
        }

        .streak-info {
          flex: 1;
        }

        .streak-current {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          line-height: 1;
          margin-bottom: 0.125rem;
        }

        .streak-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .streak-record {
          font-size: 0.75rem;
          color: #6b7280;
          background: #f9fafb;
          padding: 0.375rem 0.625rem;
          border-radius: 6px;
          font-weight: 500;
        }

        .freeze-button {
          padding: 0.375rem 0.75rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .freeze-button:hover {
          background: #2563eb;
        }

        .streak-loading {
          font-size: 1.5rem;
          text-align: center;
          padding: 1rem;
        }

        @media (max-width: 768px) {
          .streak-container {
            flex-wrap: wrap;
          }

          .streak-record {
            order: 4;
            width: 100%;
            text-align: center;
            margin-top: 0.5rem;
          }
        }
      `}</style>

    </div>
  );
}
