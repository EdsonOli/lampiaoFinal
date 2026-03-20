import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Internal server error';

  // Mapeamento de mensagens de domínio para status HTTP
  const domainToStatus: Record<string, number> = {
    'User already exists': 409,
    'Email already in use': 409,
    'Invalid credentials': 401,
    'User not found': 404,
    'Book not found': 404,
    'Post not found': 404,
    'Comment not found': 404,
    'Notebook entry not found': 404,
    'Notebook entry already exists': 409,
    'Forbidden notebook access': 403,
    'Forbidden post access': 403,
    'Forbidden comment access': 403,
    'Not authorized': 403,
  };

  const resolvedStatus = domainToStatus[message] ?? statusCode;

  res.status(resolvedStatus).json({
    message,
    ...(err.code ? { code: err.code } : {}),
  });
}
