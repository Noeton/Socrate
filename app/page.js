'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WelcomeScreen from './components/WelcomeScreen';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 1. Vérifier l'accès beta
    const betaAccess = localStorage.getItem('socrate-beta-access');
    if (!betaAccess) {
      router.push('/beta');
      return;
    }

    // 2. Vérifier si onboarding complété
    const onboardingComplete = localStorage.getItem('socrate-onboarding-complete');
    if (!onboardingComplete) {
      router.push('/onboarding');
      return;
    }

    // 3. Si ?menu=true → forcer l'affichage du menu principal
    const forceMenu = searchParams.get('menu') === 'true';
    if (forceMenu) {
      setChecking(false);
      return;
    }

    // 4. Sinon, vérifier le mode préféré (désactivé pour toujours montrer le menu)
    // L'utilisateur peut toujours naviguer via les boutons
    setChecking(false);
  }, [router, searchParams]);

  // Pendant la vérification
  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--slate-50)] flex items-center justify-center">
        <div className="animate-pulse-subtle text-[var(--slate-400)]">
          Chargement...
        </div>
      </div>
    );
  }

  return <WelcomeScreen />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--slate-50)] flex items-center justify-center">
        <div className="animate-pulse-subtle text-[var(--slate-400)]">
          Chargement...
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}