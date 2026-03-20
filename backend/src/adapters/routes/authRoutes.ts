import { NextFunction, Request, Response, Router } from 'express';
import { Container } from '../container';
import { loginRateLimiter, registerRateLimiter } from '../middlewares/rateLimiters';
import { getAuthCookieOptions, getRefreshCookieOptions, AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from '../security/authCookie';
import { JwtTokenService } from '../services/JwtTokenService';
import { authenticate, AuthenticatedRequest } from '../middlewares/authenticate';
import { tokenBlacklistService } from '../services/TokenBlacklistService';
import { auditLog } from '../services/AuditLogger';
import { toPublicUserDTO } from '../presenters/UserPresenter';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizeOptionalPlainText } from '../validation/sanitizers';
import { loginSchema, registerSchema } from '../validation/schemas';

const router = Router();
const refreshTokenService = new JwtTokenService({
  secret: process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET || 'lampiao-dev-secret'}:refresh`,
  expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
});

// Get use cases from container (no direct instantiation)
const { createUser, authenticateUser, getUserById } = Container.useCases;
const { tokenService } = Container.services;

async function issueSessionCookies(res: Response, user: { id: string; email: string }): Promise<void> {
  const accessToken = await tokenService.sign({
    sub: String(user.id),
    email: user.email,
  });
  const refreshToken = await refreshTokenService.sign({
    sub: String(user.id),
    email: user.email,
  });

  res.cookie(AUTH_COOKIE_NAME, accessToken, getAuthCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

router.post('/register', registerRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseOrThrow(registerSchema, req.body);

    const user = await createUser.execute({
      name: payload.name,
      email: payload.email,
      nickname: payload.nickname,
      password: payload.password,
      img: sanitizeOptionalPlainText(payload.img),
    });

    await auditLog('auth.register', { userId: user.id, email: user.email });

    res.status(201).json(toPublicUserDTO(user));
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json({ message: getValidationMessage(error) });
    }

    next(error);
  }
});

router.post('/login', loginRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseOrThrow(loginSchema, req.body);

    const auth = await authenticateUser.execute({ email: payload.email, password: payload.password });
    const user = await getUserById.execute(auth.userId);

    if (user) {
      await issueSessionCookies(res, user);
    }
    await auditLog('auth.login', { userId: auth.userId, email: payload.email });

    res.json({
      user: user ? toPublicUserDTO(user) : null,
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json({ message: getValidationMessage(error) });
    }

    next(error);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = typeof req.cookies?.[REFRESH_COOKIE_NAME] === 'string'
      ? req.cookies[REFRESH_COOKIE_NAME]
      : undefined;

    if (!refreshToken || tokenBlacklistService.isRevoked(refreshToken)) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const payload = await refreshTokenService.verify(refreshToken);
    const user = await getUserById.execute(String(payload.sub));

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    tokenBlacklistService.revoke(refreshToken, payload.exp);
    await issueSessionCookies(res, user);
    await auditLog('auth.refresh', { userId: user.id, email: user.email });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;
    const cookieToken = typeof req.cookies?.[AUTH_COOKIE_NAME] === 'string'
      ? req.cookies[AUTH_COOKIE_NAME]
      : undefined;
    const refreshToken = typeof req.cookies?.[REFRESH_COOKIE_NAME] === 'string'
      ? req.cookies[REFRESH_COOKIE_NAME]
      : undefined;
    const token = cookieToken ?? bearerToken;

    if (token) {
      const payload = await tokenService.verify(token);
      tokenBlacklistService.revoke(token, payload.exp);
    }

    if (refreshToken) {
      try {
        const payload = await refreshTokenService.verify(refreshToken);
        tokenBlacklistService.revoke(refreshToken, payload.exp);
      } catch {
        // Ignore invalid refresh tokens on logout.
      }
    }

    await auditLog('auth.logout', { userId: req.auth?.userId ?? null, email: req.auth?.email ?? null });

    res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
