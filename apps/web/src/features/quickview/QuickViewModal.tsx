'use client';

/**
 * Quick-view modal — a compact product view launched from a card. Reuses the
 * shared AddToCart (which opens the cart drawer); when the drawer opens we close
 * the modal so the two overlays don't stack.
 */
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@sajawat/ui';
import { useQuickView } from '@/features/quickview/quickview-context';
import { useCart } from '@/features/commerce/commerce-context';
import { formatPrice } from '@/lib/format';
import { AddToCart } from '@/features/commerce/AddToCart';
import { WishlistButton } from '@/features/commerce/WishlistButton';

export function QuickViewModal() {
  const { product, close } = useQuickView();
  const { isCartOpen } = useCart();
  const isOpen = product !== null;

  // Close when the cart drawer opens (add-to-cart from within the modal).
  useEffect(() => {
    if (isOpen && isCartOpen) close();
  }, [isOpen, isCartOpen, close]);

  // Escape to close; lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  if (product === null) return null;

  const image = product.images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={close} aria-hidden className="absolute inset-0 bg-ink/50" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="animate-fade-in relative grid w-full max-w-3xl overflow-hidden rounded-2xl bg-cream shadow-xl sm:grid-cols-2"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close quick view"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-ink-soft transition-colors hover:text-purple"
        >
          <CloseIcon />
        </button>

        {/* Image */}
        <div className="relative aspect-square bg-mist sm:aspect-auto">
          {image !== undefined ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-6xl text-ink-faint">
              {product.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col p-6">
          <div className="flex gap-2">
            {product.isBestSeller && <Badge tone="gold">Best Seller</Badge>}
            {product.isFeatured && <Badge tone="purple">Featured</Badge>}
          </div>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">{product.name}</h2>

          <div className="mt-3 flex items-baseline gap-3">
            {product.salePrice !== undefined ? (
              <>
                <span className="text-xl font-semibold text-purple">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-sm text-ink-faint line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-xl font-semibold text-ink">{formatPrice(product.price)}</span>
            )}
          </div>

          {product.shortDescription !== undefined && (
            <p className="mt-4 text-sm text-ink-soft">{product.shortDescription}</p>
          )}

          <AddToCart productId={product.id} inStock={product.inStock} />
          <div className="mt-3">
            <WishlistButton productId={product.id} />
          </div>

          <Link
            href={`/products/${product.slug}`}
            onClick={close}
            className="mt-6 text-sm font-medium text-purple hover:underline"
          >
            View full details →
          </Link>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
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
