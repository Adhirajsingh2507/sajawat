import type { ReactNode } from 'react';

/** Centered shell for the public auth pages (login / register). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
