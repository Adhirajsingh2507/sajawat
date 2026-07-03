'use client';

/**
 * Horizontal product carousel — scroll-snap row of ProductCards with prev/next
 * controls. Presentational; consumers pass the products. Falls back gracefully
 * to a plain scrollable row on touch devices.
 */
import { useRef } from 'react';
import type { PublicProduct } from '@sajawat/types';
import { ProductCard } from '@/components/ProductCard';

export function ProductCarousel({ products }: { products: PublicProduct[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (el === null) return;
    // Scroll by roughly one viewport of the track.
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  }

  if (products.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Controls (desktop) */}
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => {
          scrollBy(-1);
        }}
        className="absolute -left-4 top-[38%] hidden -translate-y-1/2 rounded-full border border-line bg-white p-2 text-ink-soft shadow-sm transition-colors hover:text-purple lg:block"
      >
        <ChevronIcon dir="left" />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => {
          scrollBy(1);
        }}
        className="absolute -right-4 top-[38%] hidden -translate-y-1/2 rounded-full border border-line bg-white p-2 text-ink-soft shadow-sm transition-colors hover:text-purple lg:block"
      >
        <ChevronIcon dir="right" />
      </button>
    </div>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}
