import type { PublicProduct } from '@sajawat/types';
import { ProductCard } from './ProductCard';

type Columns = 3 | 4;

const GRID: Record<Columns, string> = {
  3: 'grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4',
};

export function ProductGridSkeleton({
  count = 8,
  columns = 3,
}: {
  count?: number;
  columns?: Columns;
}) {
  return (
    <div className={GRID[columns]}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-square animate-pulse rounded-xl bg-mist" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-mist" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-mist" />
        </div>
      ))}
    </div>
  );
}

export function ProductGrid({
  products,
  columns = 3,
}: {
  products: PublicProduct[];
  columns?: Columns;
}) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-sm text-ink-soft">No products found.</p>;
  }
  return (
    <div className={GRID[columns]}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
