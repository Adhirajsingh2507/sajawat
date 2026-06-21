import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/features/auth/auth-context';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Sajawat Jewellery', template: '%s · Sajawat Jewellery' },
  description:
    'Premium imitation jewellery — necklaces, earrings, bridal sets, and festive collections.',
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Read the per-request CSP nonce (set by proxy.ts). Touching headers() opts the
  // app into dynamic rendering so Next stamps the nonce onto its scripts — without
  // this, statically prerendered pages would ship un-nonced scripts and the strict
  // CSP (strict-dynamic) would block them. The storefront is login-gated (D17) with
  // SEO dropped, so giving up static generation costs nothing here.
  await headers();
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
