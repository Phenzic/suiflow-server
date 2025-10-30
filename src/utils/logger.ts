/* Minimal logger with levels and timestamps */
type Level = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const currentLevel: Level = (process.env.LOG_LEVEL as Level) || 'info';

function ts(): string {
  return new Date().toISOString();
}

function shouldLog(level: Level): boolean {
  return levelOrder[level] >= levelOrder[currentLevel];
}

export const logger = {
  debug: (...args: unknown[]) => { if (shouldLog('debug')) console.debug(ts(), '[DEBUG]', ...args); },
  info: (...args: unknown[]) => { if (shouldLog('info')) console.log(ts(), '[INFO]', ...args); },
  warn: (...args: unknown[]) => { if (shouldLog('warn')) console.warn(ts(), '[WARN]', ...args); },
  error: (...args: unknown[]) => { if (shouldLog('error')) console.error(ts(), '[ERROR]', ...args); },
};


