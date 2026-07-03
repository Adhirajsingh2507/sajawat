/**
 * Public catalog DTOs (Milestone 1.3) — the wire shapes the storefront consumes.
 * This is a TYPE-ONLY package (no runtime emit), so everything here is an
 * interface/type; the API owns the runtime mappers that produce these shapes.
 */

/** Generic paginated list envelope (mirrors BaseRepository.paginate). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | undefined;
  image?: string | undefined;
  sortOrder: number;
}

export interface PublicCollection {
  id: string;
  name: string;
  slug: string;
  description?: string | undefined;
  bannerImage?: string | undefined;
}

export interface ProductImage {
  url: string;
  alt?: string | undefined;
  position: number;
}

export interface ProductVideo {
  url: string;
}

export interface ProductSeo {
  title?: string | undefined;
  description?: string | undefined;
  keywords: string[];
}

export interface PublicProduct {
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
  isFeatured: boolean;
  isBestSeller: boolean;
  /** Derived from the 1:1 inventory record (status !== out_of_stock). */
  inStock: boolean;
}
