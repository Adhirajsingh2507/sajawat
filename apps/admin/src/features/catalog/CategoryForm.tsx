'use client';

/**
 * Category create/edit form (Milestone 1.7b). Image is a URL reference (GCS
 * upload lands in 1.3-media). The server validates + uniquifies the slug.
 */
import { useState } from 'react';
import { Button, Input, Label } from '@sajawat/ui';
import type { AdminCategory, CategoryStatus } from '@sajawat/types';
import { ApiError } from '@/lib/api';
import type { CategoryWriteInput } from '@/services/categories';

export function CategoryForm({
  initial,
  onSubmit,
  onDone,
  onCancel,
}: {
  initial?: AdminCategory | undefined;
  onSubmit: (input: CategoryWriteInput) => Promise<AdminCategory>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [status, setStatus] = useState<CategoryStatus>(initial?.status ?? 'active');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload: CategoryWriteInput = {
      name: name.trim(),
      status,
      sortOrder: Number(sortOrder) || 0,
    };
    if (slug.trim().length > 0) payload.slug = slug.trim();
    if (description.trim().length > 0) payload.description = description.trim();
    if (image.trim().length > 0) payload.image = image.trim();
    void onSubmit(payload)
      .then(onDone)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not save the category.');
        setBusy(false);
      });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-cream p-5">
      <h2 className="font-serif text-lg font-semibold text-ink">
        {initial !== undefined ? 'Edit category' : 'New category'}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cat-name">Name</Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="cat-slug">Slug (optional)</Label>
          <Input
            id="cat-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
            }}
            placeholder="auto-generated"
          />
        </div>
        <div>
          <Label htmlFor="cat-status">Status</Label>
          <select
            id="cat-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as CategoryStatus);
            }}
            className="h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
        <div>
          <Label htmlFor="cat-sort">Sort order</Label>
          <Input
            id="cat-sort"
            type="number"
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cat-image">Image URL (optional)</Label>
          <Input
            id="cat-image"
            value={image}
            onChange={(e) => {
              setImage(e.target.value);
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cat-desc">Description (optional)</Label>
          <Input
            id="cat-desc"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
          />
        </div>
      </div>
      {error !== null && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-ink-soft hover:text-purple"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
