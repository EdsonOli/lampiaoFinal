import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { tooManyRequests } from '../http/respondError';

type RequestWithAuth = Request & {
  auth?: {
    userId?: string;
  };
  rateLimit?: {
    resetTime?: Date;
  };
};

function getCommentVoteRateLimitKey(req: Request): string {
  const requestWithAuth = req as RequestWithAuth;
  const userId = requestWithAuth.auth?.userId;
  if (userId) {
    return `comment-vote:user:${userId}`;
  }

  return `comment-vote:ip:${ipKeyGenerator(req.ip ?? '0.0.0.0')}`;
}

function getRetryAfterSeconds(req: Request, defaultWindowMs: number): number {
  const requestWithAuth = req as RequestWithAuth;
  const resetTime = requestWithAuth.rateLimit?.resetTime;
  if (resetTime instanceof Date) {
    return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
  }

  return Math.max(1, Math.ceil(defaultWindowMs / 1000));
}

function commentVoteRateLimitHandler(req: Request, res: Response): void {
  const retryAfterSeconds = getRetryAfterSeconds(req, commentRelevanceVoteWindowMs);
  tooManyRequests(
    res,
    'Voce excedeu o limite de votos de relevancia em comentarios. Aguarde um pouco antes de tentar novamente.',
    'RATE_LIMIT_COMMENT_RELEVANCE_VOTE',
    retryAfterSeconds
  );
}

function createRateLimitHandler(message: string, code: 'RATE_LIMIT_GLOBAL' | 'RATE_LIMIT_LOGIN' | 'RATE_LIMIT_REGISTER', windowMs: number) {
  return (req: Request, res: Response): void => {
    const retryAfterSeconds = getRetryAfterSeconds(req, windowMs);
    tooManyRequests(res, message, code, retryAfterSeconds);
  };
}

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'Muitas requisicoes foram feitas em pouco tempo. Aguarde alguns instantes antes de tentar novamente.',
    'RATE_LIMIT_GLOBAL',
    15 * 60 * 1000
  ),
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: createRateLimitHandler(
    'Muitas tentativas de login falharam em pouco tempo. Aguarde cerca de 15 minutos antes de tentar novamente.',
    'RATE_LIMIT_LOGIN',
    15 * 60 * 1000
  ),
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: createRateLimitHandler(
    'Muitas tentativas de cadastro falharam em pouco tempo. Aguarde antes de tentar novamente.',
    'RATE_LIMIT_REGISTER',
    60 * 60 * 1000
  ),
});

const commentRelevanceVoteWindowMs = Number(process.env.COMMENT_RELEVANCE_VOTE_WINDOW_MS || 60 * 1000);
const commentRelevanceVoteMax = Number(process.env.COMMENT_RELEVANCE_VOTE_MAX || 20);

export const commentRelevanceVoteRateLimiter = rateLimit({
  windowMs: commentRelevanceVoteWindowMs,
  max: commentRelevanceVoteMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getCommentVoteRateLimitKey,
  handler: commentVoteRateLimitHandler,
});