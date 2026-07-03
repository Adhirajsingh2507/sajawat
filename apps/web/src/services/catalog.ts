/**
 * Catalog service (Milestone 1.4b) — typed reads from the public catalog API.
 * UI never calls `apiFetch` directly (coding-standards: service layer).
 */
import { apiFetch } from '@/lib/api';
import type {
  Paginated,
  PublicCategory,
  PublicCollection,
  PublicOffer,
  PublicProduct,
} from '@sajawat/types';

type QueryValue = string | number | boolean | undefined;

function qs(params: Record<string, QueryValue>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') sp.set(key, String(value));
  }
  const out = sp.toString();
  return out.length > 0 ? `?${out}` : '';
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  collection?: string;
  featured?: boolean;
  bestSeller?: boolean;
}

export function getProducts(query: ProductQuery = {}): Promise<Paginated<PublicProduct>> {
  return apiFetch<Paginated<PublicProduct>>(`/products${qs({ ...query })}`);
}

export function searchProducts(
  q: string,
  query: { page?: number; limit?: number } = {},
): Promise<Paginated<PublicProduct>> {
  return apiFetch<Paginated<PublicProduct>>(`/products/search${qs({ q, ...query })}`);
}

export function getProductBySlug(slug: string): Promise<PublicProduct> {
  return apiFetch<PublicProduct>(`/products/${encodeURIComponent(slug)}`);
}

export function getCategories(): Promise<Paginated<PublicCategory>> {
  return apiFetch<Paginated<PublicCategory>>('/categories?limit=100');
}

export function getCategoryBySlug(slug: string): Promise<PublicCategory> {
  return apiFetch<PublicCategory>(`/categories/${encodeURIComponent(slug)}`);
}

export function getCollections(): Promise<Paginated<PublicCollection>> {
  return apiFetch<Paginated<PublicCollection>>('/collections?limit=100');
}

export function getOffers(): Promise<{ items: PublicOffer[] }> {
  return apiFetch<{ items: PublicOffer[] }>('/offers');
}

export function getCollectionBySlug(slug: string): Promise<PublicCollection> {
  return apiFetch<PublicCollection>(`/collections/${encodeURIComponent(slug)}`);
}
