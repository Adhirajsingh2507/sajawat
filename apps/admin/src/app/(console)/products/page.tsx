'use client';

/**
 * Products list (Milestone 1.7a) — paginated table with a create action gated by
 * PRODUCT_WRITE. Reads are server-authoritative (AdminProduct DTOs).
 */
import { useState } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@sajawat/shared';
import { useAsync } from '@/lib/use-async';
import { listProducts } from '@/services/products';
import { formatPrice } from '@/lib/format';
import { useCan } from '@/features/console/Can';
import { PageHeader, Pagination, EmptyState } from '@/features/console/ui';
import { ProductStatusBadge } from '@/features/console/badges';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const canWrite = useCan(PERMISSIONS.PRODUCT_WRITE);
  const { data, loading, error } = useAsync(() => listProducts({ page, limit: 20 }), [page]);

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage the catalog."
        action={
          canWrite ? (
            <Link
              href="/products/new"
              className="inline-flex h-10 items-center rounded-full bg-purple px-5 text-sm font-medium text-white hover:bg-purple-dark"
            >
              New product
            </Link>
          ) : undefined
        }
      />

      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      {loading && data === null && <p className="text-sm text-ink-soft">Loading products…</p>}

      {data !== null && data.items.length === 0 && <EmptyState message="No products yet." />}

      {data !== null && data.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-mist/40">
                  <td className="px-5 py-3">
                    <Link
                      href={`/products/${p.id}`}
                      className="font-medium text-purple hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{p.sku}</td>
                  <td className="px-5 py-3">
                    <ProductStatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-ink">
                    {p.salePrice !== undefined ? (
                      <span>
                        {formatPrice(p.salePrice)}{' '}
                        <span className="text-xs text-ink-faint line-through">
                          {formatPrice(p.price)}
                        </span>
                      </span>
                    ) : (
                      formatPrice(p.price)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data !== null && (
        <Pagination
          page={data.page}
          pages={data.pages}
          busy={loading}
          onPage={(n) => {
            setPage(n);
          }}
        />
      )}
    </div>
  );
}
