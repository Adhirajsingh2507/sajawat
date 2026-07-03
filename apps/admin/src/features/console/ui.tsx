/**
 * Console UI primitives (Milestone 1.7) — small layout helpers shared across the
 * module pages so they stay consistent and lean.
 */
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">{title}</h1>
        {description !== undefined && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-cream p-5 ${className ?? ''}`}>
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-cream/50 px-6 py-16 text-center text-sm text-ink-soft">
      {message}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  busy,
  onPage,
}: {
  page: number;
  pages: number;
  busy: boolean;
  onPage: (next: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => {
          onPage(Math.max(1, page - 1));
        }}
        disabled={page <= 1 || busy}
        className="h-9 rounded-full border border-line px-4 text-sm text-ink-soft hover:border-purple disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-ink-soft">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        onClick={() => {
          onPage(Math.min(pages, page + 1));
        }}
        disabled={page >= pages || busy}
        className="h-9 rounded-full border border-line px-4 text-sm text-ink-soft hover:border-purple disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
