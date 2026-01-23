'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedPage from '../components/ProtectedPage';
import AppHeader from '../components/AppHeader';
import SkillTree from '../components/SkillTree';
import { getLessonByCompetenceId, getEnrichedLearningPath } from '@/shared/data/learningPath';

export default function SkillTreePage() {
  return (
    <ProtectedPage>
      <SkillTreeContent />
    </ProtectedPage>
  );
}

function SkillTreeContent() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const userId = localStorage.getItem('socrate-user-id');
        
        // Essayer d'abord l'API Supabase
        if (userId) {
          try {
            const response = await fetch('/api/user-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId })
            });

            const data = await response.json();
            
            if (data.profile) {
              setUserProfile({
                ...data.profile,
                badges: data.badges || []
              });
              setLoading(false);
              return;
            }
          } catch (apiError) {
            console.warn('⚠️ API indisponible, fallback localStorage');
          }
        }

        // Fallback: construire le profil depuis localStorage
        const savedProgress = localStorage.getItem('socrate-learn-progress');
        
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          
          // Construire un profil basique depuis les données locales
          const localProfile = {
            niveau: progress.completedLessons?.length > 15 ? 'avance' : 
                    progress.completedLessons?.length > 5 ? 'intermediaire' : 'debutant',
            total_xp: progress.totalXP || 0,
            streak: progress.streak || 0,
            completed_lessons: progress.completedLessons || [],
            // Mapper les leçons complétées vers des compétences
            competences: buildCompetencesFromLessons(progress.completedLessons || []),
            badges: []
          };
          
          setUserProfile(localProfile);
        } else {
          // Aucune donnée → profil vide mais valide
          setUserProfile({
            niveau: 'debutant',
            total_xp: 0,
            streak: 0,
            completed_lessons: [],
            competences: {},
            badges: []
          });
        }
        
      } catch (error) {
        console.error('❌ Erreur chargement profil:', error);
        setUserProfile({
          niveau: 'debutant',
          total_xp: 0,
          competences: {},
          badges: []
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, []);

  // Construire les compétences depuis les leçons complétées
  function buildCompetencesFromLessons(completedLessons) {
    const competences = {};
    
    // Utiliser le parcours enrichi (avec competenceId)
    const enrichedUnits = getEnrichedLearningPath();
    
    completedLessons.forEach(lessonId => {
      for (const unit of enrichedUnits) {
        const lesson = unit.lessons.find(l => l.id === lessonId);
        if (lesson && lesson.competenceId) {
          competences[lesson.competenceId] = {
            mastery: 70,
            lastPracticed: new Date().toISOString()
          };
        }
      }
    });
    
    return competences;
  }

  const handleStartExercise = (skill) => {
    const lesson = getLessonByCompetenceId(skill.id);
    
    if (lesson) {
      // Rediriger vers le catalogue (plus complet)
      router.push(`/catalogue/${lesson.sandboxKey.toLowerCase()}`);
    } else {
      localStorage.setItem('socrate-pending-skill', JSON.stringify(skill));
      router.push('/ask');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--slate-900)]">
        <AppHeader showBack title="Compétences" />
        <div className="flex items-center justify-center py-20">
          <div className="text-[var(--slate-400)] animate-pulse-subtle">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--slate-900)]">
      {/* Bannière de recommandation vers le catalogue */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="font-medium text-sm">Nouveau : Catalogue des 58 compétences</p>
              <p className="text-xs text-blue-100">Plus complet et mis à jour régulièrement</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/catalogue')}
            className="px-4 py-2 bg-white text-blue-700 font-semibold text-sm rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Voir le catalogue →
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-[var(--slate-200)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/learn')}
            className="inline-flex items-center gap-2 text-[var(--slate-500)] hover:text-[var(--slate-700)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Retour au parcours</span>
          </button>
          <h1 className="font-display text-lg font-semibold text-[var(--slate-900)]">
            Arbre de compétences
          </h1>
          <div className="w-24" /> {/* Spacer pour centrer le titre */}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {userProfile ? (
          <SkillTree 
            userProfile={userProfile} 
            onStartExercise={handleStartExercise}
          />
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--slate-800)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--slate-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-semibold text-white mb-2">
              Ton arbre est vide
            </h2>
            <p className="text-[var(--slate-400)] mb-6 max-w-sm mx-auto">
              Commence le parcours d'apprentissage pour débloquer tes premières compétences.
            </p>
            <button
              onClick={() => router.push('/learn')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-base)] text-white rounded-lg font-medium hover:bg-[var(--accent-dark)] transition-colors"
            >
              Commencer à apprendre
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}