import type { ReactNode } from 'react';

/** Centered card shell for the staff sign-in page. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-cream p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
