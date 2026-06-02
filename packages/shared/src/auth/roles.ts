/**
 * Centralized RBAC catalog (Milestone 0.7, AD-20).
 *
 * Single source of truth for roles, the permission catalog, and the
 * role→permission matrix — consumed by the API now and the admin UI later.
 * Permissions are typed `module:action` strings; checks never use magic strings.
 *
 * The access token carries a user's **role** only; permissions are resolved
 * from this matrix at check time (keeps tokens small and the matrix canonical).
 */

/** All roles in the system (values stored on the user record). */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  INVENTORY_STAFF: 'inventory_staff',
  MARKETING_TEAM: 'marketing_team',
  CUSTOMER_SUPPORT: 'customer_support',
  CUSTOMER: 'customer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Permission catalog: `<module>:<action>`. Extend here as modules land. */
export const PERMISSIONS = {
  PRODUCT_READ: 'product:read',
  PRODUCT_WRITE: 'product:write',
  PRODUCT_DELETE: 'product:delete',
  CATEGORY_WRITE: 'category:write',
  COLLECTION_WRITE: 'collection:write',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  ORDER_READ: 'order:read',
  ORDER_WRITE: 'order:write',
  PAYMENT_READ: 'payment:read',
  COUPON_WRITE: 'coupon:write',
  REVIEW_MODERATE: 'review:moderate',
  CRM_READ: 'crm:read',
  CRM_WRITE: 'crm:write',
  CMS_WRITE: 'cms:write',
  BLOG_WRITE: 'blog:write',
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  ROLE_MANAGE: 'role:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_READ: 'audit:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);
const P = PERMISSIONS;

/**
 * Role → permissions. SUPER_ADMIN holds every permission; the rest are scoped
 * to their function. Customer-owned-resource access (own orders/reviews) is
 * enforced at the service layer in Phase 1, not via these admin permissions.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [ROLES.ADMIN]: [
    P.PRODUCT_READ,
    P.PRODUCT_WRITE,
    P.PRODUCT_DELETE,
    P.CATEGORY_WRITE,
    P.COLLECTION_WRITE,
    P.INVENTORY_READ,
    P.INVENTORY_WRITE,
    P.ORDER_READ,
    P.ORDER_WRITE,
    P.PAYMENT_READ,
    P.COUPON_WRITE,
    P.REVIEW_MODERATE,
    P.CRM_READ,
    P.CRM_WRITE,
    P.CMS_WRITE,
    P.BLOG_WRITE,
    P.USER_READ,
    P.AUDIT_READ,
  ],
  [ROLES.MANAGER]: [
    P.PRODUCT_READ,
    P.PRODUCT_WRITE,
    P.INVENTORY_READ,
    P.INVENTORY_WRITE,
    P.ORDER_READ,
    P.ORDER_WRITE,
    P.REVIEW_MODERATE,
    P.CRM_READ,
    P.CRM_WRITE,
  ],
  [ROLES.INVENTORY_STAFF]: [P.PRODUCT_READ, P.INVENTORY_READ, P.INVENTORY_WRITE],
  [ROLES.MARKETING_TEAM]: [
    P.PRODUCT_READ,
    P.COLLECTION_WRITE,
    P.COUPON_WRITE,
    P.CMS_WRITE,
    P.BLOG_WRITE,
  ],
  [ROLES.CUSTOMER_SUPPORT]: [P.ORDER_READ, P.ORDER_WRITE, P.CRM_READ, P.CRM_WRITE, P.USER_READ],
  [ROLES.CUSTOMER]: [],
};

/** Permissions granted to a role (empty array for unknown roles). */
export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** True if `role` is granted `permission`. */
export function hasPermission(role: Role, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

/** Type guard: is `value` a known role? */
export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (Object.values(ROLES) as string[]).includes(value);
}
