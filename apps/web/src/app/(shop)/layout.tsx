'use client';

/**
 * Storefront gate (Milestone 1.4a) — the whole shop requires a session. While
 * the silent refresh resolves we show a splash; unauthenticated users are sent
 * to /login; authenticated users get the header/footer shell.
 */
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { CommerceProvider } from '@/features/commerce/commerce-context';
import { QuickViewProvider } from '@/features/quickview/quickview-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { CartDrawer } from '@/features/commerce/CartDrawer';
import { QuickViewModal } from '@/features/quickview/QuickViewModal';

export default function ShopLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <span className="font-serif text-lg text-ink-faint">Sajawat</span>
      </div>
    );
  }

  return (
    <CommerceProvider>
      <QuickViewProvider>
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <QuickViewModal />
      </QuickViewProvider>
    </CommerceProvider>
  );
}
