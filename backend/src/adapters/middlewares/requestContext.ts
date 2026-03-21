import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { buildApiErrorPayload } from '../http/apiError';
import { appLogger } from '../services/AppLogger';

type JsonResponse = Response['json'];

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header('x-request-id')?.trim() || randomUUID();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const originalJson = res.json.bind(res) as JsonResponse;
  res.json = ((body: unknown) => {
    if (res.statusCode >= 400) {
      return originalJson(buildApiErrorPayload(req, res.statusCode, body));
    }

    return originalJson(body);
  }) as JsonResponse;

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const context = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      appLogger.error('http.request.completed', 'HTTP request completed with server error', context);
      return;
    }

    if (res.statusCode >= 400) {
      appLogger.warn('http.request.completed', 'HTTP request completed with client error', context);
      return;
    }

    appLogger.info('http.request.completed', 'HTTP request completed', context);
  });

  next();
}