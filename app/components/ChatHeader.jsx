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
    const colors = {
      'debutant': { bg: '#dbeafe', text: '#1e40af', icon: '🌱' },
      'intermediaire': { bg: '#fef3c7', text: '#92400e', icon: '⚡' },
      'avance': { bg: '#fce7f3', text: '#9f1239', icon: '🚀' }
    };
    
    const config = colors[niveau] || { bg: '#f3f4f6', text: '#6b7280', icon: '👤' };
    
    return (
      <div className="niveau-badge" style={{ background: config.bg, color: config.text }}>
        <span className="badge-icon">{config.icon}</span>
        <span className="badge-text">
          {niveau ? niveau.charAt(0).toUpperCase() + niveau.slice(1) : 'Non défini'}
        </span>
      </div>
    );
  };

  return (
    <header className="chat-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar} title="Ouvrir le menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <button className="logo" onClick={handleGoHome} title="Retour à l'accueil">
          <div className="logo-text">
            <h1>Socrate</h1>
            <span className="mode-indicator">Tuteur Excel IA</span>
          </div>
        </button>
      </div>

      <div className="header-center">
        {sessionId && (
          <div className="streak-wrapper">
            <StreakDisplay userId={sessionId} />
          </div>
        )}
        
        {userProfile?.niveau && getNiveauBadge()}
        
        {userProfile?.contexteMetier && (
          <div className="metier-badge">
            <span className="metier-icon">💼</span>
            <span className="metier-text">{userProfile.contexteMetier}</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <a href="/learn" className="nav-button" title="Parcours guidé">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <span className="button-label">Apprendre</span>
        </a>
        
        <a href="/catalogue" className="nav-button" title="Catalogue libre">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
          <span className="button-label">Catalogue</span>
        </a>

        <button className="new-chat-button" onClick={onReset} title="Nouvelle conversation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
          padding: 1rem 1.5rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          height: 64px;
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
          color: #6b7280;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .sidebar-toggle:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          margin: -0.25rem -0.5rem;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .logo:hover {
          background: #f3f4f6;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .logo h1 {
          font-family: 'Source Serif 4', 'Playfair Display', 'Georgia', serif;
          font-size: 1.4rem;
          font-weight: 600;
          font-style: italic;
          color: #1e40af;
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .mode-indicator {
          font-size: 0.7rem;
          color: #6b7280;
          font-weight: 500;
        }

        .header-center {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .niveau-badge, .metier-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.875rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .badge-icon, .metier-icon {
          font-size: 1rem;
        }

        .metier-badge {
          background: #f3f4f6;
          color: #374151;
        }

        .header-right {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          background: white;
          color: #374151;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .nav-button:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #111827;
        }

        .new-chat-button {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.75rem 1.5rem;
          border: none;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          cursor: pointer;
          border-radius: 14px;
          transition: all 0.25s ease;
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
          animation: glow-pulse 2.5s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
          }
          50% {
            box-shadow: 0 6px 25px rgba(139, 92, 246, 0.5);
          }
        }

        .new-chat-button:hover {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
          animation: none;
        }

        .new-chat-button:active {
          transform: translateY(-1px) scale(1);
        }

        .button-label {
          display: inline;
        }

        @media (max-width: 768px) {
          .chat-header {
            padding: 0.75rem 1rem;
          }

          .sidebar-toggle {
            display: flex;
          }

          .header-center {
            display: none;
          }

          .logo h1 {
            font-size: 1rem;
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
          margin-right: 1rem;
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
