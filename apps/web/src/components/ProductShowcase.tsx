/**
 * Editorial product showcase (homepage PR-4, reference image 5). A bento of
 * premium image tiles — one tall hero tile on the left, a wide tile and a split
 * pair on the right. Each tile does a slow zoom + gentle lift on hover with an
 * overlay label and an "Explore" cue. Presentational (brand editorial promos);
 * demo imagery for now.
 */
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@sajawat/ui';

interface Tile {
  href: string;
  image: string;
  eyebrow: string;
  title: string;
}

const BIG: Tile = {
  href: '/products',
  image: '/demo/products/bridal-01.jpg',
  eyebrow: 'The Bridal Edit',
  title: 'Heirlooms for the big day',
};
const WIDE: Tile = {
  href: '/products',
  image: '/demo/products/necklace-01.jpg',
  eyebrow: 'Everyday Gold',
  title: 'Effortless, wear-anywhere shine',
};
const PAIR: Tile[] = [
  {
    href: '/products',
    image: '/demo/products/earring-01.jpg',
    eyebrow: 'Festive',
    title: 'Statement sets',
  },
  {
    href: '/products',
    image: '/demo/products/bangle-01.jpg',
    eyebrow: 'Gifting',
    title: 'Made to gift',
  },
];

function ShowcaseTile({ tile, className = '' }: { tile: Tile; className?: string }) {
  return (
    <Link
      href={tile.href}
      className={`group relative block overflow-hidden rounded-2xl bg-mist shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      <Image
        src={tile.image}
        alt={tile.title}
        fill
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{tile.eyebrow}</p>
        <h3 className="mt-1.5 font-serif text-xl drop-shadow-sm sm:text-2xl">{tile.title}</h3>
        <span className="mt-2 inline-block text-xs uppercase tracking-[0.22em] text-white/80 transition-colors group-hover:text-gold">
          Explore →
        </span>
      </div>
    </Link>
  );
}

export function ProductShowcase() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl text-ink sm:text-4xl">
            Jewellery that speaks for you
          </h2>
          <p className="mt-3 text-sm text-ink-soft sm:text-base">
            From everyday sparkle to once-in-a-lifetime moments — designs that add grace to every
            occasion.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <ShowcaseTile tile={BIG} className="min-h-[420px] lg:min-h-[560px]" />
          <div className="grid gap-4">
            <ShowcaseTile tile={WIDE} className="min-h-[220px] lg:min-h-[272px]" />
            <div className="grid gap-4 sm:grid-cols-2">
              {PAIR.map((t) => (
                <ShowcaseTile key={t.title} tile={t} className="min-h-[220px] lg:min-h-[272px]" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
