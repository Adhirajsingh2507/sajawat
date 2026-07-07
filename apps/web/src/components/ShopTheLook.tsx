'use client';

/**
 * "Shop the Look" reel gallery (homepage PR-5, reference image 6). A row of 4
 * tall portrait cards. When a product has a `video.url` the card autoplays it
 * muted+looped (real reels light up as soon as footage is seeded — D-SF1);
 * otherwise it shows the product image with a play badge. Overlay label + CTA.
 */
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@sajawat/ui';
import type { PublicProduct } from '@sajawat/types';
import { Reveal } from '@/components/Reveal';

function PlayBadge() {
  return (
    <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-purple backdrop-blur">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

function ReelCard({ product }: { product: PublicProduct }) {
  const poster = product.images[0]?.url;
  const video = product.video?.url;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-mist"
    >
      <div className="relative aspect-[3/4]">
        {video !== undefined ? (
          <video
            src={video}
            poster={poster}
            muted
            loop
            autoPlay
            playsInline
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : poster !== undefined ? (
          <>
            <Image
              src={poster}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <PlayBadge />
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-5xl text-ink-faint">
            {product.name.charAt(0)}
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <h3 className="font-serif text-base drop-shadow-sm">{product.name}</h3>
          <span className="mt-1.5 inline-block text-[11px] uppercase tracking-[0.2em] text-gold">
            Explore →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ShopTheLook({ products }: { products: PublicProduct[] }) {
  const items = products.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container>
        <h2 className="text-center font-serif text-3xl text-ink sm:text-4xl">Shop the look</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <ReelCard product={p} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
