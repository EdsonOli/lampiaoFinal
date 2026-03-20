import { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'lampiao_auth';
export const REFRESH_COOKIE_NAME = 'lampiao_refresh';

export function getAuthCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60 * 1000,
  };
}

export function getRefreshCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}