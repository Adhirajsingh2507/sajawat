'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge, Container, Eyebrow, Heading } from '@sajawat/ui';
import { useAsync } from '@/lib/use-async';
import { getProductBySlug, getProducts } from '@/services/catalog';
import { formatPrice } from '@/lib/format';
import { AddToCart } from '@/features/commerce/AddToCart';
import { WishlistButton } from '@/features/commerce/WishlistButton';
import { ProductCarousel } from '@/components/ProductCarousel';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { data: product, loading, error } = useAsync(() => getProductBySlug(slug), [slug]);
  const { data: pool } = useAsync(() => getProducts({ limit: 24 }), []);
  const [active, setActive] = useState(0);

  if (product === null) {
    return (
      <Container className="py-20">
        <p className="text-center text-sm text-ink-soft">
          {loading ? 'Loading…' : (error ?? 'Product not found.')}
        </p>
      </Container>
    );
  }

  const main = product.images[active] ?? product.images[0];
  const discount =
    product.salePrice !== undefined && product.price > 0
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  const related = (pool?.items ?? [])
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 8);

  return (
    <>
      <Container className="py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-ink-faint">
          <Link href="/" className="hover:text-purple">
            Home
          </Link>
          <span className="px-1.5">/</span>
          <Link href="/products" className="hover:text-purple">
            Shop
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-ink-soft">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {product.images.length > 1 && (
              <div className="flex gap-3 sm:flex-col">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`View image ${String(i + 1)}`}
                    aria-pressed={i === active}
                    onClick={() => {
                      setActive(i);
                    }}
                    className={`relative h-16 w-16 overflow-hidden rounded-lg border transition-colors sm:h-20 sm:w-20 ${
                      i === active ? 'border-purple' : 'border-line hover:border-ink-faint'
                    }`}
                  >
                    <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl border border-line bg-mist">
              {main !== undefined ? (
                <Image
                  src={main.url}
                  alt={main.alt ?? product.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center font-serif text-6xl text-ink-faint">
                  {product.name.charAt(0)}
                </div>
              )}
              {discount > 0 && (
                <span className="absolute left-4 top-4 rounded-full bg-purple px-3 py-1 text-xs font-semibold text-white">
                  {discount}% off
                </span>
              )}
            </div>
          </div>

          {/* Buy box — sticky on desktop */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex gap-2">
              {product.isBestSeller && <Badge tone="gold">Best Seller</Badge>}
              {product.isFeatured && <Badge tone="purple">Featured</Badge>}
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              {product.salePrice !== undefined ? (
                <>
                  <span className="text-2xl font-semibold text-purple">
                    {formatPrice(product.salePrice)}
                  </span>
                  <span className="text-base text-ink-faint line-through">
                    {formatPrice(product.price)}
                  </span>
                  {discount > 0 && (
                    <span className="text-sm font-medium text-gold-dark">Save {discount}%</span>
                  )}
                </>
              ) : (
                <span className="text-2xl font-semibold text-ink">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-sm">
              <span
                aria-hidden
                className={`inline-block h-2 w-2 rounded-full ${product.inStock ? 'bg-green-600' : 'bg-ink-faint'}`}
              />
              {product.inStock ? (
                <span className="text-green-700">In stock — ready to ship</span>
              ) : (
                <span className="text-ink-faint">Out of stock</span>
              )}
            </p>

            {product.shortDescription !== undefined && (
              <p className="mt-6 text-ink-soft">{product.shortDescription}</p>
            )}

            <AddToCart productId={product.id} inStock={product.inStock} />
            <div className="mt-3">
              <WishlistButton productId={product.id} />
            </div>

            {/* Trust row */}
            <ul className="mt-8 grid grid-cols-1 gap-3 border-t border-line pt-6 text-sm text-ink-soft sm:grid-cols-3">
              <TrustItem label="Free shipping" sub="Over ₹1,499" />
              <TrustItem label="7-day returns" sub="Easy & free" />
              <TrustItem label="Secure checkout" sub="Razorpay" />
            </ul>

            {product.description !== undefined && (
              <div className="mt-8 border-t border-line pt-6">
                <h2 className="font-serif text-lg text-ink">Details</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {product.description}
                </p>
              </div>
            )}

            <p className="mt-8 text-xs text-ink-faint">SKU: {product.sku}</p>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-line bg-white py-14 sm:py-20">
          <Container>
            <Eyebrow>You may also like</Eyebrow>
            <Heading level={2}>More from this category</Heading>
            <div className="mt-8">
              <ProductCarousel products={related} />
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

function TrustItem({ label, sub }: { label: string; sub: string }) {
  return (
    <li>
      <p className="font-medium text-ink">{label}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{sub}</p>
    </li>
  );
}
