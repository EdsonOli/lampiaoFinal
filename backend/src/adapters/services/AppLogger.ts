type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

interface StructuredLogEntry extends LogContext {
  timestamp: string;
  service: 'lampiao-api';
  level: LogLevel;
  event: string;
  message: string;
}

function removeUndefinedValues(context: LogContext): LogContext {
  return Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined));
}

export function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return removeUndefinedValues({
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  return {
    value: typeof error === 'string' ? error : JSON.stringify(error),
  };
}

function write(level: LogLevel, event: string, message: string, context: LogContext = {}): void {
  const entry: StructuredLogEntry = {
    timestamp: new Date().toISOString(),
    service: 'lampiao-api',
    level,
    event,
    message,
    ...removeUndefinedValues(context),
  };

  const serializedEntry = JSON.stringify(entry);

  if (level === 'error') {
    console.error(serializedEntry);
    return;
  }

  if (level === 'warn') {
    console.warn(serializedEntry);
    return;
  }

  console.log(serializedEntry);
}

export const appLogger = {
  debug(event: string, message: string, context?: LogContext): void {
    write('debug', event, message, context);
  },
  info(event: string, message: string, context?: LogContext): void {
    write('info', event, message, context);
  },
  warn(event: string, message: string, context?: LogContext): void {
    write('warn', event, message, context);
  },
  error(event: string, message: string, context?: LogContext): void {
    write('error', event, message, context);
  },
};