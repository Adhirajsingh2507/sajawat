'use client';

/**
 * Receive stock by barcode scan (INVENTORY_WRITE). Staff scan product barcodes;
 * each scan looks the product up by barcode and adds to a running count (re-scans
 * increment). Submitting applies each count as a `stock_added` inventory movement
 * — the same server-authoritative path as the manual adjust — so availability
 * updates on the storefront. Barcode scanners emulate a keyboard (digits + Enter),
 * so the scan box is just an autofocused input that reads the value on submit.
 */
import { useState } from 'react';
import Link from 'next/link';
import type { AdminProduct } from '@sajawat/types';
import { PERMISSIONS } from '@sajawat/shared';
import { Button, Input, Label } from '@sajawat/ui';
import { ApiError } from '@/lib/api';
import { getProductByBarcode } from '@/services/products';
import { adjustInventory } from '@/services/inventory';
import { useCan } from '@/features/console/Can';
import { PageHeader, Card, EmptyState } from '@/features/console/ui';
import { formatPrice } from '@/lib/format';

interface ScanRow {
  product: AdminProduct;
  qty: number;
}

export default function ScanReceivePage() {
  const canWrite = useCan(PERMISSIONS.INVENTORY_WRITE);
  const [code, setCode] = useState('');
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!canWrite) {
    return (
      <div>
        <PageHeader title="Receive stock" description="Scan barcodes to add stock." />
        <EmptyState message="You don't have permission to adjust inventory." />
      </div>
    );
  }

  function focusInput() {
    const el = document.getElementById('scan');
    if (el instanceof HTMLInputElement) el.focus();
  }

  function onScan(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim();
    setCode('');
    setResult(null);
    if (value.length === 0) return;
    setScanError(null);
    setLooking(true);
    void getProductByBarcode(value)
      .then((product) => {
        setRows((prev) => {
          const idx = prev.findIndex((r) => r.product.id === product.id);
          if (idx === -1) return [...prev, { product, qty: 1 }];
          const next = [...prev];
          const existing = next[idx];
          if (existing !== undefined)
            next[idx] = { product: existing.product, qty: existing.qty + 1 };
          return next;
        });
      })
      .catch((err: unknown) => {
        setScanError(
          err instanceof ApiError ? err.message : `No product found for barcode "${value}".`,
        );
      })
      .finally(() => {
        setLooking(false);
        focusInput();
      });
  }

  function setQty(id: string, qty: number) {
    setRows((prev) =>
      prev.flatMap((r) => {
        if (r.product.id !== id) return [r];
        if (qty <= 0) return [];
        return [{ product: r.product, qty }];
      }),
    );
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.product.id !== id));
  }

  const totalUnits = rows.reduce((sum, r) => sum + r.qty, 0);

  function onSubmit() {
    if (rows.length === 0) return;
    setSubmitting(true);
    setResult(null);
    setScanError(null);
    void (async () => {
      let applied = 0;
      const failures: string[] = [];
      for (const row of rows) {
        try {
          await adjustInventory(row.product.id, { type: 'stock_added', quantity: row.qty });
          applied += 1;
        } catch (err: unknown) {
          failures.push(`${row.product.name}: ${err instanceof ApiError ? err.message : 'failed'}`);
        }
      }
      if (failures.length === 0) {
        setRows([]);
        setResult(`Stock updated for ${String(applied)} product(s). Now live on the storefront.`);
      } else {
        setResult(
          `Applied ${String(applied)} of ${String(rows.length)}. Failed: ${failures.join('; ')}`,
        );
      }
      setSubmitting(false);
      focusInput();
    })();
  }

  return (
    <div>
      <PageHeader
        title="Receive stock"
        description="Scan product barcodes to add stock, then submit to update the storefront."
        action={
          <Link href="/inventory" className="text-sm text-purple hover:underline">
            ← Inventory
          </Link>
        }
      />

      <Card className="mb-6">
        <form onSubmit={onScan} className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="scan">Scan or type a barcode</Label>
            <Input
              id="scan"
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
              }}
              placeholder="Point the scanner here and scan…"
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={looking}>
            {looking ? 'Looking…' : 'Add'}
          </Button>
        </form>
        {scanError !== null && <p className="mt-2 text-sm text-red-600">{scanError}</p>}
      </Card>

      {rows.length === 0 ? (
        <EmptyState message="No scans yet. Scan a product barcode to begin." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-faint">
                  <th className="pb-2 pr-4">Product</th>
                  <th className="pb-2 pr-4">Barcode</th>
                  <th className="pb-2 pr-4">Scanned qty</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.product.id} className="border-b border-line">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-ink">{r.product.name}</span>
                      <span className="block text-xs text-ink-faint">
                        {r.product.sku} · {formatPrice(r.product.price)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-ink-soft">
                      {r.product.barcode ?? '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex h-9 w-fit items-center rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() => {
                            setQty(r.product.id, r.qty - 1);
                          }}
                          aria-label="Decrease"
                          className="flex h-full w-9 items-center justify-center rounded-l-full text-ink-soft hover:text-purple"
                        >
                          −
                        </button>
                        <span className="w-8 text-center">{r.qty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setQty(r.product.id, r.qty + 1);
                          }}
                          aria-label="Increase"
                          className="flex h-full w-9 items-center justify-center rounded-r-full text-ink-soft hover:text-purple"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          removeRow(r.product.id);
                        }}
                        className="text-xs text-ink-soft hover:text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-ink-soft">
              {rows.length} product(s) · {totalUnits} unit(s) to add
            </p>
            <Button type="button" onClick={onSubmit} disabled={submitting}>
              {submitting ? 'Updating…' : 'Submit & update stock'}
            </Button>
          </div>
        </Card>
      )}

      {result !== null && <p className="mt-4 text-sm text-green-700">{result}</p>}
    </div>
  );
}
