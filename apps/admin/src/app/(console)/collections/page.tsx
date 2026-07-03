'use client';

/**
 * Collections admin (Milestone 1.7b) — list with an inline create/edit panel and
 * delete. COLLECTION_WRITE gates the module (the API enforces it too).
 */
import { useState } from 'react';
import type { AdminCollection } from '@sajawat/types';
import { useAsync } from '@/lib/use-async';
import {
  createCollection,
  deleteCollection,
  listCollections,
  updateCollection,
} from '@/services/collections';
import { ApiError } from '@/lib/api';
import { PageHeader, Pagination, EmptyState } from '@/features/console/ui';
import { ActiveBadge } from '@/features/console/badges';
import { CollectionForm } from '@/features/catalog/CollectionForm';

type Panel = { mode: 'new' } | { mode: 'edit'; collection: AdminCollection } | null;

export default function CollectionsPage() {
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const { data, loading, error } = useAsync(
    () => listCollections({ page, limit: 50 }),
    [page, reload],
  );

  function refresh() {
    setPanel(null);
    setReload((n) => n + 1);
  }

  function onDelete(id: string) {
    if (!window.confirm('Delete this collection?')) return;
    setRowError(null);
    void deleteCollection(id)
      .then(() => {
        setReload((n) => n + 1);
      })
      .catch((err: unknown) => {
        setRowError(err instanceof ApiError ? err.message : 'Could not delete the collection.');
      });
  }

  return (
    <div>
      <PageHeader
        title="Collections"
        description="Curated groupings of products."
        action={
          panel === null ? (
            <button
              type="button"
              onClick={() => {
                setPanel({ mode: 'new' });
              }}
              className="inline-flex h-10 items-center rounded-full bg-purple px-5 text-sm font-medium text-white hover:bg-purple-dark"
            >
              New collection
            </button>
          ) : undefined
        }
      />

      {panel !== null && (
        <div className="mb-6">
          <CollectionForm
            initial={panel.mode === 'edit' ? panel.collection : undefined}
            onSubmit={
              panel.mode === 'edit'
                ? (input) => updateCollection(panel.collection.id, input)
                : createCollection
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
      {loading && data === null && <p className="text-sm text-ink-soft">Loading collections…</p>}

      {data !== null && data.items.length === 0 && <EmptyState message="No collections yet." />}

      {data !== null && data.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Status</th>
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
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setPanel({ mode: 'edit', collection: c });
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
