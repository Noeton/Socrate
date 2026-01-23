'use client';

import { useState } from 'react';

/**
 * Composant de transition après réussite de la sandbox
 * Propose à l'utilisateur de continuer avec un exercice Excel réel
 */
export default function LessonTransition({
  lesson,
  onContinueToExcel,
  onSkipToNext,
  xpEarned = 0
}) {
  const [choice, setChoice] = useState(null);

  const hasExercise = !!lesson?.exerciseId;

  return (
    <div className="lesson-transition animate-fadeIn">
      {/* Célébration */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl animate-bounce">
          🎉
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sandbox réussie !
        </h2>
        <p className="text-gray-500">
          Tu maîtrises la syntaxe de base. Prêt pour un vrai défi ?
        </p>
      </div>

      {/* XP gagnés */}
      <div className="bg-yellow-50 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">⭐</span>
        <div>
          <p className="text-yellow-700 font-bold text-lg">+{xpEarned} XP</p>
          <p className="text-yellow-600 text-sm">pour la sandbox</p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {hasExercise && (
          <button
            onClick={onContinueToExcel}
            className="w-full group bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-left text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📊
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">
                  Pratiquer sur Excel réel
                </h3>
                <p className="text-blue-100 text-sm">
                  Télécharge un exercice complet • +{Math.round(xpEarned * 1.5)} XP bonus
                </p>
              </div>
              <svg className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}

        <button
          onClick={onSkipToNext}
          className="w-full group bg-white rounded-2xl border-2 border-gray-200 p-5 text-left hover:border-green-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-green-100 transition-colors">
              ⏭️
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                Passer à la leçon suivante
              </h3>
              <p className="text-gray-500 text-sm">
                Continuer le parcours
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Info */}
      {hasExercise && (
        <p className="text-center text-gray-400 text-sm mt-6">
          💡 L'exercice Excel permet de valider tes compétences sur des données réelles
        </p>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}