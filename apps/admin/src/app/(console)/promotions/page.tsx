'use client';

/**
 * Promotions admin (Milestone 1.7b) — coupons + automatic cart rules. List with
 * trigger/status filters, an inline create/edit panel, and delete. COUPON_WRITE
 * gates the module (the API enforces it too). Configuration only; discounts are
 * computed server-side.
 */
import { useState } from 'react';
import type { AdminPromotion, PromotionStatus, PromotionTrigger } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import {
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
} from '@/services/promotions';
import { ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { PageHeader, Pagination, EmptyState } from '@/features/console/ui';
import { ActiveBadge } from '@/features/console/badges';
import { PromotionForm } from '@/features/promotions/PromotionForm';

type Panel = { mode: 'new' } | { mode: 'edit'; promotion: AdminPromotion } | null;

function reward(p: AdminPromotion): string {
  return p.rewardType === 'percentage' ? `${p.value}%` : formatPrice(p.value);
}

export default function PromotionsPage() {
  const [page, setPage] = useState(1);
  const [trigger, setTrigger] = useState<PromotionTrigger | ''>('');
  const [status, setStatus] = useState<PromotionStatus | ''>('');
  const [reload, setReload] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const { data, loading, error } = useAsync(
    () =>
      listPromotions({
        page,
        limit: 50,
        trigger: trigger === '' ? undefined : trigger,
        status: status === '' ? undefined : status,
      }),
    [page, trigger, status, reload],
  );

  function refresh() {
    setPanel(null);
    setReload((n) => n + 1);
  }

  function onDelete(id: string) {
    if (!window.confirm('Delete this promotion?')) return;
    setRowError(null);
    void deletePromotion(id)
      .then(() => {
        setReload((n) => n + 1);
      })
      .catch((err: unknown) => {
        setRowError(err instanceof ApiError ? err.message : 'Could not delete the promotion.');
      });
  }

  return (
    <div>
      <PageHeader
        title="Promotions"
        description="Coupons and automatic cart-value discounts."
        action={
          panel === null ? (
            <button
              type="button"
              onClick={() => {
                setPanel({ mode: 'new' });
              }}
              className="inline-flex h-10 items-center rounded-full bg-purple px-5 text-sm font-medium text-white hover:bg-purple-dark"
            >
              New promotion
            </button>
          ) : undefined
        }
      />

      {panel !== null && (
        <div className="mb-6">
          <PromotionForm
            initial={panel.mode === 'edit' ? panel.promotion : undefined}
            onSubmit={
              panel.mode === 'edit'
                ? (input) => updatePromotion(panel.promotion.id, input)
                : createPromotion
            }
            onDone={refresh}
            onCancel={() => {
              setPanel(null);
            }}
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={trigger}
          onChange={(e) => {
            setTrigger(e.target.value as PromotionTrigger | '');
            setPage(1);
          }}
          className="h-10 rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
        >
          <option value="">All triggers</option>
          <option value="automatic">automatic</option>
          <option value="coupon">coupon</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PromotionStatus | '');
            setPage(1);
          }}
          className="h-10 rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </div>

      {rowError !== null && <p className="mb-4 text-sm text-red-600">{rowError}</p>}
      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      {loading && data === null && <p className="text-sm text-ink-soft">Loading promotions…</p>}

      {data !== null && data.items.length === 0 && (
        <EmptyState message="No promotions match this filter." />
      )}

      {data !== null && data.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Trigger</th>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Reward</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-mist/40">
                  <td className="px-5 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{p.trigger}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-soft">{p.code ?? '—'}</td>
                  <td className="px-5 py-3 text-ink">{reward(p)}</td>
                  <td className="px-5 py-3">
                    <ActiveBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setPanel({ mode: 'edit', promotion: p });
                      }}
                      className="text-sm font-medium text-purple hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(p.id);
                      }}
                      className="ml-4 text-sm text-ink-soft hover:text-red-600"
                    >
                      Delete
                    </button>
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
