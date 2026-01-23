/**
 * VALIDATEURS ZOD
 * Schémas de validation pour toutes les routes API
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// SCHÉMAS DE VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Validation pour POST /api/correct-exercise
 */
export const correctExerciseSchema = z.object({
  userId: z.string().min(1),
  exerciseId: z.string().min(1),
  // file est validé séparément (FormData)
});

/**
 * Validation pour POST /api/generate-exercise
 */
export const generateExerciseSchema = z.object({
  userId: z.string().min(1),
  niveau: z.string().optional(),
  competence: z.string().optional(),
  contexteMetier: z.string().optional(),
});

/**
 * Validation pour POST /api/generate-exercise-file
 */
export const generateExerciseFileSchema = z.object({
  userId: z.string().min(1),
  exerciseId: z.string().optional(),
  competence: z.string().optional(),
  niveau: z.string().optional(),
});

/**
 * Validation pour POST /api/learn-progress
 */
export const learnProgressSchema = z.object({
  userId: z.string().min(1),
  lessonId: z.string().min(1),
  xpEarned: z.number().optional(),
  completed: z.boolean().optional(),
});

/**
 * Validation pour POST /api/login
 */
export const loginSchema = z.object({
  email: z.string().email(),
});

/**
 * Validation pour POST /api/chat
 */
export const chatSchema = z.object({
  message: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  context: z.string().optional(),
});

/**
 * Validation pour POST /api/user-profile
 */
export const userProfileSchema = z.object({
  userId: z.string().min(1),
  niveau: z.string().optional(),
  contexteMetier: z.string().optional(),
  objectif: z.string().optional(),
});

/**
 * Validation pour POST /api/streak
 */
export const streakSchema = z.object({
  userId: z.string().min(1),
  action: z.string().optional(), // 'check' | 'increment'
});

// ═══════════════════════════════════════════════════════════════
// HELPERS DE VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Valide les données et retourne une réponse d'erreur si invalide
 * @param {Object} schema - Schéma Zod
 * @param {Object} data - Données à valider
 * @returns {{ success: boolean, data?: Object, error?: Object }}
 */
export function validateRequest(schema, data) {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      error: {
        message: 'Validation échouée',
        details: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }
    };
  }
  
  return { success: true, data: result.data };
}

/**
 * Valide un fichier uploadé
 * @param {File} file - Fichier à valider
 * @param {Object} options - Options de validation
 * @returns {{ success: boolean, error?: string }}
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10 MB par défaut
    allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]
  } = options;

  if (!file) {
    return { success: false, error: 'Fichier manquant' };
  }

  if (file.size > maxSize) {
    return { success: false, error: `Fichier trop volumineux (max ${maxSize / 1024 / 1024} MB)` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { success: false, error: 'Type de fichier non autorisé. Utilisez .xlsx ou .xls' };
  }

  return { success: true };
}

/**
 * Sanitize une chaîne pour éviter les injections
 * @param {string} str - Chaîne à nettoyer
 * @returns {string}
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Supprime < et >
    .trim()
    .slice(0, 10000); // Limite la longueur
}

/**
 * Sanitize un objet entier
 * @param {Object} obj - Objet à nettoyer
 * @returns {Object}
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export default {
  correctExerciseSchema,
  generateExerciseSchema,
  generateExerciseFileSchema,
  learnProgressSchema,
  loginSchema,
  chatSchema,
  userProfileSchema,
  streakSchema,
  validateRequest,
  validateFile,
  sanitizeString,
  sanitizeObject
};