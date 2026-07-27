/**
 * Admin DTOs (Milestone 1.7) — wire shapes the operations console consumes from
 * `/admin/*`. These mirror the API module's internal admin types (product /
 * inventory); kept here so the admin app shares a single source of truth without
 * importing across the service boundary.
 */
import type { ProductImage, ProductSeo, ProductVideo } from './catalog.js';

export type ProductStatus = 'draft' | 'active' | 'archived';

/** Media kind an admin upload resolves to (Milestone 1.3-media). */
export type MediaKind = 'image' | 'video';

/** Result of `POST /admin/media` — a durable public URL for the stored object. */
export interface MediaUploadResult {
  url: string;
  kind: MediaKind;
  contentType: string;
  bytes: number;
  width?: number | undefined;
  height?: number | undefined;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | undefined;
  description?: string | undefined;
  sku: string;
  /** Physical scannable code (EAN/UPC/Code-128); distinct from `sku`. Optional, unique if set. */
  barcode?: string | undefined;
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

/* ------------------------------ Catalog (1.7b) ----------------------------- */

export type CategoryStatus = 'active' | 'inactive';
export type CollectionStatus = 'active' | 'inactive';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | undefined;
  image?: string | undefined;
  status: CategoryStatus;
  sortOrder: number;
  /** Null = top-level; otherwise the id of the parent category (one level deep). */
  parentId?: string | null;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description?: string | undefined;
  bannerImage?: string | undefined;
  status: CollectionStatus;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

/* ---------------------------- Promotions (1.7b) ---------------------------- */

export type PromotionTrigger = 'automatic' | 'coupon';
export type RewardType = 'percentage' | 'fixed';
export type PromotionStatus = 'active' | 'inactive';

export interface AdminPromotion {
  id: string;
  name: string;
  trigger: PromotionTrigger;
  code?: string | undefined;
  rewardType: RewardType;
  value: number;
  minCartValue: number;
  maxDiscount?: number | null | undefined;
  startDate?: Date | null | undefined;
  endDate?: Date | null | undefined;
  usageLimit?: number | null | undefined;
  perCustomerLimit?: number | null | undefined;
  status: PromotionStatus;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

/* ----------------------------- Settings (1.8) ------------------------------ */

/** Business settings singleton. `adminWhatsappNumber` is the lead-alert target. */
export interface AdminSettings {
  businessName?: string | undefined;
  supportEmail?: string | undefined;
  /** E.164 number that receives instant WhatsApp lead alerts; null = unset. */
  adminWhatsappNumber?: string | null | undefined;
  /** Public storefront display fields (Contact page — 1.3-media era). */
  instagramUrl?: string | undefined;
  facebookUrl?: string | undefined;
  youtubeUrl?: string | undefined;
  addressText?: string | undefined;
  businessHours?: string | undefined;
  updatedAt?: Date | undefined;
}

/**
 * Non-secret business info exposed publicly (`GET /api/v1/settings/public`) for
 * the storefront Contact page. Only display fields — never alert targets/secrets.
 */
export interface PublicSettings {
  businessName?: string | undefined;
  supportEmail?: string | undefined;
  /** Public WhatsApp number for the storefront (same value as the alert number). */
  whatsappNumber?: string | undefined;
  instagramUrl?: string | undefined;
  facebookUrl?: string | undefined;
  youtubeUrl?: string | undefined;
  addressText?: string | undefined;
  businessHours?: string | undefined;
}
