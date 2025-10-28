/* Simple logger utility with levels and request-scoped context */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const currentLevel = levelOrder[envLevel] ?? levelOrder.info;

function ts() {
  const d = new Date();
  // ISO without milliseconds for compactness
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function out(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (levelOrder[level] < currentLevel) return;
  const line = `${ts()} [${level.toUpperCase()}] ${message}`;
  if (meta) {
    // Avoid logging undefined fields
    const payload = Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== undefined));
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](line, payload);
  } else {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](line);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => out('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => out('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => out('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => out('error', msg, meta),
};

export function createRequestLogger(reqId?: string) {
  const id = reqId || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const withId = (level: LogLevel, msg: string, meta?: Record<string, unknown>) =>
    logger[level](`[req:${id}] ${msg}`, meta);
  return {
    id,
    debug: (msg: string, meta?: Record<string, unknown>) => withId('debug', msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) => withId('info', msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => withId('warn', msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => withId('error', msg, meta),
    startTimer: () => {
      const start = Date.now();
      return () => Date.now() - start;
    },
  };
}

export function redact(text?: string, max = 500): string | undefined {
  if (!text) return text;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}… (${text.length - max} more)`;
}
