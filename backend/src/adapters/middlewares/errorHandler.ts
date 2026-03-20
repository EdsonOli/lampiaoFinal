import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  const payload: { error: string; code?: string } = {
    error: message,
  };

  if (isAppError && typeof err.code === 'string') {
    payload.code = err.code;
  }

  res.status(statusCode).json(payload);
}
