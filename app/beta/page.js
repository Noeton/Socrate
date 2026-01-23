'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BetaAccessPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  // Vérifier si déjà accès
  useEffect(() => {
    const storedAccess = localStorage.getItem('socrate-beta-access');
    if (storedAccess) {
      setHasAccess(true);
      // Petit délai pour l'animation
      setTimeout(() => router.push('/onboarding'), 300);
    }
  }, [router]);

  const validateCode = () => {
    setIsValidating(true);
    setError('');

    // Simuler un petit délai pour le feedback
    setTimeout(() => {
      const validCodes = (process.env.NEXT_PUBLIC_BETA_CODES || 'SOCRATE2025').split(',');
      const normalizedCode = code.trim().toUpperCase();

      if (validCodes.includes(normalizedCode)) {
        // Succès
        localStorage.setItem('socrate-beta-access', JSON.stringify({
          code: normalizedCode,
          timestamp: Date.now()
        }));
        setHasAccess(true);
        setTimeout(() => router.push('/onboarding'), 400);
      } else {
        setError('Code invalide');
        setIsValidating(false);
      }
    }, 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && code.trim()) {
      validateCode();
    }
  };

  // État de chargement si déjà accès
  if (hasAccess) {
    return (
      <div className="min-h-screen bg-[var(--slate-50)] flex items-center justify-center">
        <div className="animate-fade-in text-[var(--slate-400)]">
          Redirection...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--slate-50)] flex flex-col">
      {/* Container principal */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="font-display text-4xl font-semibold text-[var(--slate-900)] mb-3">
              Socrate
            </h1>
            <p className="text-[var(--slate-500)] text-lg">
              Accès bêta privée
            </p>
          </div>

          {/* Card */}
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-xl border border-[var(--slate-200)] shadow-[var(--shadow-sm)] p-8">
              
              {/* Label */}
              <label 
                htmlFor="beta-code"
                className="block text-sm font-medium text-[var(--slate-700)] mb-2"
              >
                Code d'invitation
              </label>

              {/* Input */}
              <input
                id="beta-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Code d'accès"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className={`
                  w-full px-4 py-3.5 rounded-lg border bg-white text-base
                  font-mono tracking-wider text-center uppercase
                  transition-all duration-200 ease-out
                  placeholder:text-[var(--slate-300)] placeholder:font-sans placeholder:tracking-normal placeholder:normal-case
                  ${error 
                    ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-2 focus:ring-[var(--error)]/20' 
                    : 'border-[var(--slate-200)] hover:border-[var(--slate-300)] focus:border-[var(--accent-base)] focus:ring-2 focus:ring-[var(--accent-base)]/20'
                  }
                  focus:outline-none
                `}
              />

              {/* Message d'erreur */}
              <div className="h-6 mt-2">
                {error && (
                  <p className="text-sm text-[var(--error)] animate-fade-in">
                    {error}
                  </p>
                )}
              </div>

              {/* Bouton */}
              <button
                onClick={validateCode}
                disabled={!code.trim() || isValidating}
                className={`
                  w-full py-3.5 rounded-lg font-medium text-base
                  transition-all duration-250 ease-out
                  ${code.trim() && !isValidating
                    ? 'bg-[var(--slate-900)] text-white hover:bg-[var(--slate-800)] active:bg-[var(--slate-900)]'
                    : 'bg-[var(--slate-100)] text-[var(--slate-400)] cursor-not-allowed'
                  }
                `}
              >
                {isValidating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" cy="12" r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                        fill="none"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Vérification...
                  </span>
                ) : (
                  'Accéder'
                )}
              </button>

            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-[var(--slate-400)] mt-8 animate-fade-in stagger-2">
            Tu n'as pas de code ? Contacte Oscar.
          </p>

        </div>
      </div>

      {/* Version tag */}
      <div className="py-6 text-center">
        <span className="text-xs text-[var(--slate-300)]">
          v0.1 beta
        </span>
      </div>
    </div>
  );
}
