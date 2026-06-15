'use client';

import Link from 'next/link';
import { Container, Eyebrow, Heading, Section } from '@sajawat/ui';
import { useAsync } from '@/lib/use-async';
import { getCategories, getProducts } from '@/services/catalog';
import { ProductGrid, ProductGridSkeleton } from '@/components/ProductGrid';

/** Home (Milestone 1.4b) — hero + shop-by-category + featured, live from the API. */
export default function HomePage() {
  const { data: categories } = useAsync(() => getCategories(), []);
  const { data: featured, loading } = useAsync(() => getProducts({ featured: true, limit: 8 }), []);

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
              href="#categories"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/70 px-8 text-sm font-medium text-white transition-colors hover:bg-white hover:text-purple"
            >
              Shop by category
            </Link>
          </div>
        </Container>
      </section>

      <Section id="categories">
        <Container>
          <Eyebrow>Shop by category</Eyebrow>
          <Heading level={2}>Find your piece</Heading>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(categories?.items ?? []).map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="rounded-xl border border-line bg-white p-6 text-center transition-colors hover:border-purple"
              >
                <span className="font-serif text-lg text-ink">{c.name}</span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-white">
        <Container>
          <Eyebrow>Editor’s picks</Eyebrow>
          <Heading level={2}>Featured</Heading>
          <div className="mt-8">
            {loading && featured === null ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <ProductGrid products={featured?.items ?? []} />
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
