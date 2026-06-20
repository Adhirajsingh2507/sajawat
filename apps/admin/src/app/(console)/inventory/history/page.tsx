'use client';

/**
 * Inventory movement history (Milestone 1.7a) — the immutable signed-delta audit
 * trail, optionally filtered to one product via ?productId=. INVENTORY_READ.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAsync } from '@/lib/use-async';
import { getHistory } from '@/services/inventory';
import { formatDateTime, titleCase } from '@/lib/format';
import { PageHeader, Pagination, EmptyState } from '@/features/console/ui';

export default function InventoryHistoryPage() {
  const search = useSearchParams();
  const productId = search.get('productId') ?? undefined;
  const [page, setPage] = useState(1);

  const { data, loading, error } = useAsync(
    () => getHistory({ page, limit: 30, productId }),
    [page, productId],
  );

  return (
    <div>
      <nav className="mb-2 text-xs text-ink-faint">
        <Link href="/inventory" className="hover:text-purple">
          Inventory
        </Link>{' '}
        / History
      </nav>
      <PageHeader
        title="Movement history"
        description={productId !== undefined ? `Product ${productId}` : 'All stock movements.'}
      />

      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      {loading && data === null && <p className="text-sm text-ink-soft">Loading history…</p>}

      {data !== null && data.items.length === 0 && <EmptyState message="No movements recorded." />}

      {data !== null && data.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 text-right font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <tr key={m.id} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-3 text-ink-soft">{formatDateTime(m.createdAt)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-soft">{m.productId}</td>
                  <td className="px-5 py-3 text-ink">{titleCase(m.type.replace(/_/g, ' '))}</td>
                  <td className="px-5 py-3 text-right font-medium text-ink">{m.quantity}</td>
                  <td className="px-5 py-3 text-ink-soft">{m.reason ?? '—'}</td>
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
