'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Configuration des étapes
const TOTAL_STEPS = 5;

// Options pour le contexte métier
const CONTEXT_OPTIONS = [
  { id: 'student', label: 'Étudiant', description: 'École, université, formation' },
  { id: 'finance', label: 'Finance', description: 'Comptabilité, analyse, audit' },
  { id: 'marketing', label: 'Marketing', description: 'Data, reporting, campagnes' },
  { id: 'rh', label: 'Ressources Humaines', description: 'Paie, effectifs, reporting' },
  { id: 'other', label: 'Autre', description: 'Usage personnel ou autre métier' },
];

// Options pour le niveau
const LEVEL_OPTIONS = [
  { 
    id: 'beginner', 
    label: 'Débutant', 
    description: 'Je découvre Excel',
    detail: 'Formules simples, mise en forme'
  },
  { 
    id: 'intermediate', 
    label: 'Intermédiaire', 
    description: 'Je me débrouille',
    detail: 'RECHERCHEV, tableaux croisés'
  },
  { 
    id: 'advanced', 
    label: 'Avancé', 
    description: 'Je veux aller plus loin',
    detail: 'INDEX/EQUIV, Power Query'
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef(null);

  // Données du formulaire
  const [formData, setFormData] = useState({
    name: '',
    context: '',
    level: '',
  });

  // Vérifier l'accès beta au chargement
  useEffect(() => {
    const betaAccess = localStorage.getItem('socrate-beta-access');
    if (!betaAccess) {
      router.push('/beta');
      return;
    }

    // Vérifier si onboarding déjà fait
    const onboardingDone = localStorage.getItem('socrate-onboarding-complete');
    if (onboardingDone) {
      router.push('/');
    }
  }, [router]);

  // Focus sur l'input quand on arrive à l'étape du prénom
  useEffect(() => {
    if (currentStep === 1 && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [currentStep]);

  // Navigation
  const goToStep = (step) => {
    if (isAnimating || step === currentStep) return;
    
    setDirection(step > currentStep ? 1 : -1);
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentStep(step);
      setTimeout(() => setIsAnimating(false), 50);
    }, 200);
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  // Validation par étape
  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome
      case 1: return formData.name.trim().length >= 2;
      case 2: return formData.context !== '';
      case 3: return formData.level !== '';
      case 4: return true; // Ready
      default: return false;
    }
  };

  // Mise à jour des données
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Sélection avec auto-avance
  const selectOption = (field, value) => {
    updateField(field, value);
    setTimeout(() => nextStep(), 300);
  };

  // Soumission finale
  const handleComplete = () => {
    // Sauvegarder les données
    localStorage.setItem('socrate-user-data', JSON.stringify({
      ...formData,
      completedAt: Date.now()
    }));
    localStorage.setItem('socrate-onboarding-complete', 'true');

    // Rediriger vers l'accueil
    router.push('/');
  };

  // Gérer Entrée sur l'input prénom
  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter' && canProceed()) {
      nextStep();
    }
  };

  // Animation classes
  const getStepAnimation = () => {
    if (isAnimating) {
      return direction === 1 
        ? 'opacity-0 translate-x-8' 
        : 'opacity-0 -translate-x-8';
    }
    return 'opacity-100 translate-x-0';
  };

  // Rendu des étapes
  const renderStep = () => {
    switch (currentStep) {
      // Étape 0: Welcome
      case 0:
        return (
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 text-xs font-medium text-[var(--accent-base)] bg-[var(--accent-base)]/10 rounded-full mb-6">
                Accès bêta
              </span>
              <h1 className="font-display text-3xl font-semibold text-[var(--slate-900)] mb-4">
                Bienvenue sur Socrate
              </h1>
              <p className="text-[var(--slate-500)] text-lg max-w-sm mx-auto leading-relaxed">
                Ton tuteur personnel pour maîtriser Excel, à ton rythme.
              </p>
            </div>

            <button
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--accent-base)] text-white rounded-lg font-medium transition-all duration-250 hover:bg-[var(--accent-dark)] hover:-translate-y-0.5"
            >
              Commencer
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        );

      // Étape 1: Prénom
      case 1:
        return (
          <div>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-semibold text-[var(--slate-900)] mb-2">
                Comment t'appelles-tu ?
              </h2>
              <p className="text-[var(--slate-500)]">
                Pour personnaliser ton expérience
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                onKeyDown={handleNameKeyDown}
                placeholder="Ton prénom"
                autoComplete="given-name"
                className="w-full px-4 py-3.5 rounded-lg border border-[var(--slate-200)] bg-white text-center text-lg transition-all duration-200 placeholder:text-[var(--slate-400)] hover:border-[var(--slate-300)] focus:outline-none focus:border-[var(--accent-base)] focus:ring-2 focus:ring-[var(--accent-base)]/20"
              />

              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`w-full mt-6 py-3.5 rounded-lg font-medium transition-all duration-250 ${
                  canProceed()
                    ? 'bg-[var(--accent-base)] text-white hover:bg-[var(--accent-dark)]'
                    : 'bg-[var(--slate-100)] text-[var(--slate-400)] cursor-not-allowed'
                }`}
              >
                Continuer
              </button>
            </div>
          </div>
        );

      // Étape 2: Contexte
      case 2:
        return (
          <div>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-semibold text-[var(--slate-900)] mb-2">
                Dans quel contexte utilises-tu Excel ?
              </h2>
              <p className="text-[var(--slate-500)]">
                Pour adapter les exercices à ton quotidien
              </p>
            </div>

            <div className="space-y-3 max-w-sm mx-auto">
              {CONTEXT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectOption('context', option.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                    formData.context === option.id
                      ? 'border-[var(--accent-base)] bg-[var(--accent-base)]/5'
                      : 'border-[var(--slate-200)] bg-white hover:border-[var(--slate-300)] hover:bg-[var(--slate-50)]'
                  }`}
                >
                  <div className="font-medium text-[var(--slate-900)]">
                    {option.label}
                  </div>
                  <div className="text-sm text-[var(--slate-500)] mt-0.5">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      // Étape 3: Niveau
      case 3:
        return (
          <div>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-semibold text-[var(--slate-900)] mb-2">
                Quel est ton niveau en Excel ?
              </h2>
              <p className="text-[var(--slate-500)]">
                Pas de jugement, c'est pour bien démarrer
              </p>
            </div>

            <div className="space-y-3 max-w-sm mx-auto">
              {LEVEL_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectOption('level', option.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                    formData.level === option.id
                      ? 'border-[var(--accent-base)] bg-[var(--accent-base)]/5'
                      : 'border-[var(--slate-200)] bg-white hover:border-[var(--slate-300)] hover:bg-[var(--slate-50)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[var(--slate-900)]">
                        {option.label}
                      </div>
                      <div className="text-sm text-[var(--slate-500)] mt-0.5">
                        {option.description}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--slate-400)] ml-4">
                      {option.detail}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      // Étape 4: Ready
      case 4:
        return (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-base)]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--accent-base)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="font-display text-2xl font-semibold text-[var(--slate-900)] mb-3">
                Parfait, {formData.name} !
              </h2>
              <p className="text-[var(--slate-500)] max-w-xs mx-auto leading-relaxed">
                Ton parcours personnalisé est prêt. Tu peux commencer à apprendre dès maintenant.
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--accent-base)] text-white rounded-lg font-medium transition-all duration-250 hover:bg-[var(--accent-dark)] hover:-translate-y-0.5"
            >
              Découvrir Socrate
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--slate-50)] flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[var(--slate-200)] z-50">
        <div 
          className="h-full bg-[var(--accent-base)] transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Header avec bouton retour */}
      <div className="pt-8 px-6">
        <div className="max-w-lg mx-auto">
          {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
            <button
              onClick={prevStep}
              className="inline-flex items-center gap-2 text-[var(--slate-500)] hover:text-[var(--slate-700)] transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Retour</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div 
            className={`transition-all duration-300 ease-out ${getStepAnimation()}`}
          >
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Indicateurs de progression (dots) */}
      <div className="pb-8">
        <div className="flex justify-center gap-2">
          {[...Array(TOTAL_STEPS)].map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-6 bg-[var(--accent-base)]'
                  : index < currentStep
                    ? 'w-1.5 bg-[var(--accent-base)]/40'
                    : 'w-1.5 bg-[var(--slate-300)]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}