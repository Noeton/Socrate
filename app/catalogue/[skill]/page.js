'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PEDAGOGIE } from '@/shared/data/pedagogie';
import ScreenshotUploader, { useNeedsScreenshot } from '@/app/components/ScreenshotUploader';

export default function SkillPage() {
  const router = useRouter();
  const params = useParams();
  const skillKey = params.skill;
  
  const [phase, setPhase] = useState('learn'); // 'learn' → 'practice' → 'success'
  const [pedagogie, setPedagogie] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exercise, setExercise] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [correctionResult, setCorrectionResult] = useState(null);
  const [error, setError] = useState(null);
  
  // State pour le screenshot (validation visuelle)
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotBase64, setScreenshotBase64] = useState(null);
  
  // Détecter si l'exercice nécessite un screenshot
  const needsScreenshot = useNeedsScreenshot(exercise);
  
  useEffect(() => {
    if (skillKey) {
      const ped = PEDAGOGIE[skillKey.toUpperCase()] || PEDAGOGIE[skillKey];
      setPedagogie(ped || null);
      
      if (!ped) {
        router.push('/catalogue');
      }
    }
  }, [skillKey, router]);

  // Naviguer vers Socrate avec le contexte de la compétence
  const goToSocrateLearn = () => {
    const skillContext = {
      mode: 'learn_competence',
      skillKey: skillKey.toUpperCase(),
      skillName: pedagogie?.nom || skillKey,
      competenceId: pedagogie?.id || null,
      fromCatalogue: true,
      timestamp: Date.now(),
      exerciseCompleted: !!correctionResult,
      exerciseData: exercise ? {
        id: exercise.id,
        titre: exercise.titre,
        niveau: exercise.niveau
      } : null,
      correctionData: correctionResult ? {
        score: correctionResult.score,
        success: correctionResult.success,
        masteryLevel: correctionResult.masteryLevel,
        feedback: correctionResult.feedback,
        errors: correctionResult.errors?.slice(0, 5),
        competencesValidated: correctionResult.competencesValidated,
        checkpointsFailed: correctionResult.checkpointsDetail
          ?.filter(cp => !cp.passed)
          ?.map(cp => ({ id: cp.id, description: cp.description, feedback: cp.feedback }))
          ?.slice(0, 3)
      } : null
    };
    localStorage.setItem('socrate-skill-context', JSON.stringify(skillContext));
    localStorage.setItem('socrate-awaiting-intro', 'true');
    router.push('/ask');
  };
  
  // Sélectionner et préparer un exercice Excel depuis les templates
  const handleGenerateExercise = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const userId = localStorage.getItem('socrate-user-id') || 'anonymous';
      
      const response = await fetch('/api/select-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competenceKey: skillKey.toUpperCase(),
          competenceId: pedagogie?.id,
          userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sélection');
      }
      
      const data = await response.json();
      
      if (!data.found || !data.exercise) {
        throw new Error('Aucun exercice disponible pour cette compétence');
      }
      
      setExercise(data.exercise);
      
      localStorage.setItem('current-exercise-id', data.exercise.id);
      localStorage.setItem('current-exercise-data', JSON.stringify(data.exercise));
      
      if (data.fallback) {
        console.log('⚠️ Exercice fallback utilisé:', data.message);
      }
      
    } catch (err) {
      console.error('Erreur sélection template:', err);
      setError('Impossible de trouver un exercice. Réessaie ou passe par Socrate.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Télécharger le fichier Excel
  const handleDownload = async () => {
    if (!exercise) return;
    
    try {
      const userId = localStorage.getItem('socrate-user-id') || 'anonymous';
      
      const response = await fetch('/api/generate-exercise-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          exerciseId: exercise.id,
          userId
        })
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
      
      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }
      
      const response = await fetch('/api/correct-exercise', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Erreur correction');
      
      const result = await response.json();
      setCorrectionResult(result);
      
      if (result.success || result.score >= 7) {
        const progress = JSON.parse(localStorage.getItem('socrate-skills-progress') || '{}');
        progress[skillKey] = {
          completed: true,
          completedAt: Date.now(),
          score: result.score
        };
        localStorage.setItem('socrate-skills-progress', JSON.stringify(progress));
        
        setPhase('success');
      }
      
    } catch (err) {
      console.error('Erreur correction:', err);
      setError('Impossible de corriger le fichier. Vérifie le format.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Si pas de pédagogie, on attend ou on redirige
  if (!pedagogie) {
    return (
      <div className="min-h-screen bg-[var(--slate-50)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--slate-400)]">Chargement...</div>
      </div>
    );
  }

  const skillName = pedagogie?.nom || skillKey;
  const skillDescription = pedagogie?.description;

  return (
    <div className="min-h-screen bg-[var(--slate-50)]">
      {/* Progress bar - style onboarding */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[var(--slate-200)] z-50">
        <div 
          className="h-full bg-[var(--accent-base)] transition-all duration-500 ease-out"
          style={{ width: phase === 'learn' ? '33%' : phase === 'practice' ? '66%' : '100%' }}
        />
      </div>

      {/* Header */}
      <header className="bg-white border-b border-[var(--slate-200)] sticky top-0 z-40 pt-1">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/?menu=true')}
              className="font-display text-xl font-semibold text-[var(--slate-900)] hover:text-[var(--slate-700)] transition-colors"
            >
              Socrate
            </button>
            
            <span className="text-[var(--slate-300)]">·</span>
            
            <button 
              onClick={() => router.push('/catalogue')}
              className="text-sm text-[var(--slate-500)] hover:text-[var(--slate-700)] transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Catalogue
            </button>
          </div>
          
          <div className="text-sm font-medium text-[var(--slate-500)]">
            {phase === 'learn' && 'Étape 1/3'}
            {phase === 'practice' && 'Étape 2/3'}
            {phase === 'success' && 'Terminé'}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        
        {/* PHASE 1 : APPRENDRE */}
        {phase === 'learn' && (
          <div className="animate-fade-in">
            {/* Titre */}
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl font-semibold text-[var(--slate-900)] mb-3">
                {skillName}
              </h1>
              <p className="text-[var(--slate-500)] text-lg max-w-md mx-auto">
                {skillDescription || 'Découvrons cette fonctionnalité ensemble.'}
              </p>
            </div>

            {/* Syntaxe - Design épuré */}
            {pedagogie?.syntaxe && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-[var(--slate-500)] uppercase tracking-wide mb-3">
                  Syntaxe
                </h2>
                <div className="bg-white rounded-lg border border-[var(--slate-200)] p-5">
                  <code className="block text-[var(--slate-900)] font-mono text-base mb-4">
                    {pedagogie.syntaxe.formule}
                  </code>
                  
                  {pedagogie.syntaxe.arguments?.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-[var(--slate-100)]">
                      {pedagogie.syntaxe.arguments.map((arg, i) => (
                        <div key={i} className="flex items-baseline gap-3 text-sm">
                          <code className={`px-2 py-0.5 rounded font-mono text-xs ${
                            arg.obligatoire 
                              ? 'bg-[var(--accent-base)]/10 text-[var(--accent-dark)]' 
                              : 'bg-[var(--slate-100)] text-[var(--slate-600)]'
                          }`}>
                            {arg.nom}
                          </code>
                          <span className="text-[var(--slate-600)]">
                            {arg.description}
                            {!arg.obligatoire && (
                              <span className="text-[var(--slate-400)] ml-1">(optionnel)</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Exemples */}
            {pedagogie?.exemples && pedagogie.exemples.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-[var(--slate-500)] uppercase tracking-wide mb-3">
                  Exemples
                </h2>
                <div className="space-y-3">
                  {pedagogie.exemples.map((ex, i) => (
                    <div key={i} className="bg-white rounded-lg border border-[var(--slate-200)] p-4 flex items-center gap-4">
                      <code className="bg-[var(--slate-50)] px-3 py-1.5 rounded border border-[var(--slate-200)] font-mono text-sm text-[var(--slate-800)] whitespace-nowrap">
                        {ex.formule}
                      </code>
                      <span className="text-sm text-[var(--slate-600)]">
                        {ex.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Erreurs fréquentes */}
            {pedagogie?.erreursFrequentes && pedagogie.erreursFrequentes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-[var(--slate-500)] uppercase tracking-wide mb-3">
                  Erreurs fréquentes
                </h2>
                <div className="bg-white rounded-lg border border-[var(--slate-200)] p-5">
                  <ul className="space-y-2">
                    {pedagogie.erreursFrequentes.map((err, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[var(--slate-700)]">
                        <span className="text-[var(--error)] mt-0.5">×</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Astuces */}
            {pedagogie?.astuces && pedagogie.astuces.length > 0 && (
              <div className="mb-10">
                <h2 className="text-sm font-medium text-[var(--slate-500)] uppercase tracking-wide mb-3">
                  Astuces
                </h2>
                <div className="bg-[var(--accent-base)]/5 rounded-lg border border-[var(--accent-base)]/20 p-5">
                  <ul className="space-y-2">
                    {pedagogie.astuces.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[var(--slate-700)]">
                        <span className="text-[var(--accent-base)] mt-0.5">→</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {pedagogie.raccourci && (
                    <div className="mt-4 pt-4 border-t border-[var(--accent-base)]/20">
                      <span className="text-sm text-[var(--slate-600)]">
                        Raccourci clavier :{' '}
                        <kbd className="bg-white px-2 py-1 rounded border border-[var(--slate-200)] font-mono text-xs">
                          {pedagogie.raccourci}
                        </kbd>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="space-y-3">
              <button
                onClick={() => setPhase('practice')}
                className="w-full py-4 bg-[var(--accent-base)] text-white font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-all duration-200 hover:-translate-y-0.5"
              >
                Passer à la pratique
              </button>
              
              <button
                onClick={goToSocrateLearn}
                className="w-full py-3 bg-white text-[var(--slate-700)] font-medium rounded-lg border border-[var(--slate-200)] hover:border-[var(--accent-base)] hover:text-[var(--accent-base)] transition-all duration-200"
              >
                Apprendre avec Socrate
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2 : PRATIQUER */}
        {phase === 'practice' && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl font-semibold text-[var(--slate-900)] mb-3">
                À toi de jouer
              </h1>
              <p className="text-[var(--slate-500)] text-lg">
                Applique ce que tu viens d'apprendre sur un vrai fichier Excel
              </p>
            </div>

            {/* Rappel syntaxe */}
            {pedagogie?.syntaxe && (
              <div className="bg-[var(--slate-100)] rounded-lg p-4 mb-8 flex items-center gap-3">
                <span className="text-[var(--slate-500)]">Rappel</span>
                <code className="font-mono text-sm text-[var(--slate-800)]">
                  {pedagogie.syntaxe.formule}
                </code>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="bg-[var(--error)]/10 rounded-lg p-4 mb-6 border border-[var(--error)]/20">
                <p className="text-[var(--error)] text-sm">{error}</p>
              </div>
            )}

            {/* État : pas encore d'exercice généré */}
            {!exercise && !isGenerating && (
              <div className="bg-white rounded-lg border border-[var(--slate-200)] p-10 mb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[var(--slate-100)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--slate-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--slate-900)] mb-2">Prêt à pratiquer ?</h3>
                <p className="text-[var(--slate-500)] mb-6 max-w-sm mx-auto">
                  Je vais générer un exercice Excel personnalisé avec des données réelles.
                </p>
                <button
                  onClick={handleGenerateExercise}
                  className="px-8 py-3.5 bg-[var(--accent-base)] text-white font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-all duration-200"
                >
                  Générer un exercice
                </button>
              </div>
            )}

            {/* État : génération en cours */}
            {isGenerating && (
              <div className="bg-white rounded-lg border border-[var(--slate-200)] p-10 mb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[var(--slate-100)] flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-[var(--slate-400)] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--slate-900)] mb-2">Génération en cours...</h3>
                <p className="text-[var(--slate-500)]">
                  Je crée un exercice adapté à ton niveau.
                </p>
              </div>
            )}

            {/* État : exercice prêt */}
            {exercise && !isGenerating && (
              <div className="space-y-4">
                {/* Carte exercice */}
                <div className="bg-white rounded-lg border border-[var(--slate-200)] p-6">
                  <h3 className="font-display text-lg font-semibold text-[var(--slate-900)] mb-2">
                    {exercise.titre}
                  </h3>
                  
                  {exercise.contexte && (
                    <p className="text-[var(--slate-600)] text-sm mb-4 leading-relaxed">
                      {typeof exercise.contexte === 'string' 
                        ? exercise.contexte 
                        : exercise.contexte.situation}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-[var(--slate-500)] mb-5">
                    <span>{exercise.donnees?.rows?.length || '?'} lignes</span>
                    <span>·</span>
                    <span>{exercise.checkpoints?.length || '?'} questions</span>
                  </div>
                  
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-[var(--accent-base)] text-white font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger l'exercice
                  </button>
                </div>

                {/* Zone upload */}
                <div className="bg-[var(--slate-50)] rounded-lg p-6 border-2 border-dashed border-[var(--slate-300)]">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white border border-[var(--slate-200)] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--slate-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-[var(--slate-900)] mb-1">Exercice terminé ?</h3>
                    <p className="text-[var(--slate-500)] text-sm mb-4">
                      Uploade ton fichier Excel pour correction
                    </p>
                    
                    <label className={`inline-block px-6 py-3 rounded-lg font-medium cursor-pointer transition-all duration-200 ${
                      isUploading 
                        ? 'bg-[var(--slate-200)] text-[var(--slate-500)]' 
                        : 'bg-[var(--accent-base)] text-white hover:bg-[var(--accent-dark)]'
                    }`}>
                      {isUploading ? 'Correction en cours...' : 'Choisir mon fichier'}
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    
                    {/* Upload de screenshot pour validation visuelle */}
                    {needsScreenshot && (
                      <div className="mt-6 pt-6 border-t border-[var(--slate-300)]">
                        <p className="text-sm text-[var(--slate-600)] mb-3">
                          Cet exercice inclut des éléments visuels (graphique, MFC, TCD)
                        </p>
                        <ScreenshotUploader
                          required={true}
                          hint="Capture d'écran de ton graphique ou mise en forme"
                          onScreenshotChange={(file, base64) => {
                            setScreenshotFile(file);
                            setScreenshotBase64(base64);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Résultat correction (si pas réussi) */}
                {correctionResult && !correctionResult.success && correctionResult.score < 7 && (
                  <div className="bg-[var(--error)]/5 rounded-lg p-5 border border-[var(--error)]/20">
                    <h3 className="font-medium text-[var(--slate-900)] mb-2">
                      Score : {correctionResult.score}/10
                    </h3>
                    <p className="text-[var(--slate-600)] text-sm mb-3">
                      {correctionResult.feedback || 'Quelques erreurs à corriger.'}
                    </p>
                    
                    {correctionResult.needs_screenshot && (
                      <div className="bg-white rounded-lg p-3 mb-3">
                        <p className="text-sm text-[var(--slate-700)]">
                          <strong>Éléments visuels non vérifiés</strong> — Ajoute une capture d'écran.
                        </p>
                      </div>
                    )}
                    
                    {correctionResult.errors?.length > 0 && (
                      <ul className="space-y-1">
                        {correctionResult.errors.slice(0, 3).map((err, i) => (
                          <li key={i} className="text-sm text-[var(--slate-600)]">
                            · {err.description || err.probleme || 'Erreur détectée'}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-sm text-[var(--slate-500)] mt-3">
                      Corrige et ré-uploade ton fichier.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Boutons navigation */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setPhase('learn');
                  setExercise(null);
                  setCorrectionResult(null);
                  setError(null);
                }}
                className="flex-1 py-3 text-[var(--slate-600)] hover:text-[var(--slate-800)] text-sm bg-white rounded-lg border border-[var(--slate-200)] hover:border-[var(--slate-300)] transition-all duration-200"
              >
                ← Revoir l'explication
              </button>
              
              <button
                onClick={goToSocrateLearn}
                className="flex-1 py-3 text-[var(--accent-base)] hover:text-[var(--accent-dark)] text-sm bg-[var(--accent-base)]/10 rounded-lg hover:bg-[var(--accent-base)]/15 transition-all duration-200 font-medium"
              >
                Passer à Socrate →
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3 : SUCCÈS */}
        {phase === 'success' && (
          <div className="animate-fade-in text-center">
            <div className="mb-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-base)]/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--accent-base)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-semibold text-[var(--slate-900)] mb-3">
                Bravo !
              </h1>
              <p className="text-[var(--slate-500)] text-lg">
                Tu maîtrises maintenant <strong>{skillName}</strong>
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg border border-[var(--slate-200)] p-8 mb-8">
              <div className="flex justify-center gap-12">
                <div className="text-center">
                  <p className="text-4xl font-display font-semibold text-[var(--slate-900)] mb-1">
                    {correctionResult?.score || 10}/10
                  </p>
                  <p className="text-sm text-[var(--slate-500)]">score</p>
                </div>
                {correctionResult?.score === 10 && (
                  <div className="text-center">
                    <p className="text-4xl font-display font-semibold text-[var(--accent-base)] mb-1">
                      Perfect
                    </p>
                    <p className="text-sm text-[var(--slate-500)]">sans erreur</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ce qu'il faut retenir */}
            {pedagogie?.astuces?.[0] && (
              <div className="bg-[var(--accent-base)]/5 rounded-lg p-5 mb-8 text-left border border-[var(--accent-base)]/20">
                <h3 className="font-medium text-[var(--slate-900)] mb-2">
                  À retenir
                </h3>
                <p className="text-[var(--slate-600)] text-sm">
                  {pedagogie.astuces[0]}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={goToSocrateLearn}
                className="w-full py-4 bg-[var(--accent-base)] text-white font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-all duration-200 hover:-translate-y-0.5"
              >
                Continuer avec Socrate
              </button>
              
              <button
                onClick={() => router.push('/catalogue')}
                className="w-full py-3 bg-white text-[var(--slate-700)] font-medium rounded-lg border border-[var(--slate-200)] hover:border-[var(--accent-base)] hover:text-[var(--accent-base)] transition-all duration-200"
              >
                Retour au catalogue
              </button>
              
              <button
                onClick={() => {
                  setPhase('practice');
                  setExercise(null);
                  setCorrectionResult(null);
                  setError(null);
                }}
                className="w-full py-3 text-[var(--accent-base)] hover:text-[var(--accent-dark)] transition-colors"
              >
                Refaire un exercice
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}