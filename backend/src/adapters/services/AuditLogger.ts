import { mkdirSync } from 'fs';
import { appendFile } from 'fs/promises';
import path from 'path';
import { appLogger } from './AppLogger';

const logsDir = path.resolve(process.cwd(), 'logs');
const auditLogPath = path.join(logsDir, 'audit.log');

mkdirSync(logsDir, { recursive: true });

export async function auditLog(event: string, details: Record<string, unknown>): Promise<void> {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...details,
  });

  try {
    await appendFile(auditLogPath, `${entry}\n`, 'utf8');
  } catch {
    appLogger.warn('audit.write.failed', 'Audit log could not be persisted to disk', {
      event,
      details,
    });
  }
}