'use client';

/**
 * Collection create/edit form (Milestone 1.7b). Banner image is a URL reference
 * (GCS upload lands in 1.3-media). The server validates + uniquifies the slug.
 */
import { useState } from 'react';
import { Button, Input, Label } from '@sajawat/ui';
import type { AdminCollection, CollectionStatus } from '@sajawat/types';
import { ApiError } from '@/lib/api';
import type { CollectionWriteInput } from '@/services/collections';

export function CollectionForm({
  initial,
  onSubmit,
  onDone,
  onCancel,
}: {
  initial?: AdminCollection | undefined;
  onSubmit: (input: CollectionWriteInput) => Promise<AdminCollection>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [bannerImage, setBannerImage] = useState(initial?.bannerImage ?? '');
  const [status, setStatus] = useState<CollectionStatus>(initial?.status ?? 'active');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload: CollectionWriteInput = { name: name.trim(), status };
    if (slug.trim().length > 0) payload.slug = slug.trim();
    if (description.trim().length > 0) payload.description = description.trim();
    if (bannerImage.trim().length > 0) payload.bannerImage = bannerImage.trim();
    void onSubmit(payload)
      .then(onDone)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not save the collection.');
        setBusy(false);
      });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-cream p-5">
      <h2 className="font-serif text-lg font-semibold text-ink">
        {initial !== undefined ? 'Edit collection' : 'New collection'}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="col-name">Name</Label>
          <Input
            id="col-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="col-slug">Slug (optional)</Label>
          <Input
            id="col-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
            }}
            placeholder="auto-generated"
          />
        </div>
        <div>
          <Label htmlFor="col-status">Status</Label>
          <select
            id="col-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as CollectionStatus);
            }}
            className="h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="col-banner">Banner image URL (optional)</Label>
          <Input
            id="col-banner"
            value={bannerImage}
            onChange={(e) => {
              setBannerImage(e.target.value);
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="col-desc">Description (optional)</Label>
          <Input
            id="col-desc"
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
