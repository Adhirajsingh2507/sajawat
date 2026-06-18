'use client';

/**
 * Wishlist page (Milestone 1.4c) — saved products. Each card carries the heart
 * toggle, so removals re-render straight from the wishlist context.
 */
import Link from 'next/link';
import { Container } from '@sajawat/ui';
import { useWishlist } from '@/features/commerce/commerce-context';
import { ProductCard } from '@/components/ProductCard';

export default function WishlistPage() {
  const { wishlist, loading } = useWishlist();

  if (loading && wishlist === null) {
    return (
      <Container className="py-20">
        <p className="text-center text-sm text-ink-soft">Loading your wishlist…</p>
      </Container>
    );
  }

  const items = wishlist?.items ?? [];

  if (items.length === 0) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink">Your wishlist is empty</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Tap the heart on any piece to save it for later.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-purple px-6 text-sm font-medium text-white hover:bg-purple-dark"
        >
          Shop all jewellery
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <h1 className="font-serif text-3xl font-semibold text-ink">Wishlist</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {items.length} {items.length === 1 ? 'piece' : 'pieces'} saved
      </p>
      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
