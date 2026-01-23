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
  
  // CORRECTION BUG 4: State pour le screenshot (validation visuelle)
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotBase64, setScreenshotBase64] = useState(null);
  
  // CORRECTION BUG 4: Détecter si l'exercice nécessite un screenshot
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
  // CORRECTION BUG 3: Inclure les données de l'exercice et de la correction si disponibles
  const goToSocrateLearn = () => {
    const skillContext = {
      mode: 'learn_competence',
      skillKey: skillKey.toUpperCase(),
      skillName: pedagogie?.nom || skillKey,
      competenceId: pedagogie?.id || null,
      fromCatalogue: true,
      timestamp: Date.now(),
      // CORRECTION BUG 3: Ajouter les données d'exercice si disponibles
      exerciseCompleted: !!correctionResult,
      exerciseData: exercise ? {
        id: exercise.id,
        titre: exercise.titre,
        niveau: exercise.niveau
      } : null,
      // CORRECTION BUG 3: Ajouter les résultats de correction si disponibles
      correctionData: correctionResult ? {
        score: correctionResult.score,
        success: correctionResult.success,
        masteryLevel: correctionResult.masteryLevel,
        feedback: correctionResult.feedback,
        errors: correctionResult.errors?.slice(0, 5), // Limiter à 5 erreurs
        competencesValidated: correctionResult.competencesValidated,
        checkpointsFailed: correctionResult.checkpointsDetail
          ?.filter(cp => !cp.passed)
          ?.map(cp => ({ id: cp.id, description: cp.description, feedback: cp.feedback }))
          ?.slice(0, 3) // Limiter à 3 checkpoints échoués
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
      
      // CORRECTION BUG 1: Utiliser select-template au lieu de generate-dynamic
      // Cela utilise les 76 templates pré-validés au lieu de générer avec Claude
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
      
      // Stocker l'exercice complet pour la correction (avec checkpoints)
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
      
      // CORRECTION BUG 4: Ajouter le screenshot si présent
      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
        console.log('📷 [CATALOGUE] Screenshot ajouté à la correction');
      } else if (needsScreenshot) {
        console.log('⚠️ [CATALOGUE] Screenshot requis mais non fourni');
      }
      
      const response = await fetch('/api/correct-exercise', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Erreur correction');
      
      const result = await response.json();
      setCorrectionResult(result);
      
      // Si réussi, passer à la phase success
      if (result.success || result.score >= 7) {
        // Sauvegarder la progression
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Chargement...</div>
      </div>
    );
  }

  const skillName = pedagogie?.nom || skillKey;
  const skillDescription = pedagogie?.description;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => router.push('/?menu=true')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-xl font-semibold italic text-blue-800" style={{ fontFamily: "'Source Serif 4', 'Playfair Display', Georgia, serif" }}>Socrate</span>
          </button>
          
          <span className="text-slate-300">|</span>
          
          <button 
            onClick={() => router.push('/catalogue')}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Catalogue
          </button>
          
          {/* Barre de progression */}
          <div className="flex-1">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: phase === 'learn' ? '33%' : phase === 'practice' ? '66%' : '100%' }}
              />
            </div>
          </div>
          
          <div className="text-sm font-medium text-slate-600">
            {phase === 'learn' && '1/3'}
            {phase === 'practice' && '2/3'}
            {phase === 'success' && '✓'}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {/* PHASE 1 : APPRENDRE */}
        {phase === 'learn' && (
          <div className="animate-fadeIn">
            {/* Titre */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {skillName}
              </h1>
              <p className="text-slate-500">
                {skillDescription || 'Découvrons cette fonctionnalité ensemble.'}
              </p>
            </div>

            {/* Explication principale */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-xl">📖</span> 
                Comment ça marche
              </h2>
              
              <p className="text-slate-700 mb-6 leading-relaxed">
                {pedagogie?.description || 'Découvrons cette fonctionnalité ensemble.'}
              </p>
              
              {/* Syntaxe */}
              {pedagogie?.syntaxe && (
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span>⌨️</span> Syntaxe
                  </h3>
                  <code className="block bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
                    {pedagogie.syntaxe.formule}
                  </code>
                  
                  {pedagogie.syntaxe.arguments?.length > 0 && (
                    <div className="space-y-2">
                      {pedagogie.syntaxe.arguments.map((arg, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <code className={`px-2 py-0.5 rounded ${arg.obligatoire ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
                            {arg.nom}
                          </code>
                          <span className="text-slate-600">
                            {arg.description}
                            {!arg.obligatoire && <span className="text-slate-400 ml-1">(optionnel)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Exemples */}
              {pedagogie?.exemples && pedagogie.exemples.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span>💡</span> Exemples
                  </h3>
                  <div className="space-y-3">
                    {pedagogie.exemples.map((ex, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                        <code className="bg-white px-3 py-1 rounded border border-slate-200 font-mono text-sm text-slate-800 whitespace-nowrap">
                          {ex.formule}
                        </code>
                        <span className="text-sm text-slate-600 pt-1">
                          {ex.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Erreurs fréquentes */}
            {pedagogie?.erreursFrequentes && pedagogie.erreursFrequentes.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-5 mb-6 border border-red-200">
                <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Erreurs fréquentes à éviter
                </h3>
                <ul className="space-y-2">
                  {pedagogie.erreursFrequentes.map((err, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Astuces */}
            {pedagogie?.astuces && pedagogie.astuces.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-5 mb-6 border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <span>✨</span> Astuces pro
                </h3>
                <ul className="space-y-2">
                  {pedagogie.astuces.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-500 mt-0.5">→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                
                {pedagogie.raccourci && (
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <span className="text-sm text-amber-700">
                      <strong>Raccourci clavier :</strong>{' '}
                      <kbd className="bg-white px-2 py-1 rounded border border-amber-300 font-mono text-xs">
                        {pedagogie.raccourci}
                      </kbd>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="space-y-3">
              <button
                onClick={() => setPhase('practice')}
                className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                J'ai compris, passons à la pratique ! 🚀
              </button>
              
              <button
                onClick={goToSocrateLearn}
                className="w-full py-3 bg-white text-green-700 font-medium rounded-xl border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all flex items-center justify-center gap-2"
              >
                <span>🎓</span>
                Ou apprendre directement avec Socrate
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2 : PRATIQUER */}
        {phase === 'practice' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                À toi de jouer ! 🎯
              </h1>
              <p className="text-slate-500">
                Applique ce que tu viens d'apprendre sur un vrai fichier Excel
              </p>
            </div>

            {/* Rappel rapide de la syntaxe */}
            {pedagogie?.syntaxe && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <span className="text-sm text-blue-800">Rappel : </span>
                    <code className="text-sm font-mono text-blue-900 font-medium">
                      {pedagogie.syntaxe.formule}
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

            {/* État : pas encore d'exercice généré */}
            {!exercise && !isGenerating && (
              <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-slate-200 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="font-bold text-slate-900 mb-2">Prêt à pratiquer ?</h3>
                <p className="text-slate-500 mb-6">
                  Je vais générer un exercice Excel personnalisé avec des données réelles.
                </p>
                <button
                  onClick={handleGenerateExercise}
                  className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                  🎲 Générer mon exercice
                </button>
              </div>
            )}

            {/* État : génération en cours */}
            {isGenerating && (
              <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-slate-200 text-center">
                <div className="animate-spin text-5xl mb-4">⚙️</div>
                <h3 className="font-bold text-slate-900 mb-2">Génération en cours...</h3>
                <p className="text-slate-500">
                  Je crée un exercice avec des données adaptées à ton niveau.
                </p>
              </div>
            )}

            {/* État : exercice prêt */}
            {exercise && !isGenerating && (
              <div className="space-y-4">
                {/* Carte exercice */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-2">{exercise.titre}</h3>
                  
                  {exercise.contexte && (
                    <p className="text-slate-600 text-sm mb-4">
                      {typeof exercise.contexte === 'string' 
                        ? exercise.contexte 
                        : exercise.contexte.situation}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <span>📊 {exercise.donnees?.rows?.length || '?'} lignes</span>
                    <span>❓ {exercise.checkpoints?.length || '?'} questions</span>
                  </div>
                  
                  {/* Bouton télécharger */}
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📥</span> Télécharger l'exercice Excel
                  </button>
                </div>

                {/* Zone upload */}
                <div className="bg-slate-100 rounded-2xl p-6 border-2 border-dashed border-slate-300">
                  <div className="text-center">
                    <div className="text-4xl mb-3">📤</div>
                    <h3 className="font-bold text-slate-900 mb-2">Exercice terminé ?</h3>
                    <p className="text-slate-500 text-sm mb-4">
                      Uploade ton fichier Excel complété pour correction
                    </p>
                    
                    <label className={`inline-block px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors ${
                      isUploading 
                        ? 'bg-slate-300 text-slate-500' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}>
                      {isUploading ? 'Correction en cours...' : '📎 Choisir mon fichier Excel'}
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    
                    {/* CORRECTION BUG 4: Upload de screenshot pour validation visuelle */}
                    {needsScreenshot && (
                      <div className="mt-6 pt-6 border-t border-slate-300">
                        <p className="text-sm text-slate-600 mb-3 flex items-center justify-center gap-2">
                          <span>📷</span>
                          <span>Cet exercice inclut des <strong>éléments visuels</strong> (graphique, MFC, TCD)</span>
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
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                    <h3 className="font-bold text-amber-900 mb-2">
                      Score : {correctionResult.score}/10
                    </h3>
                    <p className="text-amber-800 text-sm mb-3">
                      {correctionResult.feedback || 'Quelques erreurs à corriger.'}
                    </p>
                    
                    {/* CORRECTION BUG 4: Message si screenshot manquant */}
                    {correctionResult.needs_screenshot && (
                      <div className="bg-orange-100 rounded-lg p-3 mb-3 text-left">
                        <p className="text-sm text-orange-800 font-medium">
                          📷 <strong>Éléments visuels non vérifiés</strong>
                        </p>
                        <p className="text-xs text-orange-700 mt-1">
                          Ajoute une capture d'écran pour valider tes graphiques ou ta mise en forme conditionnelle.
                        </p>
                      </div>
                    )}
                    
                    {correctionResult.errors?.length > 0 && (
                      <ul className="space-y-1">
                        {correctionResult.errors.slice(0, 3).map((err, i) => (
                          <li key={i} className="text-sm text-amber-700">
                            • {err.description || err.probleme || 'Erreur détectée'}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-sm text-amber-600 mt-3">
                      Corrige et ré-uploade ton fichier !
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Boutons navigation */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setPhase('learn');
                  setExercise(null);
                  setCorrectionResult(null);
                  setError(null);
                }}
                className="flex-1 py-3 text-slate-500 hover:text-slate-700 text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                ← Revoir l'explication
              </button>
              
              <button
                onClick={goToSocrateLearn}
                className="flex-1 py-3 text-blue-600 hover:text-blue-700 text-sm bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors font-medium"
              >
                Passer → Socrate 🎓
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3 : SUCCÈS */}
        {phase === 'success' && (
          <div className="animate-fadeIn text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl animate-bounce">
                🎉
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Bravo !</h1>
              <p className="text-slate-500">Tu maîtrises maintenant {skillName}</p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-200">
              <div className="flex justify-center gap-12">
                <div className="text-center">
                  <div className="text-3xl mb-1">🎯</div>
                  <p className="text-2xl font-bold text-slate-900">
                    {correctionResult?.score || 10}/10
                  </p>
                  <p className="text-sm text-slate-500">score</p>
                </div>
                {correctionResult?.score === 10 && (
                  <div className="text-center">
                    <div className="text-3xl mb-1">🏆</div>
                    <p className="text-2xl font-bold text-purple-600">Perfect</p>
                    <p className="text-sm text-slate-500">sans erreur !</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ce qu'il faut retenir */}
            {pedagogie?.astuces?.[0] && (
              <div className="bg-blue-50 rounded-2xl p-5 mb-6 text-left border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span>📝</span> À retenir
                </h3>
                <p className="text-blue-800">
                  {pedagogie.astuces[0]}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={goToSocrateLearn}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-3"
              >
                <span className="text-xl">🎓</span>
                Continuer avec Socrate
              </button>
              
              <button
                onClick={() => router.push('/catalogue')}
                className="w-full py-3 bg-slate-100 text-slate-700 font-medium rounded-2xl hover:bg-slate-200 transition-colors"
              >
                ← Retour au catalogue
              </button>
              
              <button
                onClick={() => {
                  setPhase('practice');
                  setExercise(null);
                  setCorrectionResult(null);
                  setError(null);
                }}
                className="w-full py-3 text-slate-500 hover:text-slate-700"
              >
                Refaire un exercice
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
