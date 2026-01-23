'use client';

import { useState, useRef } from 'react';

/**
 * ScreenshotUploader - Composant d'upload de capture d'écran
 * 
 * Utilisé pour les exercices nécessitant une validation visuelle :
 * - Graphiques
 * - Mise en forme conditionnelle (MFC)
 * - Tableaux croisés dynamiques (TCD)
 * - Tri et filtres
 * 
 * @param {Function} onScreenshotChange - Callback (file, base64) quand screenshot change
 * @param {boolean} required - Si le screenshot est obligatoire
 * @param {string} hint - Message d'aide personnalisé
 */
export default function ScreenshotUploader({ 
  onScreenshotChange, 
  required = false,
  hint = "Capture d'écran de ton graphique ou mise en forme"
}) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  
  const handleFile = async (file) => {
    setError(null);
    
    // Validation du type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format non supporté. Utilise PNG, JPEG, WebP ou GIF.');
      return;
    }
    
    // Validation de la taille
    if (file.size > MAX_SIZE) {
      setError(`Fichier trop lourd (${Math.round(file.size / 1024 / 1024)}MB). Maximum: 5MB`);
      return;
    }
    
    // Créer la preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      setFileName(file.name);
      
      // Callback avec le fichier et le base64
      if (onScreenshotChange) {
        onScreenshotChange(file, base64);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };
  
  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    if (onScreenshotChange) onScreenshotChange(null, null);
  };
  
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  };
  
  return (
    <div className="w-full">
      {/* Zone d'upload */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : preview 
              ? 'border-green-300 bg-green-50' 
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleInputChange}
          className="hidden"
        />
        
        {preview ? (
          // Preview de l'image
          <div className="space-y-3">
            <div className="relative inline-block">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-40 rounded-lg shadow-sm mx-auto"
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full 
                          text-sm font-bold hover:bg-red-600 transition-colors"
                title="Supprimer"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-green-600 font-medium">
              ✓ {fileName || 'Screenshot ajouté'}
            </p>
          </div>
        ) : (
          // État vide
          <div className="space-y-2 py-2">
            <div className="text-3xl">📷</div>
            <p className="text-sm text-slate-600">
              {hint}
            </p>
            <p className="text-xs text-slate-400">
              Glisse une image, colle (Ctrl+V), ou clique pour sélectionner
            </p>
            {required && (
              <p className="text-xs text-orange-500 font-medium mt-1">
                ⚠️ Screenshot requis pour valider cet exercice
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Message d'erreur */}
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
      
      {/* Aide */}
      <div className="mt-2 text-xs text-slate-400 space-y-1">
        <p>💡 <strong>Astuce :</strong> Utilise <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">Win+Shift+S</kbd> (Windows) ou <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">Cmd+Shift+4</kbd> (Mac) pour capturer une zone</p>
      </div>
    </div>
  );
}

/**
 * Hook pour détecter si un exercice nécessite un screenshot
 */
export function useNeedsScreenshot(exercise) {
  if (!exercise) return false;
  
  const checkpoints = exercise.checkpoints || [];
  const visualTypes = ['graphique', 'graph', 'chart', 'format', 'mfc', 'tcd', 'pivot', 'tri', 'filtre'];
  
  // Vérifier les checkpoints
  const hasVisualCheckpoint = checkpoints.some(cp => {
    if (cp.requires_screenshot || cp.validation_type === 'visual') return true;
    if (cp.type && visualTypes.some(t => cp.type.toLowerCase().includes(t))) return true;
    return false;
  });
  
  if (hasVisualCheckpoint) return true;
  
  // Vérifier les compétences (IDs connus pour nécessiter screenshot)
  // Note: chercher les deux variantes de nom (competence_ids et competences_ids)
  const visualCompetenceIds = [2, 7, 8, 10, 21, 23, 26, 31, 32, 40, 45, 52, 57];
  const competenceIds = exercise.competence_ids || exercise.competences_ids || [];
  
  return competenceIds.some(id => visualCompetenceIds.includes(parseInt(id)));
}
