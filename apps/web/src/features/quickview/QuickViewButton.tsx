'use client';

import type { PublicProduct } from '@sajawat/types';
import { useQuickView } from '@/features/quickview/quickview-context';

/**
 * Overlay button shown on ProductCard hover. Lives inside the card's <Link>, so
 * it stops propagation / prevents navigation and opens the quick-view modal.
 */
export function QuickViewButton({ product }: { product: PublicProduct }) {
  const { open } = useQuickView();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open(product);
      }}
      className="pointer-events-auto absolute inset-x-3 bottom-3 rounded-full bg-white/95 py-2 text-center text-xs font-medium text-ink opacity-0 shadow-sm backdrop-blur transition-opacity duration-200 hover:bg-white group-hover:opacity-100"
    >
      Quick view
    </button>
  );
}
