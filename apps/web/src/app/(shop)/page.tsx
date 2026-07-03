'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Container, Eyebrow, Heading, Section } from '@sajawat/ui';
import type { PublicCategory, PublicCollection } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import { getCategories, getCollections, getProducts } from '@/services/catalog';
import { ProductGrid, ProductGridSkeleton } from '@/components/ProductGrid';
import { ProductCarousel } from '@/components/ProductCarousel';
import { HeroCarousel } from '@/components/HeroCarousel';
import { Testimonials } from '@/components/Testimonials';

/**
 * Home — an editorial luxury landing page (image hero → trust → shop-by-category
 * → featured → collections → best sellers → craftsmanship story → wholesale CTA),
 * all live from the public catalog API. Built for the client showcase.
 */
export default function HomePage() {
  const { data: categories } = useAsync(() => getCategories(), []);
  const { data: collections } = useAsync(() => getCollections(), []);
  const { data: featured, loading: featuredLoading } = useAsync(
    () => getProducts({ featured: true, limit: 8 }),
    [],
  );
  const { data: bestSellers, loading: bestLoading } = useAsync(
    () => getProducts({ bestSeller: true, limit: 8 }),
    [],
  );
  const { data: newArrivals } = useAsync(() => getProducts({ sort: '-createdAt', limit: 8 }), []);

  return (
    <>
      <HeroCarousel />

      <TrustBar />

      {/* Shop by category */}
      <Section id="categories">
        <Container>
          <SectionHeader
            eyebrow="Shop by category"
            title="Find your piece"
            href="/products"
            linkLabel="View all"
          />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(categories?.items ?? []).map((c) => (
              <CategoryTile key={c.id} category={c} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Featured */}
      <Section className="bg-white">
        <Container>
          <SectionHeader
            eyebrow="Editor’s picks"
            title="Featured this season"
            href="/products"
            linkLabel="Shop all"
          />
          <div className="mt-8">
            {featuredLoading && featured === null ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <ProductGrid products={featured?.items ?? []} />
            )}
          </div>
        </Container>
      </Section>

      {/* Collections */}
      {(collections?.items.length ?? 0) > 0 && (
        <Section>
          <Container>
            <SectionHeader eyebrow="Curated edits" title="Shop by collection" />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {(collections?.items ?? []).slice(0, 3).map((col) => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Best sellers */}
      <Section className="bg-white">
        <Container>
          <SectionHeader
            eyebrow="Loved by many"
            title="Best sellers"
            href="/products"
            linkLabel="Shop best sellers"
          />
          <div className="mt-8">
            {bestLoading && bestSellers === null ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <ProductCarousel products={bestSellers?.items ?? []} />
            )}
          </div>
        </Container>
      </Section>

      {/* New arrivals */}
      {(newArrivals?.items.length ?? 0) > 0 && (
        <Section>
          <Container>
            <SectionHeader
              eyebrow="Just in"
              title="New arrivals"
              href="/products"
              linkLabel="Shop all"
            />
            <div className="mt-8">
              <ProductCarousel products={newArrivals?.items ?? []} />
            </div>
          </Container>
        </Section>
      )}

      <StorySection />

      <Testimonials />

      <WholesaleBand />
    </>
  );
}

/* -------------------------------- Trust bar ------------------------------- */

const TRUST: { title: string; sub: string }[] = [
  { title: 'Handcrafted finish', sub: 'Detailed by artisans' },
  { title: 'Free shipping', sub: 'On orders over ₹1,499' },
  { title: 'Easy 7-day returns', sub: 'Shop with confidence' },
  { title: 'Secure checkout', sub: 'Razorpay protected' },
];

function TrustBar() {
  return (
    <div className="border-y border-line bg-gold-soft/40">
      <Container className="grid grid-cols-2 gap-x-6 gap-y-5 py-6 sm:grid-cols-4">
        {TRUST.map((t) => (
          <div key={t.title} className="text-center sm:text-left">
            <p className="text-sm font-semibold text-ink">{t.title}</p>
            <p className="mt-0.5 text-xs text-ink-soft">{t.sub}</p>
          </div>
        ))}
      </Container>
    </div>
  );
}

/* ------------------------------ Section header ---------------------------- */

function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading level={2}>{title}</Heading>
      </div>
      {href !== undefined && linkLabel !== undefined && (
        <Link
          href={href}
          className="hidden shrink-0 pb-1 text-sm font-medium text-purple transition-colors hover:text-gold-dark sm:inline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/* ------------------------------ Category tile ----------------------------- */

function CategoryTile({ category }: { category: PublicCategory }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-line bg-mist"
    >
      {category.image !== undefined && (
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent"
      />
      <span className="absolute inset-x-0 bottom-0 p-4 text-center font-serif text-base text-white sm:text-lg">
        {category.name}
      </span>
    </Link>
  );
}

/* ----------------------------- Collection card ---------------------------- */

function CollectionCard({ collection }: { collection: PublicCollection }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group relative block aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-mist"
    >
      {collection.bannerImage !== undefined && (
        <Image
          src={collection.bannerImage}
          alt=""
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/75 to-ink/5" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-serif text-xl text-white">{collection.name}</h3>
        {collection.description !== undefined && (
          <p className="mt-1 line-clamp-2 text-sm text-white/80">{collection.description}</p>
        )}
        <span className="mt-3 inline-block text-sm font-medium text-gold-soft">
          Explore the edit →
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------ Story section ----------------------------- */

function StorySection() {
  return (
    <Section>
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-mist">
            <Image
              src="/demo/hero/hero-layered.jpg"
              alt="Layered gold-tone jewellery"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <Eyebrow>Our craft</Eyebrow>
            <Heading level={2}>Precious-looking, thoughtfully priced</Heading>
            <p className="mt-5 text-ink-soft">
              Every Sajawat piece is designed in-house and finished by hand — from the weight of a
              bridal set to the clasp on an everyday chain. We obsess over the details so your
              jewellery looks and feels far above its price.
            </p>
            <p className="mt-4 text-ink-soft">
              The result: heirloom-worthy design, made accessible for every celebration.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-purple px-8 text-sm font-medium text-white transition-colors hover:bg-purple-dark"
            >
              Explore the collection
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ----------------------------- Wholesale band ----------------------------- */

function WholesaleBand() {
  return (
    <Section className="bg-purple">
      <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="max-w-xl">
          <Eyebrow className="text-gold">For businesses</Eyebrow>
          <Heading level={2} className="text-white">
            Buying wholesale?
          </Heading>
          <p className="mt-3 text-white/80">
            Retailers and resellers get dedicated pricing and support. Tell us what you need and our
            team will be in touch.
          </p>
        </div>
        <Link
          href="/wholesale"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-ink transition-colors hover:bg-gold-dark"
        >
          Enquire for wholesale
        </Link>
      </Container>
    </Section>
  );
}
