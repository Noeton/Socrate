'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedPage from '../components/ProtectedPage';
import SkillTree from '../components/SkillTree.jsx';
import { PEDAGOGIE } from '@/shared/data/pedagogie';
import { getEnrichedLearningPath } from '@/shared/data/learningPath';

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
              // Convertir les compétences pour utiliser les clés PEDAGOGIE
              const convertedCompetences = convertCompetences(data.profile.competences || {});
              setUserProfile({
                ...data.profile,
                competences: convertedCompetences,
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

  // Convertir les compétences (nom → clé PEDAGOGIE)
  function convertCompetences(competences) {
    const converted = {};
    
    // Créer un mapping nom → clé
    const nomToKey = {};
    Object.entries(PEDAGOGIE).forEach(([key, value]) => {
      nomToKey[value.nom] = key;
      nomToKey[key] = key; // Au cas où c'est déjà une clé
    });
    
    Object.entries(competences).forEach(([nameOrKey, data]) => {
      const key = nomToKey[nameOrKey] || nameOrKey;
      converted[key] = data;
    });
    
    return converted;
  }

  // Construire les compétences depuis les leçons complétées
  function buildCompetencesFromLessons(completedLessons) {
    const competences = {};
    
    const enrichedUnits = getEnrichedLearningPath();
    
    completedLessons.forEach(lessonId => {
      for (const unit of enrichedUnits) {
        const lesson = unit.lessons.find(l => l.id === lessonId);
        if (lesson && lesson.sandboxKey) {
          // Utiliser sandboxKey comme clé de compétence
          const key = lesson.sandboxKey.toUpperCase();
          if (PEDAGOGIE[key]) {
            competences[key] = {
              score: 0.85, // Considéré comme maîtrisé si leçon complétée
              lastPracticed: new Date().toISOString()
            };
          }
        }
      }
    });
    
    return competences;
  }

  const handleStartExercise = (skill) => {
    // Naviguer vers la page du catalogue pour cette compétence
    router.push(`/catalogue/${skill.key.toLowerCase()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--accent-base)] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[var(--slate-500)] text-sm">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header compact */}
      <header className="border-b border-[var(--slate-200)] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/learn')}
            className="inline-flex items-center gap-2 text-[var(--slate-500)] hover:text-[var(--slate-700)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">Parcours</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/catalogue')}
              className="text-sm text-[var(--slate-500)] hover:text-[var(--accent-base)] transition-colors"
            >
              Voir le catalogue
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="pb-12">
        <SkillTree 
          userProfile={userProfile} 
          onStartExercise={handleStartExercise}
          showBackButton={false}
        />
      </main>
    </div>
  );
}