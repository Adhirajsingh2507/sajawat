'use client';

/**
 * Edit product (Milestone 1.7a) — PRODUCT_WRITE to edit, PRODUCT_DELETE to
 * remove. Loads the product + categories, reuses the shared ProductForm, and
 * offers a guarded delete.
 */
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PERMISSIONS } from '@sajawat/shared';
import { useAsync } from '@/lib/use-async';
import { getCategories } from '@/services/catalog';
import { deleteProduct, getProduct, updateProduct } from '@/services/products';
import { ApiError } from '@/lib/api';
import { useCan } from '@/features/console/Can';
import { PageHeader } from '@/features/console/ui';
import { ProductForm } from '@/features/products/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const canDelete = useCan(PERMISSIONS.PRODUCT_DELETE);

  const product = useAsync(() => getProduct(id), [id]);
  const categories = useAsync(() => getCategories(), []);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function onDelete() {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(true);
    setDeleteError(null);
    void deleteProduct(id)
      .then(() => {
        router.replace('/products');
        router.refresh();
      })
      .catch((err: unknown) => {
        setDeleteError(err instanceof ApiError ? err.message : 'Could not delete the product.');
        setDeleting(false);
      });
  }

  if (product.data === null || categories.data === null) {
    return (
      <p className="text-sm text-ink-soft">
        {product.loading || categories.loading
          ? 'Loading…'
          : (product.error ?? categories.error ?? 'Product not found.')}
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title={product.data.name}
        description={`SKU ${product.data.sku}`}
        action={
          canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex h-10 items-center rounded-full border border-red-200 px-5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : undefined
        }
      />
      {deleteError !== null && <p className="mb-4 text-sm text-red-600">{deleteError}</p>}
      <ProductForm
        mode="edit"
        categories={categories.data.items}
        initial={product.data}
        onSubmit={(input) => updateProduct(id, input)}
      />
    </div>
  );
}
