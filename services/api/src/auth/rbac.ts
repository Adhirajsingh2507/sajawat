/**
 * RBAC bridge (Milestone 0.7, AD-20) — the API's single import point for the
 * centralized catalog defined in `@sajawat/shared`. Permission checks resolve a
 * user's role against `ROLE_PERMISSIONS` here; the matrix is never duplicated.
 */
export {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  isRole,
} from '@sajawat/shared';
export type { Role, Permission } from '@sajawat/shared';
