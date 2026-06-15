'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Badge, Container } from '@sajawat/ui';
import { useAsync } from '@/lib/use-async';
import { getProductBySlug } from '@/services/catalog';
import { formatPrice } from '@/lib/format';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { data: product, loading, error } = useAsync(() => getProductBySlug(slug), [slug]);
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

  return (
    <Container className="py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-mist">
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
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActive(i);
                  }}
                  className={`relative h-16 w-16 overflow-hidden rounded-lg border ${i === active ? 'border-purple' : 'border-line'}`}
                >
                  <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex gap-2">
            {product.isBestSeller && <Badge tone="gold">Best Seller</Badge>}
            {product.isFeatured && <Badge tone="purple">Featured</Badge>}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-ink">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            {product.salePrice !== undefined ? (
              <>
                <span className="text-2xl font-semibold text-purple">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-base text-ink-faint line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-semibold text-ink">{formatPrice(product.price)}</span>
            )}
          </div>
          <p className="mt-2 text-sm">
            {product.inStock ? (
              <span className="text-green-700">In stock</span>
            ) : (
              <span className="text-ink-faint">Out of stock</span>
            )}
          </p>
          {product.shortDescription !== undefined && (
            <p className="mt-6 text-ink-soft">{product.shortDescription}</p>
          )}
          {product.description !== undefined && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {product.description}
            </p>
          )}
          <p className="mt-8 text-xs text-ink-faint">SKU: {product.sku}</p>
          {/* Add to cart / wishlist arrive with the cart milestone (1.5). */}
        </div>
      </div>
    </Container>
  );
}
