import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@sajawat/ui';
import type { PublicProduct } from '@sajawat/types';
import { formatPrice } from '@/lib/format';
import { WishlistButton } from '@/features/commerce/WishlistButton';
import { QuickViewButton } from '@/features/quickview/QuickViewButton';

function Price({ price, salePrice }: { price: number; salePrice?: number | undefined }) {
  if (salePrice !== undefined) {
    return (
      <p className="mt-1 flex items-center gap-2">
        <span className="text-sm font-semibold text-purple">{formatPrice(salePrice)}</span>
        <span className="text-xs text-ink-faint line-through">{formatPrice(price)}</span>
      </p>
    );
  }
  return <p className="mt-1 text-sm font-semibold text-ink">{formatPrice(price)}</p>;
}

export function ProductCard({ product }: { product: PublicProduct }) {
  const image = product.images[0];
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-mist">
        {image !== undefined ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-4xl text-ink-faint">
            {product.name.charAt(0)}
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.isBestSeller && <Badge tone="gold">Best Seller</Badge>}
          {product.isFeatured && <Badge tone="purple">Featured</Badge>}
        </div>
        {!product.inStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2 py-1 text-xs text-white">
            Sold out
          </span>
        )}
        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} variant="icon" />
        </div>
        {product.inStock && <QuickViewButton product={product} />}
      </div>
      <h3 className="mt-3 text-sm font-medium text-ink group-hover:text-purple">{product.name}</h3>
      <Price price={product.price} salePrice={product.salePrice} />
    </Link>
  );
}
