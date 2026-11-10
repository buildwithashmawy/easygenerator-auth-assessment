/**
 * Tiny fetch wrapper. Auth tokens live in httpOnly cookies, so the client never touches
 * them: we only send `credentials: 'include'` and transparently refresh once on a 401.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessTokenExpiresAt: string;
}

interface ErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, body: ErrorBody | null) {
    const messages = Array.isArray(body?.message)
      ? body.message
      : [body?.message ?? defaultMessage(status)];
    super(messages[0]);
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
  }
}

function defaultMessage(status: number): string {
  if (status === 0) return 'Can’t reach the server. Check your connection and try again.';
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Request failed';
}

const BASE = '/api';
/** Endpoints where a 401 means "bad credentials", not "expired session". */
const NO_REFRESH = ['/auth/signin', '/auth/signup', '/auth/refresh', '/auth/signout'];

let refreshInFlight: Promise<boolean> | null = null;

/** Single-flight refresh: concurrent 401s share one refresh request. */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
  } catch {
    throw new ApiError(0, null);
  }

  if (res.status === 401 && retry && !NO_REFRESH.includes(path) && (await refreshSession())) {
    return request<T>(path, init, false);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorBody | null;
    // Let the friendlier client-side defaults win for opaque server/network failures.
    throw new ApiError(res.status, res.status === 429 || res.status >= 500 ? null : body);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  signUp: (data: { email: string; name: string; password: string }) =>
    post<AuthResponse>('/auth/signup', data),
  signIn: (data: { email: string; password: string }) => post<AuthResponse>('/auth/signin', data),
  signOut: () => post<void>('/auth/signout'),
  me: () => request<User>('/users/me'),
};
