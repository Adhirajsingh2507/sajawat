'use client';

/**
 * Slide-in cart drawer — opens on add-to-cart (via CartContext.openCart) and from
 * the header bag. Server-authoritative like the cart page: quantity/remove
 * round-trip to the API; totals come from the returned DTO.
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { commerceErrorMessage, useCart } from '@/features/commerce/commerce-context';
import { formatPrice } from '@/lib/format';

export function CartDrawer() {
  const { cart, isCartOpen, closeCart, mutating, updateItem, removeItem } = useCart();

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!isCartOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCart();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isCartOpen, closeCart]);

  const items = cart?.items ?? [];

  return (
    <>
      {/* Scrim */}
      <div
        onClick={closeCart}
        aria-hidden
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        aria-label="Shopping cart"
        aria-hidden={!isCartOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-xl transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-ink">
            Your cart{items.length > 0 ? ` (${String(cart?.itemCount ?? items.length)})` : ''}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="text-ink-soft transition-colors hover:text-purple"
          >
            <CloseIcon />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-serif text-xl text-ink">Your cart is empty</p>
            <p className="mt-2 text-sm text-ink-soft">Discover something you&apos;ll love.</p>
            <Link
              href="/products"
              onClick={closeCart}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-purple px-6 text-sm font-medium text-white hover:bg-purple-dark"
            >
              Shop all jewellery
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 py-4">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-mist"
                  >
                    {item.image !== undefined ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center font-serif text-xl text-ink-faint">
                        {item.name.charAt(0)}
                      </span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="text-sm font-medium text-ink hover:text-purple"
                      >
                        {item.name}
                      </Link>
                      <span className="shrink-0 text-sm font-semibold text-ink">
                        {formatPrice(item.lineTotal)}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex h-8 items-center rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() => void updateItem(item.productId, item.quantity - 1)}
                          disabled={mutating || item.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="flex h-full w-8 items-center justify-center rounded-l-full text-ink-soft hover:text-purple disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => void updateItem(item.productId, item.quantity + 1)}
                          disabled={mutating || item.quantity >= 99}
                          aria-label="Increase quantity"
                          className="flex h-full w-8 items-center justify-center rounded-r-full text-ink-soft hover:text-purple disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeItem(item.productId)}
                        disabled={mutating}
                        className="text-xs text-ink-soft hover:text-red-600 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-line px-5 py-4">
              <CartCoupon />
              {cart !== null && cart.discount > 0 && (
                <div className="mb-1 flex justify-between text-sm text-purple">
                  <span>Discount</span>
                  <span>−{formatPrice(cart.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-ink">
                <span>Subtotal</span>
                <span>{formatPrice(cart?.total ?? 0)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Shipping &amp; taxes calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-4 flex h-11 items-center justify-center rounded-full bg-purple text-sm font-medium text-white hover:bg-purple-dark"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="mt-2 flex h-11 items-center justify-center rounded-full border border-line text-sm font-medium text-ink transition-colors hover:border-purple hover:text-purple"
              >
                View full cart
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}

/** Compact coupon apply/remove for the drawer footer. */
function CartCoupon() {
  const { cart, mutating, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (cart === null) return null;

  const applied = cart.appliedPromotion;

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

  return (
    <div className="mb-3 border-b border-line pb-3">
      {applied !== null && applied.code !== undefined ? (
        <div className="flex items-center justify-between rounded-lg bg-purple/5 px-3 py-2 text-sm">
          <span className="text-purple">{applied.code} applied</span>
          <button
            type="button"
            onClick={() => void removeCoupon()}
            disabled={mutating}
            className="text-xs text-ink-soft hover:text-red-600 disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={onApply} className="flex gap-2">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
            }}
            placeholder="Coupon code"
            aria-label="Coupon code"
            className="h-9 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm focus:border-purple focus:outline-none"
          />
          <button
            type="submit"
            disabled={mutating}
            className="h-9 shrink-0 rounded-full border border-purple px-4 text-sm font-medium text-purple hover:bg-purple hover:text-white disabled:opacity-40"
          >
            Apply
          </button>
        </form>
      )}
      {error !== null && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
