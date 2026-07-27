'use client';

/**
 * Storefront search with typeahead suggestions. Debounced reads from the public
 * search API; Enter (or "see all results") goes to the full /search page. Used in
 * both the desktop header and the mobile menu.
 */
import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicProduct } from '@sajawat/types';
import { searchProducts } from '@/services/catalog';
import { formatPrice } from '@/lib/format';

const DEBOUNCE_MS = 250;
const MAX_SUGGESTIONS = 5;

export function SearchBox({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PublicProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced typeahead. `active` guards against out-of-order responses; all
  // state updates happen inside the timer callback (never synchronously in the
  // effect body) to avoid cascading renders.
  useEffect(() => {
    const term = q.trim();
    let active = true;
    const id = setTimeout(() => {
      if (!active) return;
      if (term.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      void searchProducts(term, { limit: MAX_SUGGESTIONS })
        .then((res) => {
          if (active) setResults(res.items);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current !== null && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length === 0) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function goTo(href: string) {
    setOpen(false);
    setQ('');
    onNavigate?.();
    router.push(href);
  }

  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={wrapRef} className={`relative ${className ?? ''}`}>
      <form onSubmit={submit}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          placeholder="Search jewellery…"
          aria-label="Search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listId}
          className="h-9 w-full rounded-full border border-line bg-white px-4 text-sm text-ink placeholder:text-ink-faint focus:border-purple focus:outline-none"
        />
      </form>

      {showDropdown && (
        <div
          id={listId}
          className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink-faint">
              {loading ? 'Searching…' : 'No matches yet.'}
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      goTo(`/products/${p.slug}`);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-mist"
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-mist">
                      {p.images[0] !== undefined && (
                        <Image
                          src={p.images[0].url}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{p.name}</span>
                      <span className="block text-xs text-ink-soft">
                        {formatPrice(p.salePrice ?? p.price)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/search?q=${encodeURIComponent(q.trim())}`}
            onClick={() => {
              goTo(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
            className="block border-t border-line px-4 py-2.5 text-center text-sm font-medium text-purple hover:bg-mist"
          >
            See all results for “{q.trim()}” →
          </Link>
        </div>
      )}
    </div>
  );
}
