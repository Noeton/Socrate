'use client';

export default function ChatSidebar({ userProfile, onClose, onNewChat }) {
  
  const getProgressPercentage = () => {
    if (!userProfile?.scoreGranulaire) return 0;
    return Math.min((userProfile.scoreGranulaire / 1000) * 100, 100);
  };

  return (
    <div className="sidebar-overlay" onClick={onClose}>
      <aside className="sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="sidebar-content">
          {/* BOUTON NOUVELLE CONVERSATION - TRÈS VISIBLE */}
          <button 
            className="new-chat-btn"
            onClick={() => {
              onNewChat?.();
              onClose();
            }}
          >
            <span className="new-chat-icon">✨</span>
            <span>Nouvelle conversation</span>
          </button>

          <div className="profile-section">
            <div className="profile-avatar">
              <span className="avatar-large">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : '👤'}
              </span>
            </div>
            <h4>{userProfile?.name || 'Mon profil'}</h4>
            
            {userProfile?.niveau ? (
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Niveau</span>
                  <span className="info-value">{userProfile.niveau}</span>
                </div>
                {userProfile.contexteMetier && (
                  <div className="info-item">
                    <span className="info-label">Métier</span>
                    <span className="info-value">{userProfile.contexteMetier}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="no-profile">Commence à discuter pour que j'apprenne à te connaître !</p>
            )}
          </div>

          {userProfile?.scoreGranulaire !== undefined && (
            <div className="progress-section">
              <h4>Progression globale</h4>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${getProgressPercentage()}%` }} />
              </div>
              <p className="progress-text">{userProfile.scoreGranulaire} / 1000 XP</p>
            </div>
          )}

          <div className="links-section">
            <h4>Navigation</h4>
            <a href="/?menu=true" className="sidebar-link">
              🏠 Accueil
            </a>
            <a href="/learn" className="sidebar-link">
              📚 Parcours d'apprentissage
            </a>
            <a href="/skill-tree" className="sidebar-link">
              🎯 Arbre de compétences
            </a>
            <a href="/catalogue" className="sidebar-link">
              📂 Catalogue compétences
            </a>
          </div>
        </div>

        <style jsx>{`
          .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 100;
            animation: fadeIn 0.2s;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 320px;
            max-width: 85vw;
            background: white;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            animation: slideIn 0.3s ease-out;
          }

          @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }

          .sidebar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .sidebar-header h3 {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: #111827;
          }

          .close-button {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            color: #6b7280;
            cursor: pointer;
            border-radius: 6px;
            font-size: 1.25rem;
            transition: all 0.2s;
          }

          .close-button:hover {
            background: #f3f4f6;
            color: #111827;
          }

          .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
          }

          /* BOUTON NOUVELLE CONVERSATION */
          .new-chat-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
            margin-bottom: 1.5rem;
            border: none;
            border-radius: 14px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.25s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
          }

          .new-chat-btn:hover {
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45);
          }

          .new-chat-btn:active {
            transform: translateY(0);
          }

          .new-chat-icon {
            font-size: 1.25rem;
          }

          .profile-section {
            text-align: center;
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 16px;
          }

          .profile-avatar {
            width: 80px;
            height: 80px;
            margin: 0 auto 1rem;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          }

          .avatar-large {
            font-size: 2rem;
            color: white;
            font-weight: bold;
          }

          .profile-section h4 {
            margin: 0 0 1rem 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #111827;
          }

          .profile-info {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem;
            background: white;
            border-radius: 8px;
          }

          .info-label {
            font-size: 0.875rem;
            color: #6b7280;
            font-weight: 500;
          }

          .info-value {
            font-size: 0.875rem;
            color: #111827;
            font-weight: 600;
            text-transform: capitalize;
          }

          .no-profile {
            font-size: 0.875rem;
            color: #6b7280;
            line-height: 1.5;
          }

          .progress-section {
            margin-bottom: 2rem;
          }

          .progress-section h4 {
            margin: 0 0 0.75rem 0;
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
          }

          .progress-bar-container {
            height: 10px;
            background: #e5e7eb;
            border-radius: 5px;
            overflow: hidden;
            margin-bottom: 0.5rem;
          }

          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            transition: width 0.5s ease;
            border-radius: 5px;
          }

          .progress-text {
            font-size: 0.75rem;
            color: #6b7280;
            margin: 0;
          }

          .links-section h4 {
            margin: 0 0 0.75rem 0;
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
          }

          .sidebar-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1rem;
            background: #f9fafb;
            border-radius: 10px;
            color: #374151;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            transition: all 0.2s;
            border: 1px solid transparent;
          }

          .sidebar-link:hover {
            background: #f3f4f6;
            transform: translateX(4px);
            border-color: #e5e7eb;
          }
        `}</style>
      </aside>
    </div>
  );
}
