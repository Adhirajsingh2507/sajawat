import Image from 'next/image';
import Link from 'next/link';
import { Container, Eyebrow, Heading } from '@sajawat/ui';

/**
 * Featured-collection banner — a full-bleed lifestyle image with a CTA into a
 * collection. Static target for now (The Bridal Edit); CMS/settings-driven later.
 */
export function FeaturedBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-purple">
      <Image
        src="/demo/hero/hero-bridal.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center opacity-55"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-purple-dark via-purple-dark/70 to-transparent"
      />
      <Container className="relative flex min-h-[420px] items-center py-16 sm:min-h-[480px]">
        <div className="max-w-xl">
          <Eyebrow className="text-gold">Featured collection</Eyebrow>
          <Heading level={2} className="text-white">
            The Bridal Edit
          </Heading>
          <p className="mt-4 max-w-md text-lg text-white/85">
            Heirloom-inspired necklace-and-earring sets and statement pieces, crafted for wedding
            season and every celebration after.
          </p>
          <Link
            href="/collections/bridal-edit"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-ink transition-colors hover:bg-gold-dark"
          >
            Shop the edit
          </Link>
        </div>
      </Container>
    </section>
  );
}
