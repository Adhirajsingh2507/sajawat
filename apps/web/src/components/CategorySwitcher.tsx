'use client';

/**
 * In-category switcher — chips to move between a category and its subcategories
 * without going back to the nav. Viewing a parent shows "All {parent}" + its
 * children; viewing a subcategory shows the same group with the current one
 * highlighted (so siblings and the parent are one click away). Renders nothing
 * when the category has no subcategories.
 */
import Link from 'next/link';
import type { PublicCategory } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import { getCategories } from '@/services/catalog';

export function CategorySwitcher({ currentSlug }: { currentSlug: string }) {
  const { data } = useAsync(() => getCategories(), []);
  const cats = data?.items ?? [];
  const current = cats.find((c) => c.slug === currentSlug);
  if (current === undefined) return null;

  // The group is the parent and its children (current may be either).
  const parent = current.parentId == null ? current : cats.find((c) => c.id === current.parentId);
  if (parent === undefined) return null;

  const children = cats
    .filter((c) => c.parentId === parent.id)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  if (children.length === 0) return null;

  const chips: { key: string; slug: string; label: string }[] = [
    { key: parent.id, slug: parent.slug, label: `All ${parent.name}` },
    ...children.map((c: PublicCategory) => ({ key: c.id, slug: c.slug, label: c.name })),
  ];

  return (
    <nav aria-label="Subcategories" className="mt-6 flex flex-wrap gap-2">
      {chips.map((c) => {
        const active = c.slug === currentSlug;
        return (
          <Link
            key={c.key}
            href={`/categories/${c.slug}`}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              active
                ? 'border-purple bg-purple text-white'
                : 'border-line text-ink-soft hover:border-purple hover:text-purple'
            }`}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}
