'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { useCart, useWishlist } from '@/features/commerce/commerce-context';
import { SearchBox } from '@/components/SearchBox';
import { MegaMenu } from '@/components/MegaMenu';

/** Sticky storefront header — brand, shop nav, search, wishlist, cart, account, mobile menu. */
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
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-5 sm:gap-6 sm:px-8">
        <button
          type="button"
          onClick={() => {
            setMenuOpen((v) => !v);
          }}
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="text-ink-soft transition-colors hover:text-purple sm:hidden"
        >
          <MenuIcon open={menuOpen} />
        </button>

        <Link
          href="/"
          onClick={() => {
            setMenuOpen(false);
          }}
          className="font-serif text-xl font-semibold tracking-tight text-purple"
        >
          Sajawat
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-ink-soft sm:flex">
          <MegaMenu />
          <Link href="/wholesale" className="hover:text-purple">
            Wholesale
          </Link>
          <Link href="/contact" className="hover:text-purple">
            Contact
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <SearchBox className="hidden w-44 sm:block lg:w-56" />

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

          <Link
            href="/account"
            className="hidden text-sm text-ink-soft transition-colors hover:text-purple md:inline"
          >
            {user !== null ? `Hi, ${user.firstName}` : 'Account'}
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="hidden text-sm font-medium text-purple hover:underline sm:inline"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-line bg-cream sm:hidden">
          <div className="mx-auto max-w-[1600px] px-5 py-4">
            <SearchBox
              className="mb-4"
              onNavigate={() => {
                setMenuOpen(false);
              }}
            />
            <nav className="flex flex-col text-sm">
              <MobileLink href="/products" onNavigate={() => setMenuOpen(false)}>
                Shop all
              </MobileLink>
              <MobileLink href="/wholesale" onNavigate={() => setMenuOpen(false)}>
                Wholesale
              </MobileLink>
              <MobileLink href="/contact" onNavigate={() => setMenuOpen(false)}>
                Contact
              </MobileLink>
              <MobileLink href="/account" onNavigate={() => setMenuOpen(false)}>
                {user !== null ? `Hi, ${user.firstName}` : 'Account'}
              </MobileLink>
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
