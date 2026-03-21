import { Request, Response, NextFunction } from 'express';
import { buildApiErrorPayload, normalizeThrownError } from '../http/apiError';
import { appLogger, serializeError } from '../services/AppLogger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) {
    return;
  }

  const normalizedError = normalizeThrownError(err);

  appLogger[normalizedError.statusCode >= 500 ? 'error' : 'warn'](
    'http.request.failed',
    normalizedError.logMessage,
    {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: normalizedError.statusCode,
      code: normalizedError.code,
      details: normalizedError.details,
      error: serializeError(err),
    }
  );

  res.status(normalizedError.statusCode).json(
    buildApiErrorPayload(req, normalizedError.statusCode, {
      message: normalizedError.message,
      code: normalizedError.code,
      details: normalizedError.details,
    })
  );
}
