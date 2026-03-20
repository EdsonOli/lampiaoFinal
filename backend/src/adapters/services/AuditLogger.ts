import { mkdirSync } from 'fs';
import { appendFile } from 'fs/promises';
import path from 'path';

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
    // Audit logging must never break request flow.
  }
}