import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { forbidden } from '../http/respondError';

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.auth?.role !== 'admin') {
    forbidden(res, 'Esta operacao exige permissao de administrador.', 'ADMIN_ACCESS_REQUIRED');
    return;
  }
  next();
}
