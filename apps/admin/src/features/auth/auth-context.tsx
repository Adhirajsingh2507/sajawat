'use client';

/**
 * Admin auth context (Milestone 1.7) — mirrors the storefront provider but is
 * role-aware: the console is for staff only. On mount it silently refreshes
 * (httpOnly refresh cookie is same-site); success → in-memory access token +
 * the user's role drives the gate. There is no self-registration in admin.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ROLES, isRole } from '@sajawat/shared';
import type { Role } from '@sajawat/shared';
import { apiFetch, setAccessToken } from '@/lib/api';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthResultData {
  user: AdminUser;
  accessToken: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AdminUser | null;
  /** True when the signed-in user holds a staff role (anything but `customer`). */
  isStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Any role that is not a plain customer is staff (console-eligible). */
export function isStaffRole(role: string): boolean {
  return isRole(role) && (role as Role) !== ROLES.CUSTOMER;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AdminUser | null>(null);

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
      const { user: me } = await apiFetch<{ user: AdminUser }>('/auth/me');
      setUser(me);
      setStatus('authenticated');
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    // Legitimate external-system sync: establish the session from the auth API
    // on mount. State is set only AFTER awaited network calls.
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

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isStaff: user !== null && isStaffRole(user.role),
      login,
      logout,
    }),
    [status, user, login, logout],
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
