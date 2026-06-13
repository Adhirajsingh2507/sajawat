import Link from 'next/link';
import { Container, Eyebrow, Heading, Section } from '@sajawat/ui';

/**
 * Home (Milestone 1.4a) — branded hero + section scaffolding. Live catalogue
 * data (categories, featured, best sellers, new arrivals) is wired in 1.4b.
 */
export default function HomePage() {
  return (
    <>
      <section className="bg-purple text-white">
        <Container className="py-20 text-center sm:py-28">
          <Eyebrow className="text-gold">The Sajawat Collection</Eyebrow>
          <Heading level={1} className="mx-auto max-w-3xl text-white">
            Jewellery made for every celebration
          </Heading>
          <p className="mx-auto mt-5 max-w-xl text-white/80">
            Necklaces, earrings, and bridal sets crafted to feel precious — without the
            precious-metal price.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-ink transition-colors hover:bg-gold-dark"
            >
              Shop the collection
            </Link>
            <Link
              href="/collections"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/70 px-8 text-sm font-medium text-white transition-colors hover:bg-white hover:text-purple"
            >
              View collections
            </Link>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <Eyebrow>Curated for you</Eyebrow>
          <Heading level={2}>Explore the catalogue</Heading>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Shop by category, featured collections, best sellers and new arrivals appear here next —
            wired to the live catalogue in the following release.
          </p>
        </Container>
      </Section>
    </>
  );
}
