'use client';

/**
 * Slide-in wishlist drawer — opens from the header heart. Mirrors CartDrawer.
 * Each saved item can be moved to the bag (which opens the cart drawer; we close
 * this one so the overlays don't stack) or removed.
 */
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart, useWishlist } from '@/features/commerce/commerce-context';
import { formatPrice } from '@/lib/format';

export function WishlistDrawer() {
  const { wishlist, isWishlistOpen, closeWishlist, mutating, remove } = useWishlist();
  const { addItem, openCart, isCartOpen } = useCart();

  // Close when the cart drawer opens (moved an item to the bag).
  useEffect(() => {
    if (isWishlistOpen && isCartOpen) closeWishlist();
  }, [isWishlistOpen, isCartOpen, closeWishlist]);

  // Escape to close; lock body scroll while open.
  useEffect(() => {
    if (!isWishlistOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeWishlist();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isWishlistOpen, closeWishlist]);

  const items = wishlist?.items ?? [];

  function moveToBag(productId: string) {
    void addItem(productId, 1).then(() => {
      openCart();
    });
  }

  return (
    <>
      {/* Scrim */}
      <div
        onClick={closeWishlist}
        aria-hidden
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300 ${
          isWishlistOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        aria-label="Wishlist"
        aria-hidden={!isWishlistOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-xl transition-transform duration-300 ${
          isWishlistOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-ink">
            Wishlist{items.length > 0 ? ` (${String(items.length)})` : ''}
          </h2>
          <button
            type="button"
            onClick={closeWishlist}
            aria-label="Close wishlist"
            className="text-ink-soft transition-colors hover:text-purple"
          >
            <CloseIcon />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-serif text-xl text-ink">Your wishlist is empty</p>
            <p className="mt-2 text-sm text-ink-soft">
              Tap the heart on any piece to save it for later.
            </p>
            <Link
              href="/products"
              onClick={closeWishlist}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-purple px-6 text-sm font-medium text-white hover:bg-purple-dark"
            >
              Shop all jewellery
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((product) => (
                <li key={product.id} className="flex gap-3 py-4">
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={closeWishlist}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-mist"
                  >
                    {product.images[0] !== undefined ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center font-serif text-xl text-ink-faint">
                        {product.name.charAt(0)}
                      </span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={closeWishlist}
                        className="text-sm font-medium text-ink hover:text-purple"
                      >
                        {product.name}
                      </Link>
                      <span className="shrink-0 text-sm font-semibold text-ink">
                        {formatPrice(product.salePrice ?? product.price)}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      {product.inStock ? (
                        <button
                          type="button"
                          onClick={() => {
                            moveToBag(product.id);
                          }}
                          disabled={mutating}
                          className="text-xs font-medium text-purple hover:text-purple-dark disabled:opacity-40"
                        >
                          Move to bag
                        </button>
                      ) : (
                        <span className="text-xs text-ink-faint">Out of stock</span>
                      )}
                      <button
                        type="button"
                        onClick={() => void remove(product.id)}
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
              <Link
                href="/wishlist"
                onClick={closeWishlist}
                className="flex h-11 items-center justify-center rounded-full border border-line text-sm font-medium text-ink transition-colors hover:border-purple hover:text-purple"
              >
                View full wishlist
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
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
