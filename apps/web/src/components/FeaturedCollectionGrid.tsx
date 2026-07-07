'use client';

/**
 * Featured collection grid (homepage PR-3, reference image 3). Tabbed
 * (Featured / New In) row of 3 large cards. On hover each card: crossfades to a
 * second product image (falls back to a slow zoom when only one image exists),
 * lifts, and reveals an overlay with the name, price, and a "Shop now" cue. A
 * deep-wine SAVE% badge (pale-gold text) shows the discount. Links to the PDP.
 */
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container, Eyebrow } from '@sajawat/ui';
import type { PublicProduct } from '@sajawat/types';
import { formatPrice } from '@/lib/format';
import { WishlistButton } from '@/features/commerce/WishlistButton';

function savePercent(price: number, salePrice?: number): number | null {
  if (salePrice === undefined || salePrice >= price || price <= 0) return null;
  return Math.round((1 - salePrice / price) * 100);
}

function LargeCard({ product }: { product: PublicProduct }) {
  const primary = product.images[0];
  const discount = savePercent(product.price, product.salePrice);

  return (
    <Link href={`/products/${product.slug}`} className="group relative block">
      <div className="relative aspect-[4/5] overflow-hidden bg-mist">
        {primary !== undefined ? (
          <>
            {/* Base image — slow zoom on hover */}
            <Image
              src={primary.url}
              alt={primary.alt ?? product.name}
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            />
            {/* Swap image — crossfades in on hover (2nd image, or the same one) */}
            <Image
              src={(product.images[1] ?? primary).url}
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-6xl text-ink-faint">
            {product.name.charAt(0)}
          </div>
        )}

        {/* Bottom gradient + overlay copy (animates up on hover) */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <h3 className="font-serif text-lg drop-shadow-sm">{product.name}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-semibold">{formatPrice(product.salePrice ?? product.price)}</span>
            {product.salePrice !== undefined && (
              <span className="text-white/70 line-through">{formatPrice(product.price)}</span>
            )}
          </p>
          <span className="mt-2 inline-block translate-y-1 text-xs uppercase tracking-[0.2em] text-gold opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Shop now →
          </span>
        </div>

        {/* SAVE badge — deep wine, gold hairline (luxury, not loud red) */}
        {discount !== null && (
          <span className="absolute left-0 top-4 border-y border-r border-gold/40 bg-[#6d1226] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-soft">
            Save {discount}%
          </span>
        )}
        {!product.inStock && (
          <span className="absolute left-0 top-4 bg-ink/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            Sold out
          </span>
        )}

        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} variant="icon" />
        </div>
      </div>
    </Link>
  );
}

const TABS = [
  { key: 'featured', label: 'Featured' },
  { key: 'new', label: 'New In' },
] as const;

export function FeaturedCollectionGrid({
  featured,
  newArrivals,
}: {
  featured: PublicProduct[];
  newArrivals: PublicProduct[];
}) {
  const [tab, setTab] = useState<'featured' | 'new'>('featured');
  const items = (tab === 'featured' ? featured : newArrivals).slice(0, 3);
  if (featured.length === 0 && newArrivals.length === 0) return null;

  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container>
        <div className="text-center">
          <Eyebrow>The edit</Eyebrow>
          <div className="mt-3 flex items-center justify-center gap-8">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                }}
                aria-pressed={tab === t.key}
                className={`pb-1 font-serif text-2xl transition-colors sm:text-3xl ${
                  tab === t.key
                    ? 'border-b-2 border-gold text-ink'
                    : 'text-ink-faint hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-1 sm:gap-2 md:grid-cols-3">
          {items.map((p) => (
            <LargeCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}
