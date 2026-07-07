'use client';

/**
 * Auth context (Milestone 1.4a) — drives the fully login-gated storefront.
 * On mount it silently refreshes (the httpOnly refresh cookie is same-site, so
 * it is sent): success → in-memory access token + authenticated; failure →
 * unauthenticated → the gate redirects to /login.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch, setAccessToken } from '@/lib/api';

export interface UserAddress {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  address?: UserAddress;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthResultData {
  user: PublicUser;
  accessToken: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Replace the in-memory user after a profile update. */
  updateUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<PublicUser | null>(null);

  const applySession = useCallback((data: AuthResultData) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const { accessToken } = await apiFetch<{ accessToken: string }>('/auth/refresh-token', {
        method: 'POST',
      });
      setAccessToken(accessToken);
      const { user: me } = await apiFetch<{ user: PublicUser }>('/auth/me');
      setUser(me);
      setStatus('authenticated');
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    // Legitimate external-system sync: establish the session from the auth API
    // on mount. State is set only AFTER awaited network calls, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResultData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      applySession(data);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await apiFetch<AuthResultData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      applySession(data);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUser = useCallback((next: PublicUser) => {
    setUser(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout, updateUser }),
    [status, user, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
