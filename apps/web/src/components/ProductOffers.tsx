'use client';

/**
 * Offers box for the PDP. Promotions are store-wide (cart-value gated), so we
 * list the active offers a shopper can use, phrased per SKU. Automatic offers the
 * product's own price already qualifies for are flagged "auto-applied".
 */
import type { PublicOffer } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import { getOffers } from '@/services/catalog';
import { formatPrice } from '@/lib/format';

function offerLine(o: PublicOffer): string {
  const reward =
    o.rewardType === 'percentage' ? `${String(o.value)}% off` : `${formatPrice(o.value)} off`;
  const min = o.minCartValue > 0 ? ` orders over ${formatPrice(o.minCartValue)}` : '';
  const cap =
    o.maxDiscount != null && o.maxDiscount > 0 ? ` (up to ${formatPrice(o.maxDiscount)} off)` : '';
  return `${reward}${min}${cap}`;
}

export function ProductOffers({ price }: { price: number }) {
  const { data } = useAsync(() => getOffers(), []);
  const offers = data?.items ?? [];
  if (offers.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl border border-gold/40 bg-gold-soft/40 p-4">
      <div className="flex items-center gap-2">
        <TagIcon />
        <h2 className="text-sm font-semibold text-ink">Available offers</h2>
      </div>
      <ul className="mt-3 space-y-2.5">
        {offers.map((o) => {
          const autoApplies = o.trigger === 'automatic' && price >= o.minCartValue;
          return (
            <li key={o.id} className="flex gap-2 text-sm">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-dark" />
              <span className="text-ink-soft">
                <span className="font-medium text-ink">{offerLine(o)}</span>
                {o.trigger === 'coupon' && o.code !== undefined ? (
                  <>
                    {' — use code '}
                    <span className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold text-purple">
                      {o.code}
                    </span>
                  </>
                ) : autoApplies ? (
                  <span className="text-green-700"> — auto-applied at checkout</span>
                ) : (
                  <span className="text-ink-faint"> — applied automatically</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TagIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gold-dark"
      aria-hidden="true"
    >
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}
