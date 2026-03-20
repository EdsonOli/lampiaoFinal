import { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME, getAuthCookieOptions } from '../security/authCookie';
import { JwtTokenService } from '../services/JwtTokenService';
import { SequelizeUserRepository } from '../repositories/SequelizeUserRepository';
import { tokenBlacklistService } from '../services/TokenBlacklistService';

const tokenService = new JwtTokenService();
const refreshTokenService = new JwtTokenService({
  secret: process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET || 'lampiao-dev-secret'}:refresh`,
  expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
});
const userRepository = new SequelizeUserRepository();

async function resolveAuth(req: Request, res?: Response): Promise<AuthenticatedRequest['auth'] | null> {
  const authHeader = req.headers.authorization;
  const cookieToken = typeof req.cookies?.[AUTH_COOKIE_NAME] === 'string'
    ? req.cookies[AUTH_COOKIE_NAME]
    : undefined;
  const refreshToken = typeof req.cookies?.[REFRESH_COOKIE_NAME] === 'string'
    ? req.cookies[REFRESH_COOKIE_NAME]
    : undefined;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined;
  const token = cookieToken ?? bearerToken;

  if (token && !tokenBlacklistService.isRevoked(token)) {
    try {
      const payload = await tokenService.verify(token);
      const userId = String(payload.sub);
      const user = await userRepository.findById(userId);

      if (user) {
        return {
          userId,
          email: payload.email,
          role: user.role,
        };
      }
    } catch {
      // Fall through to refresh-token recovery.
    }
  }

  if (!refreshToken || tokenBlacklistService.isRevoked(refreshToken)) {
    return null;
  }

  const refreshPayload = await refreshTokenService.verify(refreshToken);
  const userId = String(refreshPayload.sub);
  const user = await userRepository.findById(userId);

  if (!user) {
    return null;
  }

  if (res) {
    const renewedAccessToken = await tokenService.sign({
      sub: String(user.id),
      email: user.email,
    });
    res.cookie(AUTH_COOKIE_NAME, renewedAccessToken, getAuthCookieOptions());
  }

  return {
    userId,
    email: refreshPayload.email,
    role: user.role,
  };
}

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const hasCredentials = Boolean(req.headers.authorization) || typeof req.cookies?.[AUTH_COOKIE_NAME] === 'string';

  if (!hasCredentials) {
    res.status(401).json({ message: 'Missing bearer token' });
    return;
  }

  try {
    const auth = await resolveAuth(req, res);

    if (!auth) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.auth = auth;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const auth = await resolveAuth(req, res);
    if (auth) {
      req.auth = auth;
    }
  } catch {
    // Invalid optional credentials should be ignored for public endpoints.
  }

  next();
}
