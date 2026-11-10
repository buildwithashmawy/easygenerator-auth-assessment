import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, type User } from '@/lib/api';
import type { SignInValues, SignUpValues } from './schemas';

type Status = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: User | null;
  status: Status;
  signIn: (values: SignInValues) => Promise<User>;
  signUp: (values: SignUpValues) => Promise<User>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  // Restore the session on load: the httpOnly cookies are invisible to JS, so ask the API.
  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((u) => !cancelled && (setUser(u), setStatus('authenticated')))
      .catch((err: unknown) => {
        if (cancelled) return;
        if (!(err instanceof ApiError) || err.status !== 401) console.error(err);
        setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (values: SignInValues) => {
    const { user } = await api.signIn(values);
    setUser(user);
    setStatus('authenticated');
    return user;
  }, []);

  const signUp = useCallback(async (values: SignUpValues) => {
    const { user } = await api.signUp(values);
    setUser(user);
    setStatus('authenticated');
    return user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.signOut();
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
