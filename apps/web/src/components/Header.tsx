'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { useCart, useWishlist } from '@/features/commerce/commerce-context';
import { SearchBox } from '@/components/SearchBox';
import { MegaMenu } from '@/components/MegaMenu';

/**
 * Luxury storefront header (PR-1 homepage redesign). Two tiers: the centered
 * Sajawat brand logo with account/search/wishlist/cart to the right, and a
 * centered collection nav below (a thin gold hairline between them). Sticky +
 * blurred. Mobile collapses the nav into a slide-down panel behind the hamburger.
 */
const NAV: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop All' },
  { href: '/products', label: 'New In' },
  { href: '/products', label: 'Best Sellers' },
  { href: '/wholesale', label: 'Wholesale' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const { user, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const { count: wishCount, openWishlist } = useWishlist();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function onLogout() {
    void (async () => {
      await logout();
      router.replace('/login');
    })();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      {/* Tier 1 — actions left/right, logo centered */}
      <div className="mx-auto grid h-[76px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:h-[88px] sm:px-8">
        {/* Left: mobile menu toggle */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
            }}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="text-ink-soft transition-colors hover:text-purple lg:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>

        {/* Center: brand logo */}
        <Link
          href="/"
          onClick={() => {
            setMenuOpen(false);
          }}
          className="flex items-center justify-center transition-opacity hover:opacity-90"
          aria-label="Sajawat Jewellery — home"
        >
          <Image
            src="/brand/sajawat-logo.png"
            alt="Sajawat Jewellery"
            width={439}
            height={640}
            priority
            sizes="(min-width: 1024px) 72px, 56px"
            className="h-[52px] w-auto sm:h-[64px] lg:h-[72px]"
          />
        </Link>

        {/* Right: search + account actions */}
        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <SearchBox className="hidden w-40 xl:block xl:w-56" />

          <Link
            href="/account"
            aria-label={user !== null ? `Account — ${user.firstName}` : 'Account'}
            className="text-ink-soft transition-colors hover:text-purple"
          >
            <UserIcon />
          </Link>

          <button
            type="button"
            onClick={openWishlist}
            aria-label={`Wishlist${wishCount > 0 ? ` (${String(wishCount)} items)` : ''}`}
            className="relative text-ink-soft transition-colors hover:text-purple"
          >
            <HeartIcon />
            {wishCount > 0 && <CountBadge value={wishCount} />}
          </button>

          <button
            type="button"
            onClick={openCart}
            aria-label={`Cart${itemCount > 0 ? ` (${String(itemCount)} items)` : ''}`}
            className="relative text-ink-soft transition-colors hover:text-purple"
          >
            <BagIcon />
            {itemCount > 0 && <CountBadge value={itemCount} />}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="hidden text-xs font-medium text-purple hover:underline xl:inline"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tier 2 — centered collection nav (desktop) */}
      <div className="hidden border-t border-gold/25 lg:block">
        <nav className="mx-auto flex h-11 max-w-[1600px] items-center justify-center gap-8 px-8 text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">
          {NAV.slice(0, 2).map((item) => (
            <Link key={item.label} href={item.href} className="transition-colors hover:text-purple">
              {item.label}
            </Link>
          ))}
          <MegaMenu />
          {NAV.slice(2).map((item) => (
            <Link key={item.label} href={item.href} className="transition-colors hover:text-purple">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-line bg-cream lg:hidden">
          <div className="mx-auto max-w-[1600px] px-5 py-4">
            <SearchBox
              className="mb-4"
              onNavigate={() => {
                setMenuOpen(false);
              }}
            />
            <nav className="flex flex-col text-sm">
              {NAV.map((item) => (
                <MobileLink key={item.label} href={item.href} onNavigate={() => setMenuOpen(false)}>
                  {item.label}
                </MobileLink>
              ))}
              <MobileLink href="/account/orders" onNavigate={() => setMenuOpen(false)}>
                My orders
              </MobileLink>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="py-2.5 text-left font-medium text-purple"
              >
                Sign out
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="border-b border-line py-2.5 text-ink-soft transition-colors hover:text-purple"
    >
      {children}
    </Link>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple px-1 text-[10px] font-semibold leading-none text-white">
      {value > 99 ? '99+' : value}
    </span>
  );
}

function MenuIcon({ open }: { open: boolean }) {
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
      {open ? (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      ) : (
        <>
          <path d="M3 12h18" />
          <path d="M3 6h18" />
          <path d="M3 18h18" />
        </>
      )}
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="21"
      height="21"
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
      width="21"
      height="21"
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
