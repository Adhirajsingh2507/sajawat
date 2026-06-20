'use client';

/**
 * Inventory adjustment form (Milestone 1.7a) — INVENTORY_WRITE. Writes a signed
 * movement; quantity/availability/status are derived server-side and returned.
 * The `order` movement type is system-only and not offered here.
 */
import { useState } from 'react';
import type { AdminInventory, AdminMovementType } from '@sajawat/types';
import { ApiError } from '@/lib/api';
import { adjustInventory } from '@/services/inventory';

const TYPES: { value: AdminMovementType; label: string }[] = [
  { value: 'stock_added', label: 'Stock added' },
  { value: 'stock_removed', label: 'Stock removed' },
  { value: 'manual_adjustment', label: 'Manual adjustment' },
  { value: 'return', label: 'Customer return' },
];

export function AdjustForm({
  inventory,
  onDone,
  onCancel,
}: {
  inventory: AdminInventory;
  onDone: (updated: AdminInventory) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<AdminMovementType>('stock_added');
  const [quantity, setQuantity] = useState('0');
  const [reason, setReason] = useState('');
  const [threshold, setThreshold] = useState(String(inventory.lowStockThreshold));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    void adjustInventory(inventory.productId, {
      type,
      quantity: Number(quantity) || 0,
      ...(reason.trim().length > 0 ? { reason: reason.trim() } : {}),
      ...(threshold.trim().length > 0 ? { lowStockThreshold: Number(threshold) } : {}),
    })
      .then((updated) => {
        onDone(updated);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not adjust stock.');
        setBusy(false);
      });
  }

  return (
    <form
      onSubmit={apply}
      className="grid gap-3 rounded-lg border border-line bg-mist/40 p-4 sm:grid-cols-4"
    >
      <label className="text-xs text-ink-soft">
        Type
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as AdminMovementType);
          }}
          className="mt-1 h-9 w-full rounded-lg border border-line bg-cream px-2 text-sm focus:border-purple focus:outline-none"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-ink-soft">
        Quantity
        <input
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
          }}
          className="mt-1 h-9 w-full rounded-lg border border-line bg-cream px-2 text-sm focus:border-purple focus:outline-none"
        />
      </label>
      <label className="text-xs text-ink-soft">
        Low-stock threshold
        <input
          type="number"
          min="0"
          value={threshold}
          onChange={(e) => {
            setThreshold(e.target.value);
          }}
          className="mt-1 h-9 w-full rounded-lg border border-line bg-cream px-2 text-sm focus:border-purple focus:outline-none"
        />
      </label>
      <label className="text-xs text-ink-soft sm:col-span-4">
        Reason (optional)
        <input
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
          }}
          placeholder="e.g. new shipment, damaged stock"
          className="mt-1 h-9 w-full rounded-lg border border-line bg-cream px-2 text-sm focus:border-purple focus:outline-none"
        />
      </label>
      {error !== null && <p className="text-xs text-red-600 sm:col-span-4">{error}</p>}
      <div className="flex gap-2 sm:col-span-4">
        <button
          type="submit"
          disabled={busy}
          className="h-9 rounded-lg bg-purple px-4 text-sm font-medium text-white hover:bg-purple-dark disabled:opacity-40"
        >
          {busy ? 'Applying…' : 'Apply'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-3 text-sm font-medium text-ink-soft hover:text-purple"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
