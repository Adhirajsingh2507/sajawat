/**
 * Admin products service (Milestone 1.7a) — wraps /admin/products CRUD. Product
 * media are URL references (GCS upload lands in 1.3-media), so images are passed
 * as `{ url, alt?, position }` objects.
 */
import { apiFetch } from '@/lib/api';
import type { AdminProduct, Paginated, ProductImage, ProductStatus } from '@sajawat/types';

export interface ProductListQuery {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
}

/** Fields accepted by create; update sends a Partial of the same. */
export interface ProductWriteInput {
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  categoryId: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  salePrice?: number;
  collectionIds?: string[];
  images?: ProductImage[];
  status?: ProductStatus;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  quantity?: number;
  lowStockThreshold?: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const out = sp.toString();
  return out.length > 0 ? `?${out}` : '';
}

export function listProducts(query: ProductListQuery = {}): Promise<Paginated<AdminProduct>> {
  return apiFetch<Paginated<AdminProduct>>(`/admin/products${qs({ ...query })}`);
}

export function getProduct(id: string): Promise<AdminProduct> {
  return apiFetch<AdminProduct>(`/admin/products/${encodeURIComponent(id)}`);
}

/** Look up a product by its physical scannable barcode (admin scan flows). */
export function getProductByBarcode(code: string): Promise<AdminProduct> {
  return apiFetch<AdminProduct>(`/admin/products/barcode/${encodeURIComponent(code)}`);
}

export function createProduct(input: ProductWriteInput): Promise<AdminProduct> {
  return apiFetch<AdminProduct>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProduct(
  id: string,
  input: Partial<ProductWriteInput>,
): Promise<AdminProduct> {
  return apiFetch<AdminProduct>(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
