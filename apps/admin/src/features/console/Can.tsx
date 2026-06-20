'use client';

/**
 * Permission gate (Milestone 1.7) — renders children only when the signed-in
 * staff role holds `permission`. This is a CONVENIENCE for hiding controls the
 * user can't use; the API enforces the real boundary (every /admin route runs
 * requirePermission). Never rely on this for security.
 */
import type { ReactNode } from 'react';
import { hasPermission, isRole } from '@sajawat/shared';
import type { Permission } from '@sajawat/shared';
import { useAuth } from '@/features/auth/auth-context';

export function useCan(permission: Permission): boolean {
  const { user } = useAuth();
  if (user === null || !isRole(user.role)) return false;
  return hasPermission(user.role, permission);
}

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useCan(permission) ? <>{children}</> : <>{fallback}</>;
}
