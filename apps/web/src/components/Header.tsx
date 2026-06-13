'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';

/** Sticky storefront header. Full catalogue nav arrives with 1.4b pages. */
export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function onLogout() {
    void (async () => {
      await logout();
      router.replace('/login');
    })();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-purple">
          Sajawat
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user !== null && (
            <span className="hidden text-ink-soft sm:inline">Hi, {user.firstName}</span>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="font-medium text-purple hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
