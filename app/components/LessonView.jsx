'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLessonById } from '@/shared/data/learningPath';

export default function LessonView({ lessonId }) {
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [phase, setPhase] = useState('intro'); // intro, practice, success
  const [isGenerating, setIsGenerating] = useState(false);
  const [exercise, setExercise] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [correctionResult, setCorrectionResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = () => {
    const lessonData = getLessonById(lessonId);
    if (!lessonData) {
      console.warn('Leçon non trouvée:', lessonId);
      router.push('/learn');
      return;
    }
    setLesson(lessonData);
  };

  // Sauvegarder la progression
  const saveProgress = (score = null) => {
    try {
      const progress = JSON.parse(localStorage.getItem('socrate-learn-progress') || '{}');
      progress[lessonId] = {
        completed: true,
        completedAt: Date.now(),
        score
      };
      localStorage.setItem('socrate-learn-progress', JSON.stringify(progress));
    } catch (e) {
      console.error('Erreur sauvegarde progression:', e);
    }
  };

  // Aller vers Socrate avec le contexte
  const goToSocrateChat = () => {
    const lessonCompletion = {
      lessonId,
      lessonTitle: lesson?.titre,
      competenceName: lesson?.titre,
      competenceId: lesson?.competenceId,
      success: true,
      score: correctionResult?.score || 10
    };
    
    localStorage.setItem('socrate-lesson-completion', JSON.stringify(lessonCompletion));
    localStorage.setItem('socrate-awaiting-intro', 'true');
    router.push('/ask');
  };

  // Générer un exercice Excel
  const handleGenerateExercise = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const userId = localStorage.getItem('socrate-user-id') || 'anonymous';
      
      const response = await fetch('/api/generate-dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competence: lesson?.titre,
          competenceId: lesson?.competenceId,
          userId,
          type: 'lesson'
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération');
      }
      
      const data = await response.json();
      setExercise(data.exercise);
      
      localStorage.setItem('current-exercise-id', data.exercise.id);
      localStorage.setItem('current-exercise-data', JSON.stringify(data.exercise));
      
    } catch (err) {
      console.error('Erreur génération:', err);
      setError('Impossible de générer l\'exercice. Réessaie ou passe par Socrate.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Télécharger le fichier Excel
  const handleDownload = async () => {
    if (!exercise) return;
    
    try {
      const response = await fetch('/api/generate-exercise-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise })
      });
      
      if (!response.ok) throw new Error('Erreur téléchargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exercise.titre || 'exercice'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      setError('Impossible de télécharger le fichier.');
    }
  };

  // Upload et correction
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('exerciseId', exercise?.id || localStorage.getItem('current-exercise-id'));
      formData.append('userId', localStorage.getItem('socrate-user-id') || 'anonymous');
      
      const exerciseData = exercise || JSON.parse(localStorage.getItem('current-exercise-data') || '{}');
      formData.append('exerciseData', JSON.stringify(exerciseData));
      
      const response = await fetch('/api/correct-exercise', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Erreur correction');
      
      const result = await response.json();
      setCorrectionResult(result);
      
      if (result.success || result.score >= 7) {
        saveProgress(result.score);
        setPhase('success');
      }
      
    } catch (err) {
      console.error('Erreur correction:', err);
      setError('Impossible de corriger le fichier. Vérifie le format.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => router.push('/?menu=true')}
            className="text-xl font-semibold italic text-blue-800"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            Socrate
          </button>
          
          <span className="text-gray-300">|</span>
          
          <button 
            onClick={() => router.push('/learn')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Parcours
          </button>
          
          {/* Barre de progression */}
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: phase === 'intro' ? '33%' : phase === 'practice' ? '66%' : '100%' }}
              />
            </div>
          </div>
          
          <span className="text-sm font-medium text-gray-600">
            {phase === 'intro' && '1/3'}
            {phase === 'practice' && '2/3'}
            {phase === 'success' && '✓'}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {/* PHASE INTRO */}
        {phase === 'intro' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.titre}</h1>
              <p className="text-gray-500">{lesson.objectif}</p>
            </div>

            {/* Explication */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">📖</span> Comment ça marche
              </h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                {lesson.objectif}
              </p>
              
              {/* Syntaxe */}
              {lesson.syntaxe && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>⌨️</span> Syntaxe
                  </h3>
                  <code className="block bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
                    {lesson.syntaxe.formule}
                  </code>
                  
                  {lesson.syntaxe.arguments?.length > 0 && (
                    <div className="space-y-2">
                      {lesson.syntaxe.arguments.map((arg, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <code className={`px-2 py-0.5 rounded ${arg.obligatoire ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                            {arg.nom}
                          </code>
                          <span className="text-gray-600">
                            {arg.description}
                            {!arg.obligatoire && <span className="text-gray-400 ml-1">(optionnel)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Exemples */}
              {lesson.exemples?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>💡</span> Exemples
                  </h3>
                  <div className="space-y-3">
                    {lesson.exemples.map((ex, i) => (
                      <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <code className="bg-white px-3 py-1 rounded border border-gray-200 font-mono text-sm text-gray-800">
                          {ex.formule}
                        </code>
                        <span className="text-sm text-gray-600 pt-1">{ex.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Erreurs fréquentes */}
            {lesson.erreursFrequentes?.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-5 mb-6 border border-red-200">
                <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Erreurs fréquentes
                </h3>
                <ul className="space-y-2">
                  {lesson.erreursFrequentes.map((err, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                      <span className="text-red-500">•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Astuces */}
            {lesson.astuces?.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-5 mb-6 border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <span>✨</span> Astuces pro
                </h3>
                <ul className="space-y-2">
                  {lesson.astuces.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-500">→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Boutons */}
            <div className="space-y-3">
              <button
                onClick={() => setPhase('practice')}
                className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                J'ai compris, passons à la pratique ! 🚀
              </button>
              
              <button
                onClick={goToSocrateChat}
                className="w-full py-3 bg-white text-green-700 font-medium rounded-xl border-2 border-green-200 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
              >
                <span>🎓</span> Passer directement à Socrate
              </button>
            </div>
          </div>
        )}

        {/* PHASE PRACTICE */}
        {phase === 'practice' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">À toi de jouer ! 🎯</h1>
              <p className="text-gray-500">Applique ce que tu viens d'apprendre sur un vrai fichier Excel</p>
            </div>

            {/* Rappel syntaxe */}
            {lesson.syntaxe && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <span className="text-sm text-blue-800">Rappel : </span>
                    <code className="text-sm font-mono text-blue-900 font-medium">
                      {lesson.syntaxe.formule}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Pas encore d'exercice */}
            {!exercise && !isGenerating && (
              <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-200 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="font-bold text-gray-900 mb-2">Prêt à pratiquer ?</h3>
                <p className="text-gray-500 mb-6">
                  Je vais générer un exercice Excel personnalisé.
                </p>
                <button
                  onClick={handleGenerateExercise}
                  className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                  🎲 Générer mon exercice
                </button>
              </div>
            )}

            {/* Génération en cours */}
            {isGenerating && (
              <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin text-5xl mb-4">⚙️</div>
                <h3 className="font-bold text-gray-900 mb-2">Génération en cours...</h3>
                <p className="text-gray-500">Je crée un exercice adapté à ton niveau.</p>
              </div>
            )}

            {/* Exercice prêt */}
            {exercise && !isGenerating && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-2">{exercise.titre}</h3>
                  
                  {exercise.contexte && (
                    <p className="text-gray-600 text-sm mb-4">
                      {typeof exercise.contexte === 'string' ? exercise.contexte : exercise.contexte.situation}
                    </p>
                  )}
                  
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📥</span> Télécharger l'exercice Excel
                  </button>
                </div>

                {/* Zone upload */}
                <div className="bg-gray-100 rounded-2xl p-6 border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="text-4xl mb-3">📤</div>
                    <h3 className="font-bold text-gray-900 mb-2">Exercice terminé ?</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Uploade ton fichier Excel pour correction
                    </p>
                    
                    <label className={`inline-block px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors ${
                      isUploading ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'
                    }`}>
                      {isUploading ? 'Correction en cours...' : '📎 Choisir mon fichier'}
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Résultat correction (si échec) */}
                {correctionResult && !correctionResult.success && correctionResult.score < 7 && (
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                    <h3 className="font-bold text-amber-900 mb-2">Score : {correctionResult.score}/10</h3>
                    <p className="text-amber-800 text-sm mb-3">
                      {correctionResult.feedback || 'Quelques erreurs à corriger.'}
                    </p>
                    <p className="text-sm text-amber-600">Corrige et ré-uploade ton fichier !</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setPhase('intro');
                  setExercise(null);
                  setCorrectionResult(null);
                  setError(null);
                }}
                className="flex-1 py-3 text-gray-500 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                ← Revoir l'explication
              </button>
              
              <button
                onClick={goToSocrateChat}
                className="flex-1 py-3 text-blue-600 text-sm bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors font-medium"
              >
                Passer → Socrate 🎓
              </button>
            </div>
          </div>
        )}

        {/* PHASE SUCCESS */}
        {phase === 'success' && (
          <div className="animate-fadeIn text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl animate-bounce">
                🎉
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Bravo !</h1>
              <p className="text-gray-500">Tu as terminé la leçon "{lesson.titre}"</p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
              <div className="flex justify-center gap-12">
                <div className="text-center">
                  <div className="text-3xl mb-1">🎯</div>
                  <p className="text-2xl font-bold text-gray-900">{correctionResult?.score || 10}/10</p>
                  <p className="text-sm text-gray-500">score</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-1">⭐</div>
                  <p className="text-2xl font-bold text-gray-900">+{lesson.xpReward || 15}</p>
                  <p className="text-sm text-gray-500">XP gagnés</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={goToSocrateChat}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-3"
              >
                <span className="text-xl">🎓</span>
                Continuer avec Socrate
              </button>
              
              <button
                onClick={() => router.push('/learn')}
                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-2xl hover:bg-gray-200 transition-colors"
              >
                ← Retour au parcours
              </button>
            </div>
          </div>
        )}
      </main>

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
