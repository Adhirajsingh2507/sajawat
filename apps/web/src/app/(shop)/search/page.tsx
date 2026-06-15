'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Eyebrow, Heading } from '@sajawat/ui';
import { ProductListing } from '@/components/ProductListing';
import type { ProductFetcher } from '@/components/ProductListing';
import { searchProducts } from '@/services/catalog';

function SearchResults() {
  const sp = useSearchParams();
  const q = sp.get('q') ?? '';
  const fetcher = useCallback<ProductFetcher>(
    (opts) => searchProducts(q, { page: opts.page }),
    [q],
  );

  return (
    <Container className="py-12">
      <Eyebrow>Search</Eyebrow>
      <Heading level={1} className="text-3xl">
        {q.length > 0 ? `Results for “${q}”` : 'Search'}
      </Heading>
      <div className="mt-8">
        {q.length > 0 ? (
          <ProductListing fetcher={fetcher} />
        ) : (
          <p className="text-sm text-ink-soft">Search the collection from the bar above.</p>
        )}
      </div>
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
