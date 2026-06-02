/** Shared auth catalog (RBAC + password policy) — Milestone 0.7. */
export {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  isRole,
} from './roles.js';
export type { Role, Permission } from './roles.js';
export { passwordSchema, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from './password-policy.js';
export type { Password } from './password-policy.js';
