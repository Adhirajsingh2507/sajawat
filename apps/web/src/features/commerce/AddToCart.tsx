'use client';

/**
 * Add-to-cart control (Milestone 1.4c) — quantity stepper + add button. The cart
 * is server-authoritative; on success the context already holds the new cart, so
 * we just surface a confirmation with a link to checkout.
 */
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@sajawat/ui';
import { commerceErrorMessage, useCart } from '@/features/commerce/commerce-context';

export function AddToCart({ productId, inStock }: { productId: string; inStock: boolean }) {
  const { addItem, mutating } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onAdd() {
    setError(null);
    setAdded(false);
    void addItem(productId, qty)
      .then(() => {
        setAdded(true);
      })
      .catch((err: unknown) => {
        setError(commerceErrorMessage(err));
      });
  }

  if (!inStock) {
    return (
      <Button type="button" disabled className="mt-6 w-full sm:w-auto">
        Out of stock
      </Button>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-11 items-center rounded-full border border-line">
          <button
            type="button"
            onClick={() => {
              setQty((q) => Math.max(1, q - 1));
            }}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-full w-10 items-center justify-center rounded-l-full text-lg text-ink-soft hover:text-purple disabled:opacity-40"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => {
              setQty((q) => Math.min(99, q + 1));
            }}
            disabled={qty >= 99}
            aria-label="Increase quantity"
            className="flex h-full w-10 items-center justify-center rounded-r-full text-lg text-ink-soft hover:text-purple disabled:opacity-40"
          >
            +
          </button>
        </div>
        <Button type="button" onClick={onAdd} disabled={mutating}>
          {mutating ? 'Adding…' : 'Add to cart'}
        </Button>
      </div>
      {added && (
        <p className="mt-3 text-sm text-green-700">
          Added to cart.{' '}
          <Link href="/cart" className="font-medium text-purple hover:underline">
            View cart →
          </Link>
        </p>
      )}
      {error !== null && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
