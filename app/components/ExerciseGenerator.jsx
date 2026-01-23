'use client';

import { useState, useEffect } from 'react';

/**
 * EXERCISE GENERATOR
 * 
 * Composant UI pour la génération dynamique d'exercices avec Claude.
 * Design sobre et élégant, met en valeur la puissance du système.
 * 
 * Props:
 * - competence: { key, nom, id } - La compétence cible
 * - userId: string - ID utilisateur pour personnalisation
 * - metier: string - Contexte métier (ventes, finance, rh...)
 * - onExerciseReady: (exercise) => void - Callback quand l'exercice est prêt
 * - onCancel: () => void - Callback pour annuler
 * - autoStart: boolean - Démarrer automatiquement la génération
 */
export default function ExerciseGenerator({
  competence,
  userId,
  metier = 'ventes',
  onExerciseReady,
  onCancel,
  autoStart = false
}) {
  const [state, setState] = useState('idle'); // idle | generating | ready | error
  const [exercise, setExercise] = useState(null);
  const [excelData, setExcelData] = useState(null); // { base64, filename }
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  // Messages de progression
  const progressSteps = [
    { at: 0, text: 'Analyse de ton profil...' },
    { at: 15, text: 'Sélection des données métier...' },
    { at: 30, text: 'Socrate conçoit le scénario...' },
    { at: 50, text: 'Création des questions...' },
    { at: 70, text: 'Calcul des réponses attendues...' },
    { at: 85, text: 'Finalisation de l\'exercice...' },
    { at: 95, text: 'Presque prêt...' }
  ];

  // Auto-start si demandé
  useEffect(() => {
    if (autoStart && state === 'idle') {
      handleGenerate();
    }
  }, [autoStart]);

  // Simuler la progression pendant la génération
  useEffect(() => {
    if (state !== 'generating') return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 8;
        if (next >= 95) {
          clearInterval(interval);
          return 95;
        }
        
        // Mettre à jour le message
        const step = progressSteps.filter(s => s.at <= next).pop();
        if (step) setCurrentStep(step.text);
        
        return next;
      });
    }, 400);
    
    return () => clearInterval(interval);
  }, [state]);

  const handleGenerate = async () => {
    setState('generating');
    setProgress(0);
    setCurrentStep(progressSteps[0].text);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          competence: competence?.id || competence?.key,
          skillKey: competence?.key,
          type: 'consolidation',
          metier,
          includeExcel: true
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }
      
      setProgress(100);
      setCurrentStep('Exercice prêt !');
      setExercise(data.exercise);
      setStats(data.stats);
      
      // Stocker les données Excel pour le téléchargement
      if (data.excelBase64) {
        setExcelData({
          base64: data.excelBase64,
          filename: data.excelFilename || `exercice_${data.exercise?.id || 'socrate'}.xlsx`
        });
      }
      
      setState('ready');
      
    } catch (err) {
      console.error('Erreur génération:', err);
      setError(err.message);
      setState('error');
    }
  };

  const handleDownloadExcel = () => {
    if (!exercise) return;
    
    // Utiliser le fichier Excel déjà généré (base64)
    if (excelData?.base64) {
      // Convertir base64 en blob et télécharger
      const byteCharacters = atob(excelData.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = excelData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('📥 [GENERATOR] Fichier Excel téléchargé:', excelData.filename);
    } else {
      // Fallback : appeler l'API (ne devrait pas arriver si includeExcel=true)
      console.warn('⚠️ [GENERATOR] Pas de base64, fallback API');
      window.open(`/api/generate-exercise-file?exerciseId=${exercise.id}`, '_blank');
    }
  };

  const handleStartExercise = () => {
    if (onExerciseReady && exercise) {
      // Passer l'exercice avec les données Excel
      onExerciseReady({
        ...exercise,
        excelBase64: excelData?.base64,
        excelFilename: excelData?.filename
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER : État Idle
  // ═══════════════════════════════════════════════════════════════
  if (state === 'idle') {
    return (
      <div className="exercise-generator">
        <div className="gen-card">
          <div className="gen-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2 className="gen-title">Exercice personnalisé</h2>
          
          <p className="gen-description">
            Claude va créer un exercice unique adapté à ton niveau, 
            avec des données réalistes de ton secteur.
          </p>
          
          <div className="gen-details">
            <div className="detail-item">
              <span className="detail-label">Compétence</span>
              <span className="detail-value">{competence?.nom || competence?.key}</span>
            </div>
            {metier && (
              <div className="detail-item">
                <span className="detail-label">Secteur</span>
                <span className="detail-value capitalize">{metier}</span>
              </div>
            )}
          </div>
          
          <button className="gen-button primary" onClick={handleGenerate}>
            Générer mon exercice
          </button>
          
          {onCancel && (
            <button className="gen-button secondary" onClick={onCancel}>
              Annuler
            </button>
          )}
        </div>
        
        <style jsx>{styles}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER : Génération en cours
  // ═══════════════════════════════════════════════════════════════
  if (state === 'generating') {
    return (
      <div className="exercise-generator">
        <div className="gen-card generating">
          <div className="gen-loader">
            <div className="loader-ring" />
            <div className="loader-ring" />
            <div className="loader-ring" />
          </div>
          
          <h2 className="gen-title">Création en cours...</h2>
          
          <p className="gen-step">{currentStep}</p>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="gen-note">
            Socrate analyse les données et conçoit un scénario unique pour toi.
          </p>
        </div>
        
        <style jsx>{styles}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER : Erreur
  // ═══════════════════════════════════════════════════════════════
  if (state === 'error') {
    return (
      <div className="exercise-generator">
        <div className="gen-card error">
          <div className="gen-icon error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2 className="gen-title">Oups, une erreur s'est produite</h2>
          
          <p className="gen-description error">{error}</p>
          
          <div className="gen-actions">
            <button className="gen-button primary" onClick={handleGenerate}>
              Réessayer
            </button>
            {onCancel && (
              <button className="gen-button secondary" onClick={onCancel}>
                Annuler
              </button>
            )}
          </div>
        </div>
        
        <style jsx>{styles}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER : Exercice prêt
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="exercise-generator">
      <div className="gen-card ready">
        <div className="gen-success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2 className="gen-title">{exercise.titre}</h2>
        
        {/* Contexte */}
        <div className="exercise-context">
          {typeof exercise.contexte === 'string' ? (
            <p>{exercise.contexte}</p>
          ) : exercise.contexte?.situation ? (
            <>
              <p>{exercise.contexte.situation}</p>
              {exercise.contexte.manager?.demande && (
                <blockquote className="manager-quote">
                  "{exercise.contexte.manager.demande}"
                  <cite>— {exercise.contexte.manager.nom}</cite>
                </blockquote>
              )}
            </>
          ) : (
            <p>Exercice pratique sur {competence?.nom}</p>
          )}
        </div>
        
        {/* Stats de génération */}
        <div className="gen-stats">
          <div className="stat">
            <span className="stat-value">{exercise.donnees?.rows?.length || '—'}</span>
            <span className="stat-label">lignes de données</span>
          </div>
          <div className="stat">
            <span className="stat-value">{exercise.checkpoints?.length || '—'}</span>
            <span className="stat-label">questions</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats?.generationTime ? `${(stats.generationTime/1000).toFixed(1)}s` : '—'}</span>
            <span className="stat-label">temps de création</span>
          </div>
        </div>
        
        {/* Badge progression */}
        {stats?.progressionLevel && (
          <div className={`progression-badge level-${stats.progressionLevel}`}>
            {stats.progressionLevel === 'discovery' && '🌱 Découverte'}
            {stats.progressionLevel === 'standard' && '📊 Standard'}
            {stats.progressionLevel === 'advanced' && '🚀 Avancé'}
            {stats.progressionLevel === 'expert' && '👑 Expert'}
          </div>
        )}
        
        {/* Actions */}
        <div className="gen-actions">
          <button className="gen-button primary large" onClick={handleStartExercise}>
            Commencer l'exercice
          </button>
          
          <button className="gen-button secondary" onClick={handleDownloadExcel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Télécharger Excel
          </button>
        </div>
        
        {/* Option de regénération */}
        <button className="regenerate-link" onClick={handleGenerate}>
          Générer un autre exercice
        </button>
      </div>
      
      <style jsx>{styles}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = `
  .exercise-generator {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  .gen-card {
    background: white;
    border-radius: 16px;
    padding: 32px 24px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    text-align: center;
  }

  .gen-card.generating {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .gen-card.ready {
    border: 2px solid #22c55e;
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  }

  .gen-card.error {
    border: 2px solid #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
  }

  .gen-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .gen-icon.error {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .gen-success-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    background: #22c55e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .gen-title {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 12px;
  }

  .gen-description {
    font-size: 0.95rem;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 24px;
  }

  .gen-description.error {
    color: #dc2626;
    font-size: 0.875rem;
  }

  .gen-details {
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
  }

  .detail-item:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }

  .detail-label {
    font-size: 0.875rem;
    color: #64748b;
  }

  .detail-value {
    font-weight: 600;
    color: #1e293b;
  }

  .detail-value.capitalize {
    text-transform: capitalize;
  }

  /* Loader */
  .gen-loader {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
  }

  .loader-ring {
    position: absolute;
    inset: 0;
    border: 3px solid transparent;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1.2s linear infinite;
  }

  .loader-ring:nth-child(2) {
    inset: 8px;
    border-top-color: #8b5cf6;
    animation-duration: 1.5s;
    animation-direction: reverse;
  }

  .loader-ring:nth-child(3) {
    inset: 16px;
    border-top-color: #06b6d4;
    animation-duration: 2s;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .gen-step {
    font-size: 1rem;
    color: #3b82f6;
    font-weight: 500;
    margin: 0 0 20px;
    min-height: 24px;
  }

  .progress-bar {
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .gen-note {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 0;
  }

  /* Exercise Context */
  .exercise-context {
    text-align: left;
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .exercise-context p {
    font-size: 0.95rem;
    color: #475569;
    line-height: 1.6;
    margin: 0;
  }

  .manager-quote {
    margin: 12px 0 0;
    padding: 12px 16px;
    background: white;
    border-left: 3px solid #3b82f6;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: #334155;
  }

  .manager-quote cite {
    display: block;
    margin-top: 8px;
    font-style: normal;
    font-size: 0.85rem;
    color: #64748b;
  }

  /* Stats */
  .gen-stats {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-bottom: 20px;
    padding: 16px 0;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
  }

  .stat {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1;
  }

  .stat-label {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 4px;
  }

  /* Progression Badge */
  .progression-badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 20px;
  }

  .progression-badge.level-discovery {
    background: #dcfce7;
    color: #166534;
  }

  .progression-badge.level-standard {
    background: #dbeafe;
    color: #1e40af;
  }

  .progression-badge.level-advanced {
    background: #fef3c7;
    color: #92400e;
  }

  .progression-badge.level-expert {
    background: #fae8ff;
    color: #86198f;
  }

  /* Buttons */
  .gen-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .gen-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px 24px;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .gen-button.primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .gen-button.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  .gen-button.primary.large {
    padding: 16px 32px;
    font-size: 1.1rem;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  }

  .gen-button.primary.large:hover {
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
  }

  .gen-button.secondary {
    background: white;
    color: #475569;
    border: 2px solid #e2e8f0;
  }

  .gen-button.secondary:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .regenerate-link {
    background: none;
    border: none;
    color: #64748b;
    font-size: 0.875rem;
    cursor: pointer;
    margin-top: 16px;
    padding: 8px;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .regenerate-link:hover {
    color: #3b82f6;
  }
`;