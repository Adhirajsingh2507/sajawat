'use client';

/**
 * Shared product listing (Milestone 1.4b) — sort + pagination over a stable
 * `fetcher` (pages pass a useCallback-memoized fetcher so the effect doesn't
 * loop). Keeps stale results during refetch.
 */
import { useState } from 'react';
import type { Paginated, PublicProduct } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import { ProductGrid, ProductGridSkeleton } from './ProductGrid';

export type ProductFetcher = (q: {
  page: number;
  sort: string;
}) => Promise<Paginated<PublicProduct>>;

const SORTS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A–Z' },
];

const pageBtn =
  'rounded-full border border-line px-4 py-1.5 text-sm text-ink transition-colors ' +
  'hover:border-purple hover:text-purple disabled:opacity-40 disabled:pointer-events-none';

export function ProductListing({ fetcher }: { fetcher: ProductFetcher }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('-createdAt');
  const { data, loading, error } = useAsync(() => fetcher({ page, sort }), [page, sort, fetcher]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          {data !== null ? `${String(data.total)} item${data.total === 1 ? '' : 's'}` : ' '}
        </p>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Sort
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error !== null ? (
        <p className="py-16 text-center text-sm text-red-600">{error}</p>
      ) : data === null && loading ? (
        <ProductGridSkeleton />
      ) : data !== null ? (
        <>
          <ProductGrid products={data.items} />
          {data.pages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                type="button"
                className={pageBtn}
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => p - 1);
                }}
              >
                Previous
              </button>
              <span className="text-sm text-ink-soft">
                Page {String(data.page)} of {String(data.pages)}
              </span>
              <button
                type="button"
                className={pageBtn}
                disabled={page >= data.pages}
                onClick={() => {
                  setPage((p) => p + 1);
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
