import type { CookieOptions, Response } from 'express';
import {
  ACCESS_COOKIE_PATH,
  ACCESS_TOKEN_COOKIE,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE,
} from './auth.constants';
import type { IssuedTokens } from './auth.service';

/**
 * Tokens live in httpOnly cookies, so JavaScript (and therefore XSS) can never read them.
 * SameSite=Strict + a same-origin deployment closes the CSRF hole that cookies open.
 */
function baseOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: 'strict' };
}

export function setAuthCookies(res: Response, tokens: IssuedTokens, secure: boolean): void {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseOptions(secure),
    path: ACCESS_COOKIE_PATH,
    expires: tokens.accessTokenExpiresAt,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseOptions(secure),
    path: REFRESH_COOKIE_PATH,
    expires: tokens.refreshTokenExpiresAt,
  });
}

export function clearAuthCookies(res: Response, secure: boolean): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseOptions(secure), path: ACCESS_COOKIE_PATH });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...baseOptions(secure), path: REFRESH_COOKIE_PATH });
}
