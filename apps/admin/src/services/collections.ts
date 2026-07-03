/**
 * Admin collections service (Milestone 1.7b) — wraps /admin/collections CRUD
 * (COLLECTION_WRITE). Returns AdminCollection DTOs.
 */
import { apiFetch } from '@/lib/api';
import type { AdminCollection, CollectionStatus, Paginated } from '@sajawat/types';

export interface CollectionWriteInput {
  name: string;
  slug?: string;
  description?: string;
  bannerImage?: string;
  status?: CollectionStatus;
}

export function listCollections(
  query: { page?: number; limit?: number } = {},
): Promise<Paginated<AdminCollection>> {
  const sp = new URLSearchParams();
  if (query.page !== undefined) sp.set('page', String(query.page));
  sp.set('limit', String(query.limit ?? 100));
  return apiFetch<Paginated<AdminCollection>>(`/admin/collections?${sp.toString()}`);
}

export function createCollection(input: CollectionWriteInput): Promise<AdminCollection> {
  return apiFetch<AdminCollection>('/admin/collections', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCollection(
  id: string,
  input: Partial<CollectionWriteInput>,
): Promise<AdminCollection> {
  return apiFetch<AdminCollection>(`/admin/collections/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCollection(id: string): Promise<void> {
  return apiFetch<void>(`/admin/collections/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
