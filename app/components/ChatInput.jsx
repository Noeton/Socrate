'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  disabled, 
  userProfile, 
  sessionId, 
  onCorrectionResult,
  onExerciseLoaded,
  showExerciseActions = false
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingExercise, setIsLoadingExercise] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [exerciseReady, setExerciseReady] = useState(false); // Exercice téléchargé, prêt pour upload
  const [screenshot, setScreenshot] = useState(null); // NOUVEAU : screenshot pour graphiques
  const [screenshotPreview, setScreenshotPreview] = useState(null); // NOUVEAU : preview
  const fileInputRef = useRef(null);
  const screenshotInputRef = useRef(null); // NOUVEAU
  const textareaRef = useRef(null);

  // Afficher upload si exercice téléchargé OU si exercice en cours
  const [hasActiveExercise, setHasActiveExercise] = useState(false);
  
  // NOUVEAU : Vérifier si l'exercice en cours nécessite un screenshot
  const [needsScreenshot, setNeedsScreenshot] = useState(false);
  
useEffect(() => {
  setHasActiveExercise(exerciseReady || !!localStorage.getItem('current-exercise-id'));
  // Vérifier si l'exercice a des checkpoints graphiques
  const exerciseData = localStorage.getItem('current-exercise-data');
  if (exerciseData) {
    try {
      const exercise = JSON.parse(exerciseData);
      const hasVisualCheckpoints = exercise.checkpoints?.some(
        cp => cp.type === 'graphique' || cp.requires_screenshot || cp.validation_type === 'visual'
      );
      setNeedsScreenshot(hasVisualCheckpoints);
    } catch (e) {}
  }
}, [exerciseReady]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  /**
   * Télécharge un fichier Excel pour l'exercice
   */
  const handleDownloadExcel = async () => {
    setIsDownloading(true);

    try {
      // Vérifier si on a déjà un exercice généré avec son Excel
      const exerciseDataStr = localStorage.getItem('current-exercise-data');
      if (exerciseDataStr) {
        const exerciseData = JSON.parse(exerciseDataStr);
        
        if (exerciseData.excelBase64) {
          // Utiliser le fichier Excel déjà généré
          const byteCharacters = atob(exerciseData.excelBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = exerciseData.excelFilename || `exercice_${exerciseData.id || 'socrate'}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          setExerciseReady(true);
          console.log('📥 [DOWNLOAD] Exercice téléchargé depuis cache:', exerciseData.id);
          return;
        }
      }
      
      // Fallback : appeler l'API pour générer un nouveau fichier
      // D'abord, nettoyer l'ancien exercice en cache pour éviter les conflits
      localStorage.removeItem('current-exercise-data');
      
      const response = await fetch('/api/generate-exercise-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionId,
          competence: userProfile?.exerciceEnCours?.competence || null,
          niveau: userProfile?.niveau || 'debutant'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur génération fichier');
      }

      // Récupérer l'exerciseId depuis le header
      const exerciseId = response.headers.get('X-Exercise-Id');
      if (exerciseId) {
        localStorage.setItem('current-exercise-id', exerciseId);
        // Important: pas de current-exercise-data ici, la correction utilisera l'ID
        console.log('📥 [DOWNLOAD] Nouvel exercice ID stocké:', exerciseId);
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exercice_socrate_${exerciseId || 'excel'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Activer le bouton upload
      setExerciseReady(true);

      console.log('📥 [DOWNLOAD] Exercice téléchargé via API:', exerciseId);

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('❌ Erreur lors du téléchargement: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Charge un exercice dans la sandbox (remplace l'ancien téléchargement Excel)
   */
  const handleStartExercise = async () => {
    if (!userProfile?.niveau) {
      alert('Discute d\'abord avec moi pour que je connaisse ton niveau ! 😊');
      return;
    }

    setIsLoadingExercise(true);

    try {
      const response = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionId,
          competence: userProfile.exerciceEnCours?.competence || null,
          type: userProfile.exerciceEnCours?.type || 'consolidation'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur génération exercice');
      }

      const data = await response.json();
      
      if (!data.success || !data.exercise) {
        throw new Error('Exercice invalide retourné par l\'API');
      }

      console.log('🎮 [EXERCISE] Exercice chargé:', data.exercise.id);
      
      // Stocker l'ID pour la correction
      localStorage.setItem('current-exercise-id', data.exercise.id);
      
      // Notifier le parent pour afficher la sandbox
      if (onExerciseLoaded) {
        onExerciseLoaded(data.exercise);
      }
      
    } catch (error) {
      console.error('Erreur chargement exercice:', error);
      alert('❌ Erreur lors du chargement de l\'exercice: ' + error.message);
    } finally {
      setIsLoadingExercise(false);
    }
  };

  // NOUVEAU : Gérer l'upload de screenshot
  const handleScreenshotSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Valider que c'est une image
      if (!file.type.startsWith('image/')) {
        alert('⚠️ Sélectionne une image (PNG, JPG, etc.)');
        return;
      }
      
      setScreenshot(file);
      
      // Créer une preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // NOUVEAU : Supprimer le screenshot
  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (screenshotInputRef.current) {
      screenshotInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type)) {
      alert('⚠️ Fichier invalide ! Envoie un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', sessionId);
      const exerciseId = localStorage.getItem('current-exercise-id') || userProfile.exerciceEnCours?.id || 'unknown';
      formData.append('exerciseId', exerciseId);
      
      // NOUVEAU : Envoyer les données de l'exercice dynamique (checkpoints, expected values)
      // IMPORTANT: Seulement si l'ID correspond pour éviter les conflits
      const exerciseDataStr = localStorage.getItem('current-exercise-data');
      if (exerciseDataStr) {
        try {
          const exerciseData = JSON.parse(exerciseDataStr);
          // Vérifier que c'est bien le même exercice
          if (exerciseData.id === exerciseId) {
            formData.append('exerciseData', exerciseDataStr);
            console.log('📦 [UPLOAD] Données exercice dynamique incluses:', exerciseData.id);
          } else {
            console.log('⚠️ [UPLOAD] exerciseData ignoré (ID différent):', exerciseData.id, '!=', exerciseId);
          }
        } catch (e) {
          console.warn('⚠️ [UPLOAD] Erreur parsing exerciseData');
        }
      }
      
      // NOUVEAU : Ajouter le screenshot si présent
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      const response = await fetch('/api/correct-exercise', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur correction');
      }

      // NOUVEAU : Si la réponse indique qu'un screenshot est nécessaire
      if (data.needs_screenshot && !screenshot) {
        alert('💡 Conseil : Pour valider ton graphique, ajoute une capture d\'écran !');
      }

      if (onCorrectionResult) {
        onCorrectionResult(data);
      }
      
      // Reset le screenshot après envoi
      removeScreenshot();
      
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('❌ Erreur lors de la correction de ton exercice.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="chat-input-container">
      {/* Actions contextuelles - Affichées quand showExerciseActions est true */}
      {showExerciseActions && (
        <div className="exercise-actions-panel">
          <p className="actions-label">📝 Exercice disponible ! Choisis ton mode :</p>
          <div className="quick-actions">
            {/* Option 1: Télécharger Excel */}
            <button 
              className="action-button excel"
              onClick={handleDownloadExcel}
              disabled={isDownloading}
              title="Télécharger un fichier Excel"
            >
              {isDownloading ? (
                <div className="loading-spinner-small" />
              ) : (
                <span className="action-icon">📥</span>
              )}
              <div className="action-text">
                <span className="action-title">Fichier Excel</span>
                <span className="action-desc">Pratique réelle</span>
              </div>
            </button>

            {/* Option 2: Upload (visible si exercice téléchargé) */}
            {hasActiveExercise && (
              <button 
                className="action-button upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Soumettre ton fichier complété"
              >
                {isUploading ? (
                  <div className="loading-spinner-small" />
                ) : (
                  <span className="action-icon">📤</span>
                )}
                <div className="action-text">
                  <span className="action-title">Soumettre</span>
                  <span className="action-desc">Pour correction</span>
                </div>
              </button>
            )}

            {/* NOUVEAU: Bouton Screenshot (pour exercices graphiques) */}
            {hasActiveExercise && needsScreenshot && (
              <button 
                className={`action-button screenshot ${screenshot ? 'has-screenshot' : ''}`}
                onClick={() => screenshotInputRef.current?.click()}
                title="Ajouter une capture d'écran de ton graphique"
              >
                <span className="action-icon">{screenshot ? '✅' : '📷'}</span>
                <div className="action-text">
                  <span className="action-title">{screenshot ? 'Screenshot OK' : 'Screenshot'}</span>
                  <span className="action-desc">{screenshot ? 'Clic pour changer' : 'Pour graphiques'}</span>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            {/* NOUVEAU: Input caché pour screenshot */}
            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              onChange={handleScreenshotSelect}
              style={{ display: 'none' }}
            />
          </div>
          
          {/* NOUVEAU: Preview du screenshot */}
          {screenshotPreview && (
            <div className="screenshot-preview">
              <img src={screenshotPreview} alt="Capture d'écran" />
              <button 
                className="remove-screenshot" 
                onClick={removeScreenshot}
                title="Supprimer la capture"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="input-form">
        <div 
          className={`input-wrapper ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Pose-moi une question sur Excel..."
            disabled={disabled}
            rows={1}
            className="message-input"
          />
          
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="send-button"
            title="Envoyer (Enter)"
          >
            {disabled ? (
              <div className="loading-spinner" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 10l16-8-8 16-2-8-6-0z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
      </form>

      <div className="input-footer">
        <span className="hint">Enter pour envoyer • Shift+Enter pour nouvelle ligne</span>
      </div>

      <style jsx>{`
        .chat-input-container {
          background: white;
          border-top: 1px solid #e5e7eb;
          padding: 1rem 1.5rem;
        }

        .exercise-actions-panel {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%);
          border: 1px solid #86efac;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .actions-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #166534;
          margin-bottom: 0.75rem;
        }

        .quick-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid;
          flex: 1;
          min-width: 140px;
        }

        .action-icon {
          font-size: 1.5rem;
        }

        .action-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .action-title {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .action-desc {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .action-button.sandbox {
          background: #fef3c7;
          border-color: #fbbf24;
          color: #92400e;
        }

        .action-button.sandbox:hover:not(:disabled) {
          background: #fde68a;
          border-color: #f59e0b;
          transform: translateY(-2px);
        }

        .action-button.excel {
          background: #dbeafe;
          border-color: #60a5fa;
          color: #1e40af;
        }

        .action-button.excel:hover:not(:disabled) {
          background: #bfdbfe;
          border-color: #3b82f6;
          transform: translateY(-2px);
        }

        .action-button.upload {
          background: #f0fdf4;
          border-color: #4ade80;
          color: #166534;
        }

        .action-button.upload:hover:not(:disabled) {
          background: #dcfce7;
          border-color: #22c55e;
          transform: translateY(-2px);
        }

        /* NOUVEAU: Styles pour bouton screenshot */
        .action-button.screenshot {
          background: #fef3c7;
          border-color: #fbbf24;
          color: #92400e;
        }

        .action-button.screenshot:hover:not(:disabled) {
          background: #fde68a;
          border-color: #f59e0b;
          transform: translateY(-2px);
        }

        .action-button.screenshot.has-screenshot {
          background: #d1fae5;
          border-color: #10b981;
          color: #065f46;
        }

        /* NOUVEAU: Preview du screenshot */
        .screenshot-preview {
          position: relative;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .screenshot-preview img {
          max-width: 200px;
          max-height: 120px;
          border-radius: 4px;
          object-fit: contain;
        }

        .remove-screenshot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: background 0.2s;
        }

        .remove-screenshot:hover {
          background: #dc2626;
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .loading-spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .input-form {
          width: 100%;
        }

        .input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .input-wrapper:focus-within {
          border-color: #3b82f6;
          background: white;
        }

        .input-wrapper.drag-active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .message-input {
          flex: 1;
          border: none;
          background: transparent;
          resize: none;
          outline: none;
          font-size: 0.95rem;
          color: #111827;
          font-family: inherit;
          line-height: 1.5;
          max-height: 150px;
          overflow-y: auto;
        }

        .message-input::placeholder {
          color: #9ca3af;
        }

        .send-button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: #3b82f6;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .send-button:hover:not(:disabled) {
          background: #2563eb;
          transform: scale(1.05);
        }

        .send-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .input-footer {
          display: flex;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .hint {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .chat-input-container {
            padding: 0.75rem 1rem;
          }

          .quick-actions {
            flex-direction: column;
          }

          .action-button {
            min-width: 100%;
          }

          .hint {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}