/**
 * CLASSES D'ERREURS MÉTIER
 * Erreurs typées pour meilleure gestion et traçabilité
 */

export class ExerciseNotFoundError extends Error {
  constructor(exerciseId) {
    super(`Exercice ${exerciseId} introuvable`);
    this.name = 'ExerciseNotFoundError';
    this.code = 'EXERCISE_NOT_FOUND';
    this.statusCode = 404;
    this.exerciseId = exerciseId;
  }
}

export class ValidationError extends Error {
  constructor(field, message) {
    super(`Validation échouée: ${field} - ${message}`);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.statusCode = 400;
    this.field = field;
  }
}

export class FileProcessingError extends Error {
  constructor(message, originalError) {
    super(`Erreur traitement fichier: ${message}`);
    this.name = 'FileProcessingError';
    this.code = 'FILE_PROCESSING_ERROR';
    this.statusCode = 400;
    this.originalError = originalError;
  }
}

export class ClaudeAPIError extends Error {
  constructor(message, statusCode = 500) {
    super(`Erreur API Claude: ${message}`);
    this.name = 'ClaudeAPIError';
    this.code = 'CLAUDE_API_ERROR';
    this.statusCode = statusCode;
  }
}

export class DatabaseError extends Error {
  constructor(message, originalError) {
    super(`Erreur base de données: ${message}`);
    this.name = 'DatabaseError';
    this.code = 'DATABASE_ERROR';
    this.statusCode = 500;
    this.originalError = originalError;
  }
}

/**
 * Handler d'erreurs centralisé pour les routes API
 */
export function handleApiError(error, context = {}) {
  // Erreurs métier connues
  if (error instanceof ExerciseNotFoundError ||
      error instanceof ValidationError ||
      error instanceof FileProcessingError) {
    return {
      error: error.message,
      code: error.code,
      ...context,
    };
  }

  // Erreurs API externes
  if (error instanceof ClaudeAPIError) {
    return {
      error: 'Service IA temporairement indisponible',
      code: error.code,
      ...context,
    };
  }

  // Erreurs base de données
  if (error instanceof DatabaseError) {
    console.error('❌ [DATABASE]', error.originalError);
    return {
      error: 'Erreur de persistance des données',
      code: error.code,
      ...context,
    };
  }

  // Erreur générique (ne pas exposer détails en prod)
  console.error('❌ [UNKNOWN]', error);
  return {
    error: process.env.NODE_ENV === 'production'
      ? 'Une erreur est survenue'
      : error.message,
    code: 'INTERNAL_ERROR',
    ...context,
  };
}
