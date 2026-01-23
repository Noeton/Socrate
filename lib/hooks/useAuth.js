'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook pour vérifier l'accès beta
 * Redirige vers /beta si pas d'accès valide
 * 
 * @param {Object} options
 * @param {boolean} options.redirect - Si true, redirige automatiquement (défaut: true)
 * @returns {{ hasAccess: boolean, isLoading: boolean, betaInfo: Object|null }}
 */
export function useBetaAccess({ redirect = true } = {}) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [betaInfo, setBetaInfo] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = () => {
      try {
        const stored = localStorage.getItem('socrate-beta-access');
        
        if (stored) {
          const parsed = JSON.parse(stored);
          setBetaInfo(parsed);
          setHasAccess(true);
        } else if (redirect) {
          router.push('/beta');
        }
      } catch (error) {
        console.error('Erreur vérification beta:', error);
        if (redirect) {
          router.push('/beta');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [redirect, router]);

  return { hasAccess, isLoading, betaInfo };
}

/**
 * Hook pour vérifier si l'onboarding est complété
 * Redirige vers /onboarding si pas complété
 * 
 * @param {Object} options
 * @param {boolean} options.redirect - Si true, redirige automatiquement (défaut: true)
 * @returns {{ isComplete: boolean, isLoading: boolean, userData: Object|null }}
 */
export function useOnboarding({ redirect = true } = {}) {
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = () => {
      try {
        const stored = localStorage.getItem('socrate-onboarding-complete');
        const userDataStored = localStorage.getItem('socrate-user-data');
        
        if (stored) {
          setIsComplete(true);
          if (userDataStored) {
            setUserData(JSON.parse(userDataStored));
          }
        } else if (redirect) {
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Erreur vérification onboarding:', error);
        if (redirect) {
          router.push('/onboarding');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [redirect, router]);

  return { isComplete, isLoading, userData };
}

/**
 * Hook combiné pour vérifier beta + onboarding
 * Utile pour les pages qui nécessitent les deux
 */
export function useAuth({ redirect = true } = {}) {
  const [state, setState] = useState({
    hasBetaAccess: false,
    hasCompletedOnboarding: false,
    isLoading: true,
    userData: null
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Vérifier beta
        const betaAccess = localStorage.getItem('socrate-beta-access');
        if (!betaAccess) {
          if (redirect) router.push('/beta');
          setState(s => ({ ...s, isLoading: false }));
          return;
        }

        // Vérifier onboarding
        const onboardingComplete = localStorage.getItem('socrate-onboarding-complete');
        const userDataStored = localStorage.getItem('socrate-user-data');

        if (!onboardingComplete) {
          if (redirect) router.push('/onboarding');
          setState(s => ({ ...s, hasBetaAccess: true, isLoading: false }));
          return;
        }

        // Tout est OK
        setState({
          hasBetaAccess: true,
          hasCompletedOnboarding: true,
          isLoading: false,
          userData: userDataStored ? JSON.parse(userDataStored) : null
        });
      } catch (error) {
        console.error('Erreur auth:', error);
        if (redirect) router.push('/beta');
        setState(s => ({ ...s, isLoading: false }));
      }
    };

    checkAuth();
  }, [redirect, router]);

  return state;
}
