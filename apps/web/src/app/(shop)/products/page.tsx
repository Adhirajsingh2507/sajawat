'use client';

import { useCallback } from 'react';
import { Container, Eyebrow, Heading } from '@sajawat/ui';
import { ProductListing } from '@/components/ProductListing';
import type { ProductFetcher } from '@/components/ProductListing';
import { getProducts } from '@/services/catalog';

export default function ProductsPage() {
  const fetcher = useCallback<ProductFetcher>((q) => getProducts(q), []);
  return (
    <Container className="py-12">
      <Eyebrow>The collection</Eyebrow>
      <Heading level={1} className="text-4xl">
        All jewellery
      </Heading>
      <div className="mt-8">
        <ProductListing fetcher={fetcher} />
      </div>
    </Container>
  );
}
