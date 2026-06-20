'use client';

/**
 * Console sidebar (Milestone 1.7) — brand mark + permission-filtered nav. Items
 * the signed-in role can't access are hidden (the API still enforces access).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission, isRole } from '@sajawat/shared';
import { useAuth } from '@/features/auth/auth-context';
import { NAV_ITEMS } from '@/features/console/nav';

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const role = user !== null && isRole(user.role) ? user.role : null;

  const items = NAV_ITEMS.filter(
    (item) => item.permission === null || (role !== null && hasPermission(role, item.permission)),
  );

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-cream md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-line px-6">
        <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-purple">
          Sajawat
          <span className="ml-2 align-middle text-[10px] font-sans font-medium uppercase tracking-widest text-ink-faint">
            Admin
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-purple text-white' : 'text-ink-soft hover:bg-mist hover:text-purple'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
