'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Composant wrapper pour protéger les pages
 * Vérifie l'accès beta et l'onboarding avant d'afficher le contenu
 */
export default function ProtectedPage({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // 1. Vérifier l'accès beta
        const betaAccess = localStorage.getItem('socrate-beta-access');
        if (!betaAccess) {
          router.replace('/beta');
          return;
        }

        // 2. Vérifier l'onboarding
        const onboardingComplete = localStorage.getItem('socrate-onboarding-complete');
        if (!onboardingComplete) {
          router.replace('/onboarding');
          return;
        }

        // Tout est OK
        setIsAuthorized(true);
      } catch (error) {
        console.error('Erreur auth:', error);
        router.replace('/beta');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Écran de chargement sobre
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--slate-50)] flex items-center justify-center">
        <div className="text-[var(--slate-400)] animate-pulse-subtle">
          Chargement...
        </div>
      </div>
    );
  }

  // Si pas autorisé, ne rien afficher (la redirection est en cours)
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
