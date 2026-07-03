'use client';

/**
 * Wishlist toggle (Milestone 1.4c) — server-authoritative heart. `icon` renders
 * a compact overlay button (product cards); the default renders a labelled
 * outline button (PDP).
 */
import { useState } from 'react';
import { commerceErrorMessage, useWishlist } from '@/features/commerce/commerce-context';

interface Props {
  productId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export function WishlistButton({ productId, variant = 'full', className }: Props) {
  const { has, toggle, mutating } = useWishlist();
  const [error, setError] = useState<string | null>(null);
  const active = has(productId);

  function onClick(e: React.MouseEvent) {
    // Cards wrap the button in a <Link>; don't navigate when toggling.
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    void toggle(productId).catch((err: unknown) => {
      setError(commerceErrorMessage(err));
    });
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={mutating}
        aria-pressed={active}
        aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
        title={error ?? (active ? 'In your wishlist' : 'Add to wishlist')}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-purple shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-50 ${className ?? ''}`}
      >
        <Heart filled={active} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={mutating}
      aria-pressed={active}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-6 text-sm font-medium transition-colors disabled:opacity-50 ${
        active
          ? 'border-purple bg-purple/5 text-purple'
          : 'border-line text-ink-soft hover:border-purple hover:text-purple'
      } ${className ?? ''}`}
    >
      <Heart filled={active} />
      {active ? 'In wishlist' : 'Add to wishlist'}
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}
