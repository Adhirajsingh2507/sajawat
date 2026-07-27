'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicCategory } from '@sajawat/types';
import { useAuth } from '@/features/auth/auth-context';
import { useCart, useWishlist } from '@/features/commerce/commerce-context';
import { useAsync } from '@/lib/use-async';
import { getCategories } from '@/services/catalog';
import { SearchBox } from '@/components/SearchBox';

/**
 * Luxury storefront header (PR-1 homepage redesign). Two tiers: the centered
 * Sajawat brand logo with account/search/wishlist/cart to the right, and a
 * centered nav below (a thin gold hairline between them). Sticky + blurred.
 * Mobile collapses the nav into a slide-down panel behind the hamburger.
 *
 * The nav lists each catalog category inline (between the lead and tail links).
 * Each category is a hover-ready host (NavCategory) so the planned subcategory
 * dropdown can mount inside its `group` container with no structural change.
 */
const LEAD_NAV: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop All' },
];
const TAIL_NAV: { href: string; label: string }[] = [
  { href: '/wholesale', label: 'Wholesale' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const { user, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const { count: wishCount, openWishlist } = useWishlist();
  const { data: categoryData } = useAsync(() => getCategories(), []);
  const categories = categoryData?.items ?? [];
  // Only top-level categories go in the bar; each carries its subcategories,
  // shown in a hover dropdown (desktop) / indented (mobile).
  const topCategories = categories.filter((c) => c.parentId == null);
  const childrenByParent = new Map<string, PublicCategory[]>();
  for (const c of categories) {
    if (c.parentId != null) {
      const list = childrenByParent.get(c.parentId) ?? [];
      list.push(c);
      childrenByParent.set(c.parentId, list);
    }
  }
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  // Which category's dropdown is open. Controlled (not CSS :hover) so only one is
  // ever open — moving the cursor onto another category closes the previous.
  const [openCat, setOpenCat] = useState<string | null>(null);

  function onLogout() {
    void (async () => {
      await logout();
      router.replace('/login');
    })();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      {/* Tier 1 — actions left/right, logo centered */}
      <div className="mx-auto grid h-[92px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:h-[116px] sm:px-8">
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
            sizes="(min-width: 1024px) 104px, 84px"
            className="h-[68px] w-auto sm:h-[88px] lg:h-[104px]"
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
        <nav
          onMouseLeave={() => {
            setOpenCat(null);
          }}
          className="mx-auto flex h-11 max-w-[1600px] flex-wrap items-center justify-center gap-x-6 gap-y-1 px-8 text-[13px] font-medium uppercase tracking-[0.12em] text-ink-soft"
        >
          {LEAD_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onMouseEnter={() => {
                setOpenCat(null);
              }}
              className="whitespace-nowrap transition-colors hover:text-purple"
            >
              {item.label}
            </Link>
          ))}
          {topCategories.map((cat) => (
            <NavCategory
              key={cat.id}
              category={cat}
              subcategories={childrenByParent.get(cat.id) ?? []}
              open={openCat === cat.id}
              onOpen={() => {
                setOpenCat(cat.id);
              }}
              onClose={() => {
                setOpenCat(null);
              }}
            />
          ))}
          {TAIL_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onMouseEnter={() => {
                setOpenCat(null);
              }}
              className="whitespace-nowrap transition-colors hover:text-purple"
            >
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
              {LEAD_NAV.map((item) => (
                <MobileLink key={item.label} href={item.href} onNavigate={() => setMenuOpen(false)}>
                  {item.label}
                </MobileLink>
              ))}
              {topCategories.map((cat) => (
                <div key={cat.id}>
                  <MobileLink
                    href={`/categories/${cat.slug}`}
                    onNavigate={() => setMenuOpen(false)}
                  >
                    {cat.name}
                  </MobileLink>
                  {(childrenByParent.get(cat.id) ?? []).map((sub) => (
                    <MobileLink
                      key={sub.id}
                      href={`/categories/${sub.slug}`}
                      onNavigate={() => setMenuOpen(false)}
                    >
                      <span className="pl-4 text-ink-faint">{sub.name}</span>
                    </MobileLink>
                  ))}
                </div>
              ))}
              {TAIL_NAV.map((item) => (
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

/**
 * A single top-level category in the desktop nav bar. When it has subcategories,
 * pointing at it (or focusing it) opens a dropdown of them — open/close is driven
 * by the parent's shared `openCat` state, so only one dropdown is ever open and
 * moving the cursor onto another category closes this one immediately. The panel
 * sits directly under the trigger (no gap to cross). No children = plain link.
 */
function NavCategory({
  category,
  subcategories,
  open,
  onOpen,
  onClose,
}: {
  category: PublicCategory;
  subcategories: PublicCategory[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const hasChildren = subcategories.length > 0;
  return (
    <div
      className="relative flex h-11 items-center"
      onMouseEnter={hasChildren ? onOpen : onClose}
      onFocus={hasChildren ? onOpen : onClose}
    >
      <Link
        href={`/categories/${category.slug}`}
        aria-expanded={hasChildren ? open : undefined}
        className="whitespace-nowrap transition-colors hover:text-purple"
      >
        {category.name}
      </Link>
      {hasChildren && (
        <div
          className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 transition-all duration-200 ${
            open ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
        >
          <ul className="min-w-[200px] rounded-xl border border-line bg-cream py-2 shadow-lg">
            {subcategories.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/categories/${sub.slug}`}
                  className="block px-4 py-2 text-[12px] normal-case tracking-normal text-ink-soft transition-colors hover:bg-mist/60 hover:text-purple"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
