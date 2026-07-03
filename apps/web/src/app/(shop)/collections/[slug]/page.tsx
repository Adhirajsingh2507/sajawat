'use client';

import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Container, Eyebrow, Heading } from '@sajawat/ui';
import { ProductListing } from '@/components/ProductListing';
import type { ProductFetcher } from '@/components/ProductListing';
import { useAsync } from '@/lib/use-async';
import { getCollectionBySlug, getProducts } from '@/services/catalog';

export default function CollectionPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { data: collection } = useAsync(() => getCollectionBySlug(slug), [slug]);
  const fetcher = useCallback<ProductFetcher>(
    (q) => getProducts({ collection: slug, ...q }),
    [slug],
  );

  return (
    <Container className="py-12">
      <Eyebrow>Collection</Eyebrow>
      <Heading level={1} className="text-4xl">
        {collection?.name ?? 'Collection'}
      </Heading>
      {collection?.description !== undefined && (
        <p className="mt-3 max-w-2xl text-ink-soft">{collection.description}</p>
      )}
      <div className="mt-8">
        <ProductListing fetcher={fetcher} />
      </div>
    </Container>
  );
}
