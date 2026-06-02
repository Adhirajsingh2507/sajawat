import { describe, it, expect } from 'vitest';
import { ROLES, PERMISSIONS, hasPermission, getPermissionsForRole, isRole } from './roles.js';

describe('RBAC matrix', () => {
  it('SUPER_ADMIN has every permission', () => {
    for (const permission of Object.values(PERMISSIONS)) {
      expect(hasPermission(ROLES.SUPER_ADMIN, permission)).toBe(true);
    }
  });

  it('CUSTOMER has no admin permissions', () => {
    expect(getPermissionsForRole(ROLES.CUSTOMER)).toHaveLength(0);
    expect(hasPermission(ROLES.CUSTOMER, PERMISSIONS.PRODUCT_WRITE)).toBe(false);
  });

  it('ADMIN can write products but not manage roles', () => {
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.PRODUCT_WRITE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.ROLE_MANAGE)).toBe(false);
  });

  it('INVENTORY_STAFF is scoped to inventory/product-read', () => {
    expect(hasPermission(ROLES.INVENTORY_STAFF, PERMISSIONS.INVENTORY_WRITE)).toBe(true);
    expect(hasPermission(ROLES.INVENTORY_STAFF, PERMISSIONS.ORDER_WRITE)).toBe(false);
  });

  it('MARKETING_TEAM owns CMS/collections, not orders', () => {
    expect(hasPermission(ROLES.MARKETING_TEAM, PERMISSIONS.CMS_WRITE)).toBe(true);
    expect(hasPermission(ROLES.MARKETING_TEAM, PERMISSIONS.ORDER_WRITE)).toBe(false);
  });

  it('CUSTOMER_SUPPORT can read users and work orders/CRM', () => {
    expect(hasPermission(ROLES.CUSTOMER_SUPPORT, PERMISSIONS.ORDER_WRITE)).toBe(true);
    expect(hasPermission(ROLES.CUSTOMER_SUPPORT, PERMISSIONS.USER_READ)).toBe(true);
    expect(hasPermission(ROLES.CUSTOMER_SUPPORT, PERMISSIONS.PRODUCT_WRITE)).toBe(false);
  });
});

describe('isRole guard', () => {
  it('accepts known roles and rejects others', () => {
    expect(isRole('admin')).toBe(true);
    expect(isRole('super_admin')).toBe(true);
    expect(isRole('root')).toBe(false);
    expect(isRole(42)).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});
