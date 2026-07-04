/**
 * Product types (Milestone 1.3b). Single SKU per product (no variants, locked).
 * Embedded image/video/seo shapes reuse the public DTO interfaces. Media are
 * URL/key references (GCS upload deferred to 1.3-media).
 */
import type { Types } from 'mongoose';
import type { ProductImage, ProductSeo, ProductVideo } from '@sajawat/types';

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface IProduct {
  name: string;
  slug: string;
  shortDescription?: string | undefined;
  description?: string | undefined;
  sku: string;
  barcode?: string | undefined;
  price: number;
  salePrice?: number | undefined;
  categoryId: Types.ObjectId | string;
  collectionIds: (Types.ObjectId | string)[];
  images: ProductImage[];
  video?: ProductVideo | undefined;
  seo: ProductSeo;
  ogImage?: string | undefined;
  status: ProductStatus;
  isFeatured: boolean;
  isBestSeller: boolean;
  deletedAt?: Date | null;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | undefined;
  description?: string | undefined;
  sku: string;
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
