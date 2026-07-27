'use client';

/**
 * Account hub (Milestone 1.4c) — entry point for order history and saved items.
 * Profile/address management land in later milestones; this page is the stable
 * shell they slot into.
 */
import Link from 'next/link';
import { Container } from '@sajawat/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useCart, useWishlist } from '@/features/commerce/commerce-context';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { count: wishCount } = useWishlist();
  const { itemCount } = useCart();

  return (
    <Container className="py-12">
      <h1 className="font-serif text-3xl font-semibold text-ink">My account</h1>
      {user !== null && (
        <p className="mt-1 text-sm text-ink-soft">
          {user.firstName} {user.lastName} · {user.email}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AccountTile
          href="/account/profile"
          title="Profile & address"
          subtitle={
            user?.address?.line1 !== undefined && user.address.line1.length > 0
              ? `${user.address.line1}${user.address.city !== undefined ? `, ${user.address.city}` : ''}`
              : 'Add your details & delivery address'
          }
        />
        <AccountTile
          href="/account/orders"
          title="Orders"
          subtitle="Track and review your orders"
        />
        <AccountTile
          href="/wishlist"
          title="Wishlist"
          subtitle={`${wishCount} ${wishCount === 1 ? 'piece' : 'pieces'} saved`}
        />
        <AccountTile
          href="/cart"
          title="Cart"
          subtitle={`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        />
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-8 text-sm font-medium text-purple hover:underline"
      >
        Sign out
      </button>
    </Container>
  );
}

function AccountTile({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-white p-6 transition-colors hover:border-purple"
    >
      <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
    </Link>
  );
}
