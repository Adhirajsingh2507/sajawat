'use client';

/**
 * Desktop "Shop" mega-menu — a full-width dropdown of category image tiles and a
 * collections column. Opens on hover/focus (the trigger fills the header height
 * so there's no gap to the panel) and on click for keyboard/touch. Data comes
 * from the public catalog API.
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAsync } from '@/lib/use-async';
import { getCategories, getCollections } from '@/services/catalog';

export function MegaMenu() {
  const { data: categories } = useAsync(() => getCategories(), []);
  const { data: collections } = useAsync(() => getCollections(), []);
  const [open, setOpen] = useState(false);

  const cats = categories?.items ?? [];
  const cols = (collections?.items ?? []).slice(0, 4);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
  };

  return (
    <div
      className="static flex h-16 items-center"
      onMouseEnter={() => {
        setOpen(true);
      }}
      onMouseLeave={close}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => {
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-purple"
      >
        Shop
        <Chevron open={open} />
      </button>

      {/* Full-width panel (positioned against the sticky header). */}
      <div
        className={`absolute left-0 right-0 top-full transition-all duration-200 ${
          open
            ? 'visible translate-y-0 opacity-100'
            : 'pointer-events-none invisible -translate-y-1 opacity-0'
        }`}
      >
        <div className="border-t border-line bg-cream shadow-lg">
          <div className="mx-auto grid max-w-[1600px] gap-8 px-8 py-8 lg:grid-cols-[2fr_1fr]">
            {/* Categories */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                  Shop by category
                </span>
                <Link
                  href="/products"
                  onClick={close}
                  className="text-sm font-medium text-purple hover:text-gold-dark"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {cats.map((c) => (
                  <Link
                    key={c.id}
                    href={`/categories/${c.slug}`}
                    onClick={close}
                    className="group flex items-center gap-3"
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-mist">
                      {c.image !== undefined && (
                        <Image
                          src={c.image}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                    </span>
                    <span className="text-sm font-medium text-ink group-hover:text-purple">
                      {c.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Collections */}
            <div className="lg:border-l lg:border-line lg:pl-8">
              <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Collections
              </span>
              <ul className="space-y-2">
                {cols.map((col) => (
                  <li key={col.id}>
                    <Link
                      href={`/collections/${col.slug}`}
                      onClick={close}
                      className="text-sm text-ink-soft transition-colors hover:text-purple"
                    >
                      {col.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href="/wholesale"
                    onClick={close}
                    className="text-sm font-medium text-purple hover:text-gold-dark"
                  >
                    Wholesale enquiries →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
