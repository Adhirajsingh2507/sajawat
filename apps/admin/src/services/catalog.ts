/**
 * Catalog reads (Milestone 1.7a) — categories/collections used to populate the
 * product form selects. Full catalog CRUD arrives with 1.7b; for now these are
 * read-only lookups against the (auth-gated) public catalog endpoints.
 */
import { apiFetch } from '@/lib/api';
import type { Paginated, PublicCategory, PublicCollection } from '@sajawat/types';

export function getCategories(): Promise<Paginated<PublicCategory>> {
  return apiFetch<Paginated<PublicCategory>>('/categories?limit=100');
}

export function getCollections(): Promise<Paginated<PublicCollection>> {
  return apiFetch<Paginated<PublicCollection>>('/collections?limit=100');
}
