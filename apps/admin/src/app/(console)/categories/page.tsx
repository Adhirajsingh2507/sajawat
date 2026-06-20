'use client';

/**
 * Categories admin (Milestone 1.7b) — list with an inline create/edit panel and
 * delete. CATEGORY_WRITE gates the whole module (the API enforces it too). A
 * successful save bumps a reload token so the list stays server-authoritative.
 */
import { useState } from 'react';
import type { AdminCategory } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/services/categories';
import { ApiError } from '@/lib/api';
import { PageHeader, Pagination, EmptyState } from '@/features/console/ui';
import { ActiveBadge } from '@/features/console/badges';
import { CategoryForm } from '@/features/catalog/CategoryForm';

type Panel = { mode: 'new' } | { mode: 'edit'; category: AdminCategory } | null;

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const { data, loading, error } = useAsync(
    () => listCategories({ page, limit: 50 }),
    [page, reload],
  );

  function refresh() {
    setPanel(null);
    setReload((n) => n + 1);
  }

  function onDelete(id: string) {
    if (!window.confirm('Delete this category? Products may reference it.')) return;
    setRowError(null);
    void deleteCategory(id)
      .then(() => {
        setReload((n) => n + 1);
      })
      .catch((err: unknown) => {
        setRowError(err instanceof ApiError ? err.message : 'Could not delete the category.');
      });
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organise the catalog."
        action={
          panel === null ? (
            <button
              type="button"
              onClick={() => {
                setPanel({ mode: 'new' });
              }}
              className="inline-flex h-10 items-center rounded-full bg-purple px-5 text-sm font-medium text-white hover:bg-purple-dark"
            >
              New category
            </button>
          ) : undefined
        }
      />

      {panel !== null && (
        <div className="mb-6">
          <CategoryForm
            initial={panel.mode === 'edit' ? panel.category : undefined}
            onSubmit={
              panel.mode === 'edit'
                ? (input) => updateCategory(panel.category.id, input)
                : createCategory
            }
            onDone={refresh}
            onCancel={() => {
              setPanel(null);
            }}
          />
        </div>
      )}

      {rowError !== null && <p className="mb-4 text-sm text-red-600">{rowError}</p>}
      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      {loading && data === null && <p className="text-sm text-ink-soft">Loading categories…</p>}

      {data !== null && data.items.length === 0 && <EmptyState message="No categories yet." />}

      {data !== null && data.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Sort</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-line/60 last:border-0 hover:bg-mist/40">
                  <td className="px-5 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{c.slug}</td>
                  <td className="px-5 py-3">
                    <ActiveBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3 text-right text-ink-soft">{c.sortOrder}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setPanel({ mode: 'edit', category: c });
                      }}
                      className="text-sm font-medium text-purple hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(c.id);
                      }}
                      className="ml-4 text-sm text-ink-soft hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data !== null && (
        <Pagination
          page={data.page}
          pages={data.pages}
          busy={loading}
          onPage={(n) => {
            setPage(n);
          }}
        />
      )}
    </div>
  );
}
