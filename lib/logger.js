/**
 * LOGGER STRUCTURÉ
 * Logs JSON filtrables par niveau pour production
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? 
  (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

/**
 * Formate et affiche un log
 * @param {string} level - DEBUG|INFO|WARN|ERROR
 * @param {string} module - Nom du module (ex: "HYBRID-CORRECTOR")
 * @param {string} message - Message principal
 * @param {Object} context - Données additionnelles
 */
function log(level, module, message, context = {}) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    ...context
  };

  const output = process.env.NODE_ENV === 'production' 
    ? JSON.stringify(entry)
    : formatDev(entry);

  switch (level) {
    case 'ERROR':
      console.error(output);
      break;
    case 'WARN':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

/**
 * Format lisible pour développement
 */
function formatDev(entry) {
  const emoji = {
    DEBUG: '🔍',
    INFO: '✅',
    WARN: '⚠️',
    ERROR: '❌'
  }[entry.level] || '📝';

  const contextStr = Object.keys(entry).length > 4
    ? ' ' + JSON.stringify(
        Object.fromEntries(
          Object.entries(entry).filter(([k]) => !['timestamp', 'level', 'module', 'message'].includes(k))
        )
      )
    : '';

  return `${emoji} [${entry.module}] ${entry.message}${contextStr}`;
}

const logger = {
  debug: (module, message, context) => log('DEBUG', module, message, context),
  info: (module, message, context) => log('INFO', module, message, context),
  warn: (module, message, context) => log('WARN', module, message, context),
  error: (module, message, context) => log('ERROR', module, message, context)
};

export default logger;