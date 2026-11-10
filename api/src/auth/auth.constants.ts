export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
/** The refresh cookie is only ever sent to the auth endpoints. */
export const REFRESH_COOKIE_PATH = '/api/auth';
export const ACCESS_COOKIE_PATH = '/api';
/** Concurrent refreshes (e.g. two tabs) inside this window are not treated as token theft. */
export const REFRESH_REUSE_GRACE_MS = 10_000;

export interface AccessTokenPayload {
  sub: string;
  email: string;
}
