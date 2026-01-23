'use client';

import { useRouter } from 'next/navigation';
import StreakDisplay from './StreakDisplay';

export default function ChatHeader({ userProfile, onReset, onToggleSidebar, sessionId }) {
  const router = useRouter();

  const handleGoHome = () => {
    localStorage.removeItem('socrate-last-mode');
    router.push('/?menu=true');
  };

  const getNiveauBadge = () => {
    const niveau = userProfile?.niveau;
    const labels = {
      'debutant': 'Débutant',
      'intermediaire': 'Intermédiaire',
      'avance': 'Avancé'
    };
    
    return niveau ? (
      <div className="niveau-badge">
        <span className="badge-text">{labels[niveau] || niveau}</span>
      </div>
    ) : null;
  };

  return (
    <header className="chat-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar} title="Ouvrir le menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        
        <button className="logo" onClick={handleGoHome} title="Retour à l'accueil">
          <h1>Socrate</h1>
          <span className="mode-indicator">Tuteur Excel IA</span>
        </button>
      </div>

      <div className="header-center">
        {sessionId && (
          <div className="streak-wrapper">
            <StreakDisplay userId={sessionId} />
          </div>
        )}
        
        {getNiveauBadge()}
        
        {userProfile?.contexteMetier && (
          <div className="metier-badge">
            <span className="metier-text">{userProfile.contexteMetier}</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <a href="/learn" className="nav-button" title="Parcours guidé">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <span className="button-label">Apprendre</span>
        </a>
        
        <a href="/catalogue" className="nav-button" title="Catalogue libre">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
          <span className="button-label">Catalogue</span>
        </a>

        <button className="new-chat-button" onClick={onReset} title="Nouvelle conversation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span className="button-label">Nouveau</span>
        </button>
      </div>


      <style jsx>{`
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          background: white;
          border-bottom: 1px solid var(--slate-200);
          height: 60px;
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sidebar-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          color: var(--slate-500);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .sidebar-toggle:hover {
          background: var(--slate-100);
          color: var(--slate-700);
        }

        .logo {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          margin: -0.25rem -0.5rem;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .logo:hover {
          background: var(--slate-50);
        }

        .logo h1 {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--slate-900);
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .mode-indicator {
          font-size: 0.7rem;
          color: var(--slate-500);
          font-weight: 400;
        }

        .header-center {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .niveau-badge, .metier-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          background: var(--slate-100);
          color: var(--slate-600);
        }

        .header-right {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          border: 1px solid var(--slate-200);
          background: white;
          color: var(--slate-600);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .nav-button:hover {
          border-color: var(--accent-base);
          color: var(--accent-base);
          background: rgba(90, 124, 101, 0.05);
        }

        .new-chat-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          background: var(--accent-base);
          color: white;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .new-chat-button:hover {
          background: var(--accent-dark);
          transform: translateY(-1px);
        }

        .new-chat-button:active {
          transform: translateY(0);
        }

        .button-label {
          display: inline;
        }

        @media (max-width: 768px) {
          .chat-header {
            padding: 0 1rem;
          }

          .sidebar-toggle {
            display: flex;
          }

          .header-center {
            display: none;
          }

          .logo h1 {
            font-size: 1.1rem;
          }

          .button-label {
            display: none;
          }

          .nav-button, .new-chat-button {
            padding: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .nav-button {
            display: none;
          }
        }

        .streak-wrapper {
          margin-right: 0.5rem;
        }

        @media (max-width: 1024px) {
          .streak-wrapper {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}