import { FrontendLogEvent } from './log-events';

export type FrontendLogLevel = 'debug' | 'info' | 'warn' | 'error';

type FrontendLogContext = Record<string, unknown>;

interface FrontendLogEntry extends FrontendLogContext {
  timestamp: string;
  app: 'lampiao-web';
  sessionId: string;
  sequence: number;
  level: FrontendLogLevel;
  event: FrontendLogEvent;
  message: string;
}

const DEBUG_STORAGE_KEY = 'lampiao:debug';
const LOG_LEVEL_ORDER: Record<FrontendLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

let sequence = 0;
let debugOverride: boolean | null = null;

function createSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const sessionId = createSessionId();

function removeUndefinedValues(context: FrontendLogContext): FrontendLogContext {
  return Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined));
}

export function serializeFrontendError(error: unknown): FrontendLogContext {
  if (error instanceof Error) {
    return removeUndefinedValues({
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  if (typeof error === 'string') {
    return { value: error };
  }

  try {
    return { value: JSON.stringify(error) };
  } catch {
    return {
      value: Object.prototype.toString.call(error),
      valueType: typeof error,
    };
  }
}

function readDebugFlagFromStorage(): boolean {
  if (!globalThis.window || !globalThis.window.localStorage) {
    return false;
  }

  try {
    return globalThis.window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function isDebugEnabled(): boolean {
  if (debugOverride !== null) {
    return debugOverride;
  }

  return readDebugFlagFromStorage();
}

function getMinLogLevel(): FrontendLogLevel {
  return isDebugEnabled() ? 'debug' : 'info';
}

function shouldLog(level: FrontendLogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[getMinLogLevel()];
}

export function setFrontendDebugLogging(enabled: boolean): void {
  debugOverride = enabled;

  if (!globalThis.window || !globalThis.window.localStorage) {
    return;
  }

  try {
    if (enabled) {
      globalThis.window.localStorage.setItem(DEBUG_STORAGE_KEY, '1');
      return;
    }

    globalThis.window.localStorage.removeItem(DEBUG_STORAGE_KEY);
  } catch {
    // Ignore storage failures (private mode or restricted env).
  }
}

function write(level: FrontendLogLevel, event: FrontendLogEvent, message: string, context: FrontendLogContext = {}): void {
  if (!shouldLog(level)) {
    return;
  }

  sequence += 1;

  const entry: FrontendLogEntry = {
    timestamp: new Date().toISOString(),
    app: 'lampiao-web',
    sessionId,
    sequence,
    level,
    event,
    message,
    ...removeUndefinedValues(context),
  };

  if (level === 'error') {
    console.error(entry);
    return;
  }

  if (level === 'warn') {
    console.warn(entry);
    return;
  }

  console.log(entry);
}

export const appLogger = {
  debug(event: FrontendLogEvent, message: string, context?: FrontendLogContext): void {
    write('debug', event, message, context);
  },
  info(event: FrontendLogEvent, message: string, context?: FrontendLogContext): void {
    write('info', event, message, context);
  },
  warn(event: FrontendLogEvent, message: string, context?: FrontendLogContext): void {
    write('warn', event, message, context);
  },
  error(event: FrontendLogEvent, message: string, context?: FrontendLogContext): void {
    write('error', event, message, context);
  },
};