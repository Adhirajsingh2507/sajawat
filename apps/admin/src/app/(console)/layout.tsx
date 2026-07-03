'use client';

/**
 * Console gate (Milestone 1.7) — the whole admin requires a STAFF session. While
 * the silent refresh resolves we show a splash; unauthenticated users go to
 * /login; an authenticated non-staff user (a plain customer) gets an explicit
 * 403 rather than the console. The API independently enforces every action.
 */
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { Sidebar } from '@/features/console/Sidebar';
import { Topbar } from '@/features/console/Topbar';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const { status, isStaff, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <span className="font-serif text-lg text-ink-faint">Sajawat Admin</span>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-32 text-center">
        <h1 className="font-serif text-2xl font-semibold text-ink">Access restricted</h1>
        <p className="max-w-sm text-sm text-ink-soft">
          This account doesn&apos;t have permission to use the operations console.
        </p>
        <button
          type="button"
          onClick={() => {
            void (async () => {
              await logout();
              router.replace('/login');
            })();
          }}
          className="text-sm font-medium text-purple hover:underline"
        >
          Sign in with a different account
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
