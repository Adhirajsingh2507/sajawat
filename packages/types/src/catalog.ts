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
