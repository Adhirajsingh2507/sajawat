'use client';

/**
 * Cart page (Milestone 1.4c) — renders the server-authoritative cart. Quantity
 * edits, removals, and coupon changes all round-trip to the API and re-render
 * from the returned DTO; totals are never computed here.
 */
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@sajawat/ui';
import type { PublicCartItem } from '@sajawat/types';
import { commerceErrorMessage, useCart } from '@/features/commerce/commerce-context';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { cart, loading, mutating, updateItem, removeItem } = useCart();

  if (loading && cart === null) {
    return (
      <Container className="py-20">
        <p className="text-center text-sm text-ink-soft">Loading your cart…</p>
      </Container>
    );
  }

  if (cart === null || cart.items.length === 0) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink">Your cart is empty</h1>
        <p className="mt-3 text-sm text-ink-soft">Discover something you&apos;ll love.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-purple px-6 text-sm font-medium text-white hover:bg-purple-dark"
        >
          Shop all jewellery
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <h1 className="font-serif text-3xl font-semibold text-ink">Shopping cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((item) => (
            <CartRow
              key={item.productId}
              item={item}
              busy={mutating}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}
        </ul>
        <CartSummary />
      </div>
    </Container>
  );
}

function CartRow({
  item,
  busy,
  onUpdate,
  onRemove,
}: {
  item: PublicCartItem;
  busy: boolean;
  onUpdate: (productId: string, quantity: number) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);

  function change(quantity: number) {
    setError(null);
    void onUpdate(item.productId, quantity).catch((err: unknown) => {
      setError(commerceErrorMessage(err));
    });
  }

  function remove() {
    setError(null);
    void onRemove(item.productId).catch((err: unknown) => {
      setError(commerceErrorMessage(err));
    });
  }

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/products/${item.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-mist"
      >
        {item.image !== undefined ? (
          <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center font-serif text-2xl text-ink-faint">
            {item.name.charAt(0)}
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${item.slug}`}
            className="text-sm font-medium text-ink hover:text-purple"
          >
            {item.name}
          </Link>
          <span className="shrink-0 text-sm font-semibold text-ink">
            {formatPrice(item.lineTotal)}
          </span>
        </div>
        <span className="mt-1 text-xs text-ink-faint">{formatPrice(item.unitPrice)} each</span>
        {!item.inStock && <span className="mt-1 text-xs text-red-600">Out of stock</span>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex h-9 items-center rounded-full border border-line">
            <button
              type="button"
              onClick={() => {
                change(item.quantity - 1);
              }}
              disabled={busy || item.quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-full w-9 items-center justify-center rounded-l-full text-ink-soft hover:text-purple disabled:opacity-40"
            >
              −
            </button>
            <span className="w-7 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => {
                change(item.quantity + 1);
              }}
              disabled={busy || item.quantity >= 99}
              aria-label="Increase quantity"
              className="flex h-full w-9 items-center justify-center rounded-r-full text-ink-soft hover:text-purple disabled:opacity-40"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-xs text-ink-soft hover:text-red-600 disabled:opacity-40"
          >
            Remove
          </button>
        </div>
        {error !== null && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </li>
  );
}

function CartSummary() {
  const { cart, mutating, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (cart === null) return null;

  function onApply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length === 0) return;
    setError(null);
    void applyCoupon(trimmed)
      .then(() => {
        setCode('');
      })
      .catch((err: unknown) => {
        setError(commerceErrorMessage(err));
      });
  }

  function onRemoveCoupon() {
    setError(null);
    void removeCoupon().catch((err: unknown) => {
      setError(commerceErrorMessage(err));
    });
  }

  return (
    <aside className="h-fit rounded-2xl border border-line bg-white p-6">
      <h2 className="font-serif text-lg font-semibold text-ink">Order summary</h2>

      <form onSubmit={onApply} className="mt-4">
        {cart.appliedPromotion !== null && cart.appliedPromotion.code !== undefined ? (
          <div className="flex items-center justify-between rounded-lg bg-purple/5 px-3 py-2 text-sm">
            <span className="text-purple">{cart.appliedPromotion.code} applied</span>
            <button
              type="button"
              onClick={onRemoveCoupon}
              disabled={mutating}
              className="text-xs text-ink-soft hover:text-red-600 disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
              }}
              placeholder="Coupon code"
              aria-label="Coupon code"
              className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm focus:border-purple focus:outline-none"
            />
            <button
              type="submit"
              disabled={mutating}
              className="h-10 shrink-0 rounded-full border border-purple px-4 text-sm font-medium text-purple hover:bg-purple hover:text-white disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        )}
        {error !== null && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </form>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between text-ink-soft">
          <dt>Subtotal</dt>
          <dd>{formatPrice(cart.subtotal)}</dd>
        </div>
        {cart.discount > 0 && (
          <div className="flex justify-between text-purple">
            <dt>{cart.appliedPromotion?.label ?? 'Discount'}</dt>
            <dd>−{formatPrice(cart.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
          <dt>Total</dt>
          <dd>{formatPrice(cart.total)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-ink-faint">Shipping &amp; taxes calculated at checkout.</p>

      <Link
        href="/checkout"
        className={`mt-5 flex h-11 items-center justify-center rounded-full bg-purple text-sm font-medium text-white hover:bg-purple-dark ${
          mutating ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        Proceed to checkout
      </Link>
    </aside>
  );
}
