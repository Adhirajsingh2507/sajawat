/**
 * Admin DTOs (Milestone 1.7) — wire shapes the operations console consumes from
 * `/admin/*`. These mirror the API module's internal admin types (product /
 * inventory); kept here so the admin app shares a single source of truth without
 * importing across the service boundary.
 */
import type { ProductImage, ProductSeo, ProductVideo } from './catalog.js';

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | undefined;
  description?: string | undefined;
  sku: string;
  price: number;
  salePrice?: number | undefined;
  categoryId: string;
  collectionIds: string[];
  images: ProductImage[];
  video?: ProductVideo | undefined;
  seo: ProductSeo;
  ogImage?: string | undefined;
  status: ProductStatus;
  isFeatured: boolean;
  isBestSeller: boolean;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface AdminInventory {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  status: InventoryStatus;
  updatedAt?: Date | undefined;
}

export type MovementType =
  | 'stock_added'
  | 'stock_removed'
  | 'manual_adjustment'
  | 'return'
  | 'order';

export interface AdminInventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason?: string | undefined;
  performedBy: string;
  createdAt?: Date | undefined;
}

/** The adjustment types an admin may apply (the `order` type is system-only). */
export type AdminMovementType = Exclude<MovementType, 'order'>;
