'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AppHeader({ showBack = false, title = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('socrate-user-data');
    if (stored) {
      setUserData(JSON.parse(stored));
    }
  }, []);

  const isLearnActive = pathname?.startsWith('/learn');
  const isAskActive = pathname?.startsWith('/ask');
  const isCatalogueActive = pathname?.startsWith('/catalogue');

  const handleGoHome = () => {
    router.push('/?menu=true');
  };

  const handleLogout = () => {
    localStorage.removeItem('socrate-user-data');
    localStorage.removeItem('socrate-beta-access');
    localStorage.removeItem('socrate-onboarding-complete');
    localStorage.removeItem('socrate-last-mode');
    router.push('/beta');
  };

  return (
    <header className="bg-white border-b border-[var(--slate-200)] sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Partie gauche : Logo ou Retour */}
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={handleGoHome}
                className="inline-flex items-center gap-2 text-[var(--slate-500)] hover:text-[var(--slate-700)] transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">Retour</span>
              </button>
            ) : (
              <button
                onClick={handleGoHome}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span 
                  className="text-xl font-semibold italic text-blue-800"
                  style={{ fontFamily: "'Source Serif 4', 'Playfair Display', Georgia, serif" }}
                >
                  Socrate
                </span>
              </button>
            )}

            {/* Titre de page si fourni */}
            {title && (
              <>
                <span className="text-[var(--slate-300)]">/</span>
                <span className="text-sm font-medium text-[var(--slate-600)]">{title}</span>
              </>
            )}
          </div>

          {/* Partie centrale : Navigation (seulement sur desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <NavButton
              href="/learn"
              active={isLearnActive}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              label="Apprendre"
            />
            <NavButton
              href="/ask"
              active={isAskActive}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              label="Question"
            />
            <NavButton
              href="/catalogue"
              active={isCatalogueActive}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              label="Catalogue"
            />
          </nav>

          {/* Partie droite : User / Settings */}
          <div className="flex items-center gap-2">
            {/* Menu mobile */}
            <div className="flex md:hidden items-center gap-1">
              <MobileNavButton href="/learn" active={isLearnActive} icon="📚" label="Cours" />
              <MobileNavButton href="/ask" active={isAskActive} icon="💬" label="Chat" />
              <MobileNavButton href="/catalogue" active={isCatalogueActive} icon="📂" label="Liste" />
            </div>

            {/* Bouton profil - Fond sobre mais bien visible */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border-2 border-[var(--slate-200)] hover:border-[var(--slate-300)] hover:bg-[var(--slate-50)] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white shadow-sm">
                  <span className="text-base font-bold text-white">
                    {userData?.name ? userData.name.charAt(0).toUpperCase() : '👤'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[var(--slate-700)] hidden sm:inline max-w-32 truncate">
                  {userData?.name || 'Mon profil'}
                </span>
                <svg className="w-4 h-4 text-[var(--slate-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menu déroulant */}
              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--slate-200)] py-2 z-50">
                    {userData?.name && (
                      <div className="px-4 py-2 border-b border-[var(--slate-100)]">
                        <p className="text-sm font-medium text-[var(--slate-900)]">{userData.name}</p>
                        <p className="text-xs text-[var(--slate-500)]">
                          {userData.niveau ? `Niveau ${userData.niveau}` : 'Bienvenue !'}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push('/skill-tree');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--slate-700)] hover:bg-[var(--slate-50)] flex items-center gap-3"
                    >
                      <span>🌳</span>
                      <span>Arbre de compétences</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push('/onboarding');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--slate-700)] hover:bg-[var(--slate-50)] flex items-center gap-3"
                    >
                      <span>⚙️</span>
                      <span>Modifier mon profil</span>
                    </button>
                    <div className="border-t border-[var(--slate-100)] mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <span>🚪</span>
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Bouton de navigation desktop
function NavButton({ href, active, icon, label }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-[var(--slate-100)] text-[var(--slate-900)]'
          : 'text-[var(--slate-500)] hover:text-[var(--slate-700)] hover:bg-[var(--slate-50)]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Bouton de navigation mobile (compact mais avec label)
function MobileNavButton({ href, active, icon, label }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 ${
        active
          ? 'bg-[var(--slate-100)]'
          : 'hover:bg-[var(--slate-50)]'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className={`text-xs font-medium ${active ? 'text-[var(--slate-900)]' : 'text-[var(--slate-500)]'}`}>
        {label}
      </span>
    </button>
  );
}
