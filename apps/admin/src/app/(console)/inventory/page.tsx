'use client';

/**
 * Inventory list (Milestone 1.7a) — stock levels with an inline adjust action
 * (INVENTORY_WRITE). A successful adjustment refetches the page so derived
 * quantities/status stay server-authoritative. Product names aren't on the
 * inventory DTO yet, so rows key on productId (enhance when a batch lookup
 * exists).
 */
import { useState } from 'react';
import Link from 'next/link';
import type { AdminInventory, InventoryStatus } from '@sajawat/types';
import { PERMISSIONS } from '@sajawat/shared';
import { useAsync } from '@/lib/use-async';
import { listInventory } from '@/services/inventory';
import { useCan } from '@/features/console/Can';
import { PageHeader, Pagination, EmptyState } from '@/features/console/ui';
import { InventoryStatusBadge } from '@/features/console/badges';
import { AdjustForm } from '@/features/inventory/AdjustForm';

const STATUSES: InventoryStatus[] = ['in_stock', 'low_stock', 'out_of_stock'];

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InventoryStatus | ''>('');
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const canWrite = useCan(PERMISSIONS.INVENTORY_WRITE);

  const { data, loading, error } = useAsync(
    () => listInventory({ page, limit: 20, status: status === '' ? undefined : status }),
    [page, status, reload],
  );

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock levels and adjustments."
        action={
          <Link
            href="/inventory/history"
            className="inline-flex h-10 items-center rounded-full border border-line px-5 text-sm font-medium text-ink-soft hover:border-purple"
          >
            Movement history
          </Link>
        }
      />

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as InventoryStatus | '');
            setPage(1);
          }}
          className="h-10 rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
        >
          <option value="">All stock states</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      {loading && data === null && <p className="text-sm text-ink-soft">Loading inventory…</p>}

      {data !== null && data.items.length === 0 && <EmptyState message="No inventory records." />}

      {data !== null && data.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 text-right font-medium">On hand</th>
                <th className="px-5 py-3 text-right font-medium">Reserved</th>
                <th className="px-5 py-3 text-right font-medium">Available</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {canWrite && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {data.items.map((inv) => (
                <FragmentRow
                  key={inv.productId}
                  isEditing={editing === inv.productId}
                  canWrite={canWrite}
                  inventory={inv}
                  onEdit={() => {
                    setEditing(inv.productId);
                  }}
                  onCancel={() => {
                    setEditing(null);
                  }}
                  onDone={() => {
                    setEditing(null);
                    setReload((n) => n + 1);
                  }}
                />
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

function FragmentRow({
  inventory,
  canWrite,
  isEditing,
  onEdit,
  onCancel,
  onDone,
}: {
  inventory: AdminInventory;
  canWrite: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const colSpan = canWrite ? 6 : 5;
  return (
    <>
      <tr className="border-b border-line/60 last:border-0 hover:bg-mist/40">
        <td className="px-5 py-3 font-mono text-xs text-ink-soft">{inventory.productId}</td>
        <td className="px-5 py-3 text-right text-ink">{inventory.quantity}</td>
        <td className="px-5 py-3 text-right text-ink-soft">{inventory.reservedQuantity}</td>
        <td className="px-5 py-3 text-right font-medium text-ink">{inventory.availableQuantity}</td>
        <td className="px-5 py-3">
          <InventoryStatusBadge status={inventory.status} />
        </td>
        {canWrite && (
          <td className="px-5 py-3 text-right">
            <button
              type="button"
              onClick={isEditing ? onCancel : onEdit}
              className="text-sm font-medium text-purple hover:underline"
            >
              {isEditing ? 'Close' : 'Adjust'}
            </button>
          </td>
        )}
      </tr>
      {isEditing && (
        <tr>
          <td colSpan={colSpan} className="px-5 pb-4">
            <AdjustForm inventory={inventory} onDone={onDone} onCancel={onCancel} />
          </td>
        </tr>
      )}
    </>
  );
}
