/**
 * Admin categories service (Milestone 1.7b) — wraps /admin/categories CRUD
 * (CATEGORY_WRITE). Returns AdminCategory DTOs.
 */
import { apiFetch } from '@/lib/api';
import type { AdminCategory, CategoryStatus, Paginated } from '@sajawat/types';

export interface CategoryWriteInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  status?: CategoryStatus;
  sortOrder?: number;
}

export function listCategories(
  query: { page?: number; limit?: number } = {},
): Promise<Paginated<AdminCategory>> {
  const sp = new URLSearchParams();
  if (query.page !== undefined) sp.set('page', String(query.page));
  sp.set('limit', String(query.limit ?? 100));
  return apiFetch<Paginated<AdminCategory>>(`/admin/categories?${sp.toString()}`);
}

export function createCategory(input: CategoryWriteInput): Promise<AdminCategory> {
  return apiFetch<AdminCategory>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCategory(
  id: string,
  input: Partial<CategoryWriteInput>,
): Promise<AdminCategory> {
  return apiFetch<AdminCategory>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
