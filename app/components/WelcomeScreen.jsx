'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const stored = localStorage.getItem('socrate-user-data');
      if (stored) {
        setUserData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (mode) => {
    localStorage.setItem('socrate-last-mode', mode);
    router.push(`/${mode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--slate-50)] flex items-center justify-center">
        <div className="animate-pulse-subtle text-[var(--slate-400)]">
          Chargement...
        </div>
      </div>
    );
  }

  const userName = userData?.name || null;

  return (
    <div className="min-h-screen bg-[var(--slate-50)] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <p className="text-[var(--slate-500)] text-lg mb-2">
              {userName ? `Bonjour ${userName}` : 'Bonjour'} 👋
            </p>
            <h1 className="font-display text-3xl font-semibold text-[var(--slate-900)]">
              Que veux-tu faire ?
            </h1>
          </div>

          {/* Options */}
          <div className="space-y-4">
            
            {/* Option Apprendre */}
            <button
              onClick={() => handleModeSelect('learn')}
              className="w-full group animate-fade-in-up"
            >
              <div className="bg-white rounded-xl border border-[var(--slate-200)] p-6 text-left transition-all duration-250 ease-out hover:border-[var(--slate-300)] hover:shadow-[var(--shadow-md)] group-hover:-translate-y-0.5">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-lg bg-[var(--slate-100)] flex items-center justify-center transition-colors duration-250 group-hover:bg-[var(--accent-base)]/10">
                    <svg className="w-6 h-6 text-[var(--slate-600)] transition-colors duration-250 group-hover:text-[var(--accent-base)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-semibold text-[var(--slate-900)] mb-1">
                      Apprendre
                    </h2>
                    <p className="text-sm text-[var(--slate-500)]">
                      Parcours structuré avec exercices progressifs
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-[var(--slate-400)] transition-all duration-250 group-hover:text-[var(--slate-600)] group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Option Question */}
            <button
              onClick={() => handleModeSelect('ask')}
              className="w-full group animate-fade-in-up stagger-1"
            >
              <div className="bg-white rounded-xl border border-[var(--slate-200)] p-6 text-left transition-all duration-250 ease-out hover:border-[var(--slate-300)] hover:shadow-[var(--shadow-md)] group-hover:-translate-y-0.5">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-lg bg-[var(--slate-100)] flex items-center justify-center transition-colors duration-250 group-hover:bg-[var(--accent-base)]/10">
                    <svg className="w-6 h-6 text-[var(--slate-600)] transition-colors duration-250 group-hover:text-[var(--accent-base)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-semibold text-[var(--slate-900)] mb-1">
                      Poser une question
                    </h2>
                    <p className="text-sm text-[var(--slate-500)]">
                      Aide ponctuelle sur un problème Excel
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-[var(--slate-400)] transition-all duration-250 group-hover:text-[var(--slate-600)] group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Option Catalogue - NOUVEAU */}
            <button
              onClick={() => handleModeSelect('catalogue')}
              className="w-full group animate-fade-in-up stagger-2"
            >
              <div className="bg-white rounded-xl border border-[var(--slate-200)] p-6 text-left transition-all duration-250 ease-out hover:border-[var(--slate-300)] hover:shadow-[var(--shadow-md)] group-hover:-translate-y-0.5">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-lg bg-[var(--slate-100)] flex items-center justify-center transition-colors duration-250 group-hover:bg-[var(--accent-base)]/10">
                    <svg className="w-6 h-6 text-[var(--slate-600)] transition-colors duration-250 group-hover:text-[var(--accent-base)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-semibold text-[var(--slate-900)] mb-1">
                      Catalogue libre
                    </h2>
                    <p className="text-sm text-[var(--slate-500)]">
                      Choisis directement ce que tu veux apprendre
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-[var(--slate-400)] transition-all duration-250 group-hover:text-[var(--slate-600)] group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <span className="text-xs text-[var(--slate-300)]">
          Socrate v0.1 beta
        </span>
      </div>
    </div>
  );
}