'use client';

import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Container, Eyebrow, Heading } from '@sajawat/ui';
import { ProductListing } from '@/components/ProductListing';
import type { ProductFetcher } from '@/components/ProductListing';
import { CategorySwitcher } from '@/components/CategorySwitcher';
import { useAsync } from '@/lib/use-async';
import { getCategoryBySlug, getProducts } from '@/services/catalog';

export default function CategoryPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { data: category } = useAsync(() => getCategoryBySlug(slug), [slug]);
  const fetcher = useCallback<ProductFetcher>((q) => getProducts({ category: slug, ...q }), [slug]);

  return (
    <Container className="py-12">
      <Eyebrow>Category</Eyebrow>
      <Heading level={1} className="text-4xl">
        {category?.name ?? 'Category'}
      </Heading>
      {category?.description !== undefined && (
        <p className="mt-3 max-w-2xl text-ink-soft">{category.description}</p>
      )}
      <CategorySwitcher currentSlug={slug} />
      <div className="mt-8">
        <ProductListing fetcher={fetcher} />
      </div>
    </Container>
  );
}
