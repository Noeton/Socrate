'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from './AppHeader';
import { getLegacyLearningUnits, getUnitProgress, getNextLesson, getTotalPossibleXP } from '@/shared/data/learningPath';

// Configuration du skip par niveau
const SKIP_CONFIG = {
  intermediate: {
    startUnit: 5, // Unité "Conditions avancées"
    skipUnits: [1, 2, 3, 4],
    description: "Tu connais déjà SOMME, MOYENNE, SI, les bases du formatage..."
  },
  advanced: {
    startUnit: 8, // Unité "Recherches avancées"
    skipUnits: [1, 2, 3, 4, 5, 6, 7],
    description: "Tu maîtrises RECHERCHEV, les TCD, les conditions avancées..."
  }
};

export default function LearnDashboard() {
  const router = useRouter();
  
  // Charger LEARNING_UNITS une seule fois côté client
  const LEARNING_UNITS = useMemo(() => getLegacyLearningUnits(), []);
  
  const [userProgress, setUserProgress] = useState({
    completedLessons: [],
    totalXP: 0,
    streak: 0
  });
  const [loading, setLoading] = useState(true);
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // États pour le skip de niveau
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipInfo, setSkipInfo] = useState(null);

  useEffect(() => {
    // Charger les données utilisateur
    const stored = localStorage.getItem('socrate-user-data');
    if (stored) {
      const parsedData = JSON.parse(stored);
      setUserData(parsedData);
      
      // Vérifier si on doit proposer le skip
      checkSkipOffer(parsedData);
    }
    loadProgress();
  }, []);

  // Vérifie si on doit proposer le skip
  const checkSkipOffer = (userData) => {
    const skipOffered = localStorage.getItem('socrate-skip-offered');
    const savedProgress = localStorage.getItem('socrate-learn-progress');
    const hasProgress = savedProgress && JSON.parse(savedProgress).completedLessons?.length > 0;
    
    // Proposer le skip si niveau intermédiaire/avancé, pas de progression, et pas déjà proposé
    if (
      (userData?.level === 'intermediate' || userData?.level === 'advanced') &&
      !hasProgress &&
      !skipOffered
    ) {
      const config = SKIP_CONFIG[userData.level];
      const lessonsToSkip = [];
      
      config.skipUnits.forEach(unitId => {
        const unit = LEARNING_UNITS.find(u => u.id === unitId);
        if (unit) {
          unit.lessons.forEach(lesson => lessonsToSkip.push(lesson.id));
        }
      });
      
      const targetUnit = LEARNING_UNITS.find(u => u.id === config.startUnit);
      
      setSkipInfo({
        level: userData.level,
        lessonsToSkip,
        skipCount: lessonsToSkip.length,
        targetUnit: targetUnit?.titre || 'Niveau intermédiaire',
        description: config.description,
        startUnitId: config.startUnit
      });
      setShowSkipModal(true);
    }
  };

  // Accepter le skip
  const handleAcceptSkip = () => {
    if (!skipInfo) return;
    
    // Calculer les XP (30% des XP des leçons sautées)
    const xpGained = skipInfo.lessonsToSkip.reduce((total, lessonId) => {
      for (const unit of LEARNING_UNITS) {
        const lesson = unit.lessons.find(l => l.id === lessonId);
        if (lesson) return total + Math.round(lesson.xpReward * 0.3);
      }
      return total;
    }, 0);
    
    const newProgress = {
      completedLessons: skipInfo.lessonsToSkip,
      totalXP: xpGained,
      streak: 0,
      skippedBasics: true
    };
    
    localStorage.setItem('socrate-learn-progress', JSON.stringify(newProgress));
    localStorage.setItem('socrate-skip-offered', 'accepted');
    
    setUserProgress(newProgress);
    setShowSkipModal(false);
    setExpandedUnit(skipInfo.startUnitId);
  };

  // Refuser le skip
  const handleDeclineSkip = () => {
    localStorage.setItem('socrate-skip-offered', 'declined');
    setShowSkipModal(false);
    setExpandedUnit(1);
  };

  const loadProgress = async () => {
    try {
      let userId = localStorage.getItem('socrate-user-id');
      
      if (!userId) {
        const response = await fetch('/api/session');
        const data = await response.json();
        if (data.userId) {
          userId = data.userId;
          localStorage.setItem('socrate-user-id', userId);
        }
      }

      // Essayer de charger depuis l'API (Supabase)
      try {
        const apiResponse = await fetch(`/api/learn-progress?userId=${userId}`);
        const apiData = await apiResponse.json();
        
        if (apiData.progress) {
          const progressData = {
            completedLessons: apiData.progress.completed_lessons || [],
            totalXP: apiData.progress.total_xp || 0,
            streak: apiData.progress.streak || 0
          };
          
          setUserProgress(progressData);
          
          localStorage.setItem('socrate-learn-progress', JSON.stringify(progressData));
          
          const nextLesson = getNextLesson(progressData.completedLessons);
          if (nextLesson) {
            setExpandedUnit(nextLesson.unit.id);
          } else {
            setExpandedUnit(1);
          }
          
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ API indisponible, fallback localStorage');
      }

      // Fallback: charger depuis localStorage
      const saved = localStorage.getItem('socrate-learn-progress');
      if (saved) {
        const parsedProgress = JSON.parse(saved);
        setUserProgress(parsedProgress);
        
        const nextLesson = getNextLesson(parsedProgress.completedLessons);
        if (nextLesson) {
          setExpandedUnit(nextLesson.unit.id);
        }
      } else {
        setExpandedUnit(1);
      }
      
    } catch (error) {
      console.error('Erreur chargement:', error);
      setExpandedUnit(1);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = (lessonId) => {
    // Trouver la leçon pour obtenir sa competenceKey
    const lesson = LEARNING_UNITS
      .flatMap(u => u.lessons)
      .find(l => l.id === lessonId);
    
    if (lesson?.sandboxKey) {
      // Rediriger vers le catalogue (plus robuste, gère tous les cas)
      router.push(`/catalogue/${lesson.sandboxKey.toLowerCase()}`);
    } else {
      // Fallback vers l'ancienne route
      router.push(`/learn/lesson/${lessonId}`);
    }
  };

  const handleToggleUnit = (unitId) => {
    setExpandedUnit(expandedUnit === unitId ? null : unitId);
  };

  const nextLesson = getNextLesson(userProgress.completedLessons);
  const totalPossibleXP = getTotalPossibleXP();
  const progressPercent = Math.round(((userProgress.totalXP || 0) / totalPossibleXP) * 100) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--slate-50)] flex items-center justify-center">
        <div className="animate-pulse-subtle text-[var(--slate-400)]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--slate-50)]">
      <AppHeader />

      {/* Bannière de recommandation vers le catalogue */}
      <div className="bg-[var(--accent-base)]">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <p className="text-sm text-white/90">Catalogue : 58 compétences disponibles</p>
          </div>
          <button
            onClick={() => router.push('/catalogue')}
            className="px-3 py-1.5 bg-white/20 text-white text-sm font-medium rounded-md hover:bg-white/30 transition-colors whitespace-nowrap"
          >
            Voir →
          </button>
        </div>
      </div>

      {/* Modal de skip pour niveaux intermédiaire/avancé */}
      {showSkipModal && skipInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-base)]/10 flex items-center justify-center text-3xl">
                🚀
              </div>
              <h2 className="text-xl font-semibold text-[var(--slate-900)] mb-2">
                Tu es niveau {skipInfo.level === 'advanced' ? 'avancé' : 'intermédiaire'} !
              </h2>
              <p className="text-[var(--slate-500)]">
                {skipInfo.description}
              </p>
            </div>

            <div className="bg-[var(--slate-50)] rounded-xl p-4 mb-6">
              <p className="text-sm text-[var(--slate-600)] mb-2">
                <span className="font-medium">Proposition :</span> Sauter les {skipInfo.skipCount} leçons de base et commencer directement par :
              </p>
              <p className="text-[var(--accent-base)] font-semibold">
                &quot;{skipInfo.targetUnit}&quot;
              </p>
              <p className="text-xs text-[var(--slate-400)] mt-2">
                💡 Tu pourras toujours revenir aux bases si besoin
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAcceptSkip}
                className="w-full py-3 bg-[var(--accent-base)] text-white font-medium rounded-xl hover:bg-[var(--accent-dark)] transition-colors"
              >
                Oui, sauter les bases →
              </button>
              <button
                onClick={handleDeclineSkip}
                className="w-full py-3 bg-[var(--slate-100)] text-[var(--slate-700)] font-medium rounded-xl hover:bg-[var(--slate-200)] transition-colors"
              >
                Non, je préfère tout faire
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Salutation personnalisée */}
        {userData?.name && (
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-[var(--slate-900)]">
              Bonjour, {userData.name}
            </h1>
            <p className="text-[var(--slate-500)] mt-1">
              {nextLesson ? 'Prêt à continuer ?' : 'Bravo pour ta progression !'}
            </p>
          </div>
        )}

        {/* Carte progression globale */}
        <div className="bg-white rounded-xl border border-[var(--slate-200)] p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-[var(--slate-500)]">Progression globale</p>
              <p className="text-2xl font-semibold text-[var(--slate-900)]">{progressPercent}%</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-[var(--slate-400)]">Leçons</p>
                <p className="font-medium text-[var(--slate-700)]">
                  {userProgress.completedLessons.length}/{LEARNING_UNITS.reduce((t, u) => t + u.lessons.length, 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--slate-400)]">XP</p>
                <p className="font-medium text-[var(--accent-base)]">{userProgress.totalXP}</p>
              </div>
            </div>
          </div>
          <div className="h-1.5 bg-[var(--slate-100)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent-base)] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Prochaine leçon recommandée */}
        {nextLesson && (
          <button
            onClick={() => handleStartLesson(nextLesson.id)}
            className="w-full bg-white border border-[var(--slate-200)] rounded-xl p-5 mb-6 text-left hover:border-[var(--accent-base)] hover:shadow-[var(--shadow-md)] transition-all duration-250 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--accent-base)]/10 flex items-center justify-center text-xl group-hover:bg-[var(--accent-base)]/20 transition-colors">
                {nextLesson.unit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--accent-base)] mb-0.5">Continuer</p>
                <p className="font-semibold text-[var(--slate-900)] truncate">{nextLesson.titre}</p>
                <div className="flex items-center gap-3 text-xs text-[var(--slate-500)] mt-1">
                  <span>{nextLesson.duration}</span>
                  <span>•</span>
                  <span>+{nextLesson.xpReward} XP</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--accent-base)] flex items-center justify-center text-white group-hover:bg-[var(--accent-dark)] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Liste des unités */}
        <div className="space-y-3">
          {LEARNING_UNITS.map((unit) => {
            const progress = getUnitProgress(unit.id, userProgress.completedLessons);
            const isExpanded = expandedUnit === unit.id;
            const isCompleted = progress.percentage === 100;

            return (
              <div 
                key={unit.id}
                className="rounded-xl overflow-hidden transition-all duration-250 bg-white border border-[var(--slate-200)]"
              >
                {/* Header de l'unité */}
                <button
                  onClick={() => handleToggleUnit(unit.id)}
                  className="w-full p-4 flex items-center gap-4 text-left transition-colors hover:bg-[var(--slate-50)]"
                >
                  <div 
                    className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl ${
                      isCompleted 
                        ? 'bg-[var(--accent-base)]/10' 
                        : 'bg-[var(--slate-100)]'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5 text-[var(--accent-base)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{unit.icon}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--slate-900)]">
                      {unit.titre}
                    </h3>
                    <p className="text-sm text-[var(--slate-500)] truncate">{unit.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--slate-500)]">
                      {progress.completed}/{progress.total}
                    </span>
                    <svg 
                      className={`w-5 h-5 text-[var(--slate-400)] transition-transform duration-250 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Liste des leçons (expandable) */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {unit.lessons.map((lesson, index) => {
                      const isLessonCompleted = userProgress.completedLessons.includes(lesson.id);
                      const isCurrentLesson = nextLesson?.id === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleStartLesson(lesson.id)}
                          className={`w-full p-3 rounded-lg flex items-center gap-3 text-left transition-all duration-200 ${
                            isCurrentLesson
                              ? 'bg-[var(--accent-base)]/5 border border-[var(--accent-base)]/30'
                              : isLessonCompleted
                              ? 'bg-[var(--slate-50)]'
                              : 'bg-[var(--slate-50)] hover:bg-[var(--slate-100)]'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isLessonCompleted
                              ? 'bg-[var(--accent-base)] text-white'
                              : isCurrentLesson
                              ? 'bg-[var(--accent-base)] text-white'
                              : 'bg-[var(--slate-200)] text-[var(--slate-600)]'
                          }`}>
                            {isLessonCompleted ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              index + 1
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium text-sm ${isLessonCompleted ? 'text-[var(--slate-500)]' : 'text-[var(--slate-900)]'}`}>
                                {lesson.titre}
                              </p>
                              {lesson.requiresExcel && (
                                <span className="px-1.5 py-0.5 bg-[var(--accent-base)]/10 text-[var(--accent-dark)] text-[10px] font-semibold rounded">
                                  Excel
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--slate-400)]">
                              <span>{lesson.duration}</span>
                              <span>•</span>
                              <span>+{lesson.xpReward} XP</span>
                            </div>
                          </div>
                          
                          {isCurrentLesson && (
                            <span className="px-2 py-0.5 bg-[var(--accent-base)] text-white text-xs font-medium rounded">
                              Suivant
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/skill-tree')}
            className="text-sm text-[var(--slate-500)] hover:text-[var(--slate-700)] transition-colors"
          >
            Voir l'arbre de compétences →
          </button>
        </div>
      </main>
    </div>
  );
}