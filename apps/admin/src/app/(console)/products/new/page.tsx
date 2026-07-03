'use client';

/**
 * Create product (Milestone 1.7a) — PRODUCT_WRITE. Loads categories for the
 * select, then hands off to the shared ProductForm.
 */
import { useAsync } from '@/lib/use-async';
import { getCategories } from '@/services/catalog';
import { createProduct } from '@/services/products';
import { PageHeader } from '@/features/console/ui';
import { ProductForm } from '@/features/products/ProductForm';

export default function NewProductPage() {
  const { data, loading, error } = useAsync(() => getCategories(), []);

  return (
    <div>
      <PageHeader title="New product" description="Add a piece to the catalog." />
      {loading && data === null && <p className="text-sm text-ink-soft">Loading…</p>}
      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      {data !== null && (
        <ProductForm mode="create" categories={data.items} onSubmit={createProduct} />
      )}
    </div>
  );
}
