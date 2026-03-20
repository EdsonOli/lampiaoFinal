import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Use statusCode from AppError if available, otherwise default to 500
  const statusCode = (err as AppError & { statusCode: number }).statusCode ?? 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
  });
}
