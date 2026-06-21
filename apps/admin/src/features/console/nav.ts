/**
 * Console navigation model (Milestone 1.7). Each item declares the permission
 * required to see it; the sidebar filters against the signed-in role using the
 * shared RBAC catalog. `permission: null` = visible to any staff member.
 *
 * Only routes that exist are listed.
 */
import { PERMISSIONS } from '@sajawat/shared';
import type { Permission } from '@sajawat/shared';

export interface NavItem {
  href: string;
  label: string;
  /** Required permission, or null for any staff role. */
  permission: Permission | null;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Dashboard', permission: null },
  { href: '/orders', label: 'Orders', permission: PERMISSIONS.ORDER_READ },
  { href: '/products', label: 'Products', permission: PERMISSIONS.PRODUCT_READ },
  { href: '/inventory', label: 'Inventory', permission: PERMISSIONS.INVENTORY_READ },
  { href: '/categories', label: 'Categories', permission: PERMISSIONS.CATEGORY_WRITE },
  { href: '/collections', label: 'Collections', permission: PERMISSIONS.COLLECTION_WRITE },
  { href: '/promotions', label: 'Promotions', permission: PERMISSIONS.COUPON_WRITE },
  { href: '/crm', label: 'CRM leads', permission: PERMISSIONS.CRM_READ },
  { href: '/settings', label: 'Settings', permission: PERMISSIONS.SETTINGS_MANAGE },
];
