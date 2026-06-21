'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { useCart, useWishlist } from '@/features/commerce/commerce-context';

/** Sticky storefront header — brand, shop-all nav, search, wishlist, cart, account. */
export function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
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
          <Link href="/wholesale" className="hover:text-purple">
            Wholesale
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <form onSubmit={onSearch} className="hidden sm:block">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
              }}
              placeholder="Search jewellery…"
              aria-label="Search"
              className="h-9 w-44 rounded-full border border-line bg-white px-4 text-sm text-ink placeholder:text-ink-faint focus:border-purple focus:outline-none lg:w-56"
            />
          </form>

          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishCount > 0 ? ` (${String(wishCount)} items)` : ''}`}
            className="relative text-ink-soft transition-colors hover:text-purple"
          >
            <HeartIcon />
            {wishCount > 0 && <CountBadge value={wishCount} />}
          </Link>

          <Link
            href="/cart"
            aria-label={`Cart${itemCount > 0 ? ` (${String(itemCount)} items)` : ''}`}
            className="relative text-ink-soft transition-colors hover:text-purple"
          >
            <BagIcon />
            {itemCount > 0 && <CountBadge value={itemCount} />}
          </Link>

          <Link
            href="/account"
            className="hidden text-sm text-ink-soft transition-colors hover:text-purple md:inline"
          >
            {user !== null ? `Hi, ${user.firstName}` : 'Account'}
          </Link>

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

function CountBadge({ value }: { value: number }) {
  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple px-1 text-[10px] font-semibold leading-none text-white">
      {value > 99 ? '99+' : value}
    </span>
  );
}

function BagIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}
