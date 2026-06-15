'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';

/** Sticky storefront header — brand, shop-all nav, search, account. */
export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');

  function onLogout() {
    void (async () => {
      await logout();
      router.replace('/login');
    })();
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length > 0) {
      router.push(`/search?q=${encodeURIComponent(term)}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-purple">
          Sajawat
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-ink-soft sm:flex">
          <Link href="/products" className="hover:text-purple">
            Shop all
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <form onSubmit={onSearch} className="hidden sm:block">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
              }}
              placeholder="Search jewellery…"
              aria-label="Search"
              className="h-9 w-56 rounded-full border border-line bg-white px-4 text-sm text-ink placeholder:text-ink-faint focus:border-purple focus:outline-none"
            />
          </form>
          {user !== null && (
            <span className="hidden text-sm text-ink-soft md:inline">Hi, {user.firstName}</span>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="text-sm font-medium text-purple hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
