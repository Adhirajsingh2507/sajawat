'use client';

/**
 * Console topbar (Milestone 1.7) — current user + role + sign-out. Mobile nav is
 * intentionally minimal for 1.7 (console is desktop-first ops tooling).
 */
import { useRouter } from 'next/navigation';
import { titleCase } from '@/lib/format';
import { useAuth } from '@/features/auth/auth-context';

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function onLogout() {
    void (async () => {
      await logout();
      router.replace('/login');
    })();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-cream/90 px-5 backdrop-blur sm:px-8">
      <div className="ml-auto flex items-center gap-4">
        {user !== null && (
          <div className="text-right">
            <p className="text-sm font-medium text-ink">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-ink-faint">{titleCase(user.role.replace(/_/g, ' '))}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="text-sm font-medium text-purple hover:underline"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
