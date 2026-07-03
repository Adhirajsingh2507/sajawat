'use client';

/**
 * Promotion create/edit form (Milestone 1.7b). Configuration only — discounts
 * are computed server-side at cart/checkout. A `coupon` trigger requires a code;
 * `automatic` applies when the cart subtotal meets minCartValue. Dates are
 * passed as yyyy-mm-dd (the API coerces them).
 */
import { useState } from 'react';
import { Button, Input, Label } from '@sajawat/ui';
import type { AdminPromotion, PromotionStatus, PromotionTrigger, RewardType } from '@sajawat/types';
import { ApiError } from '@/lib/api';
import type { PromotionWriteInput } from '@/services/promotions';

function toDateInput(value: Date | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function numOrUndef(value: string): number | undefined {
  return value.trim().length > 0 ? Number(value) : undefined;
}

export function PromotionForm({
  initial,
  onSubmit,
  onDone,
  onCancel,
}: {
  initial?: AdminPromotion | undefined;
  onSubmit: (input: PromotionWriteInput) => Promise<AdminPromotion>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [trigger, setTrigger] = useState<PromotionTrigger>(initial?.trigger ?? 'automatic');
  const [code, setCode] = useState(initial?.code ?? '');
  const [rewardType, setRewardType] = useState<RewardType>(initial?.rewardType ?? 'percentage');
  const [value, setValue] = useState(initial?.value !== undefined ? String(initial.value) : '');
  const [minCartValue, setMinCartValue] = useState(
    initial?.minCartValue !== undefined ? String(initial.minCartValue) : '',
  );
  const [maxDiscount, setMaxDiscount] = useState(
    initial?.maxDiscount != null ? String(initial.maxDiscount) : '',
  );
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate));
  const [usageLimit, setUsageLimit] = useState(
    initial?.usageLimit != null ? String(initial.usageLimit) : '',
  );
  const [perCustomerLimit, setPerCustomerLimit] = useState(
    initial?.perCustomerLimit != null ? String(initial.perCustomerLimit) : '',
  );
  const [status, setStatus] = useState<PromotionStatus>(initial?.status ?? 'active');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (trigger === 'coupon' && code.trim().length === 0) {
      setError('A coupon trigger needs a code.');
      return;
    }
    setBusy(true);
    setError(null);
    const payload: PromotionWriteInput = {
      name: name.trim(),
      trigger,
      rewardType,
      value: Number(value),
      status,
    };
    if (trigger === 'coupon') payload.code = code.trim();
    const min = numOrUndef(minCartValue);
    if (min !== undefined) payload.minCartValue = min;
    const max = numOrUndef(maxDiscount);
    if (max !== undefined) payload.maxDiscount = max;
    if (startDate !== '') payload.startDate = startDate;
    if (endDate !== '') payload.endDate = endDate;
    const usage = numOrUndef(usageLimit);
    if (usage !== undefined) payload.usageLimit = usage;
    const perCust = numOrUndef(perCustomerLimit);
    if (perCust !== undefined) payload.perCustomerLimit = perCust;

    void onSubmit(payload)
      .then(onDone)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not save the promotion.');
        setBusy(false);
      });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-cream p-5">
      <h2 className="font-serif text-lg font-semibold text-ink">
        {initial !== undefined ? 'Edit promotion' : 'New promotion'}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="promo-name">Name</Label>
          <Input
            id="promo-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="promo-trigger">Trigger</Label>
          <select
            id="promo-trigger"
            value={trigger}
            onChange={(e) => {
              setTrigger(e.target.value as PromotionTrigger);
            }}
            className="h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
          >
            <option value="automatic">automatic (cart value)</option>
            <option value="coupon">coupon (code)</option>
          </select>
        </div>
        {trigger === 'coupon' && (
          <div>
            <Label htmlFor="promo-code">Coupon code</Label>
            <Input
              id="promo-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
              }}
              placeholder="FESTIVE10"
            />
          </div>
        )}
        <div>
          <Label htmlFor="promo-reward">Reward type</Label>
          <select
            id="promo-reward"
            value={rewardType}
            onChange={(e) => {
              setRewardType(e.target.value as RewardType);
            }}
            className="h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
          >
            <option value="percentage">percentage (%)</option>
            <option value="fixed">fixed (₹)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="promo-value">Value {rewardType === 'percentage' ? '(%)' : '(₹)'}</Label>
          <Input
            id="promo-value"
            type="number"
            min="0"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="promo-min">Min cart value (₹, optional)</Label>
          <Input
            id="promo-min"
            type="number"
            min="0"
            value={minCartValue}
            onChange={(e) => {
              setMinCartValue(e.target.value);
            }}
          />
        </div>
        {rewardType === 'percentage' && (
          <div>
            <Label htmlFor="promo-max">Max discount (₹, optional)</Label>
            <Input
              id="promo-max"
              type="number"
              min="0"
              value={maxDiscount}
              onChange={(e) => {
                setMaxDiscount(e.target.value);
              }}
            />
          </div>
        )}
        <div>
          <Label htmlFor="promo-start">Starts (optional)</Label>
          <Input
            id="promo-start"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
            }}
          />
        </div>
        <div>
          <Label htmlFor="promo-end">Ends (optional)</Label>
          <Input
            id="promo-end"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
            }}
          />
        </div>
        <div>
          <Label htmlFor="promo-usage">Total usage limit (optional)</Label>
          <Input
            id="promo-usage"
            type="number"
            min="1"
            value={usageLimit}
            onChange={(e) => {
              setUsageLimit(e.target.value);
            }}
          />
        </div>
        <div>
          <Label htmlFor="promo-percust">Per-customer limit (optional)</Label>
          <Input
            id="promo-percust"
            type="number"
            min="1"
            value={perCustomerLimit}
            onChange={(e) => {
              setPerCustomerLimit(e.target.value);
            }}
          />
        </div>
        <div>
          <Label htmlFor="promo-status">Status</Label>
          <select
            id="promo-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PromotionStatus);
            }}
            className="h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </div>
      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-ink-soft hover:text-purple"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
