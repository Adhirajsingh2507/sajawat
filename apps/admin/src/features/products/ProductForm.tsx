'use client';

/**
 * Product create/edit form (Milestone 1.7a). Media are URL references (GCS
 * upload lands in 1.3-media), so images are entered as URL + alt rows. `quantity`
 * seeds initial inventory and is shown only on create (stock is adjusted from the
 * Inventory module afterwards). The server validates everything; we surface its
 * errors and never compute anything authoritative client-side.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@sajawat/ui';
import type { AdminProduct, ProductImage, ProductStatus, PublicCategory } from '@sajawat/types';
import { ApiError } from '@/lib/api';
import type { ProductWriteInput } from '@/services/products';

const STATUSES: ProductStatus[] = ['draft', 'active', 'archived'];

interface ImageRow {
  url: string;
  alt: string;
}

export function ProductForm({
  mode,
  categories,
  initial,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  categories: PublicCategory[];
  initial?: AdminProduct;
  onSubmit: (input: ProductWriteInput) => Promise<AdminProduct>;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [barcode, setBarcode] = useState(initial?.barcode ?? '');
  const [price, setPrice] = useState(initial?.price !== undefined ? String(initial.price) : '');
  const [salePrice, setSalePrice] = useState(
    initial?.salePrice !== undefined ? String(initial.salePrice) : '',
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [status, setStatus] = useState<ProductStatus>(initial?.status ?? 'draft');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isBestSeller, setIsBestSeller] = useState(initial?.isBestSeller ?? false);
  const [quantity, setQuantity] = useState('0');
  const [images, setImages] = useState<ImageRow[]>(
    initial?.images.map((i) => ({ url: i.url, alt: i.alt ?? '' })) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function buildPayload(): ProductWriteInput {
    const cleanImages: ProductImage[] = images
      .filter((row) => row.url.trim().length > 0)
      .map((row, index) => ({
        url: row.url.trim(),
        position: index,
        ...(row.alt.trim().length > 0 ? { alt: row.alt.trim() } : {}),
      }));

    const payload: ProductWriteInput = {
      name: name.trim(),
      sku: sku.trim(),
      price: Number(price),
      categoryId,
      status,
      isFeatured,
      isBestSeller,
      images: cleanImages,
    };
    if (barcode.trim().length > 0) payload.barcode = barcode.trim();
    if (slug.trim().length > 0) payload.slug = slug.trim();
    if (salePrice.trim().length > 0) payload.salePrice = Number(salePrice);
    if (shortDescription.trim().length > 0) payload.shortDescription = shortDescription.trim();
    if (description.trim().length > 0) payload.description = description.trim();
    if (mode === 'create') payload.quantity = Number(quantity) || 0;
    return payload;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    void onSubmit(buildPayload())
      .then((saved) => {
        router.replace(`/products/${saved.id}`);
        router.refresh();
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not save the product.');
        setSubmitting(false);
      });
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={sku}
            onChange={(e) => {
              setSku(e.target.value);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="barcode">Barcode (optional)</Label>
          <Input
            id="barcode"
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value);
            }}
            placeholder="Scan or type the product barcode"
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
            }}
            placeholder="auto-generated from name"
          />
        </div>
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="salePrice">Sale price (₹, optional)</Label>
          <Input
            id="salePrice"
            type="number"
            min="0"
            value={salePrice}
            onChange={(e) => {
              setSalePrice(e.target.value);
            }}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
            }}
            required
            className="h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
          >
            {categories.length === 0 && <option value="">No categories — create one first</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ProductStatus);
            }}
            className="h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm focus:border-purple focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {mode === 'create' && (
          <div>
            <Label htmlFor="quantity">Initial stock</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
              }}
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="shortDescription">Short description</Label>
        <Input
          id="shortDescription"
          value={shortDescription}
          onChange={(e) => {
            setShortDescription(e.target.value);
          }}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          rows={4}
          className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm focus:border-purple focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="mb-0">Images (URLs)</Label>
          <button
            type="button"
            onClick={() => {
              setImages((rows) => [...rows, { url: '', alt: '' }]);
            }}
            className="text-sm font-medium text-purple hover:underline"
          >
            + Add image
          </button>
        </div>
        <div className="space-y-2">
          {images.length === 0 && <p className="text-xs text-ink-faint">No images added.</p>}
          {images.map((row, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={row.url}
                onChange={(e) => {
                  setImages((rows) =>
                    rows.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)),
                  );
                }}
                placeholder="https://…/image.jpg"
              />
              <Input
                value={row.alt}
                onChange={(e) => {
                  setImages((rows) =>
                    rows.map((r, j) => (j === i ? { ...r, alt: e.target.value } : r)),
                  );
                }}
                placeholder="alt text"
                className="w-40"
              />
              <button
                type="button"
                onClick={() => {
                  setImages((rows) => rows.filter((_, j) => j !== i));
                }}
                aria-label="Remove image"
                className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => {
              setIsFeatured(e.target.checked);
            }}
            className="accent-purple"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={isBestSeller}
            onChange={(e) => {
              setIsBestSeller(e.target.checked);
            }}
            className="accent-purple"
          />
          Best seller
        </label>
      </div>

      {error !== null && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}
        </Button>
        <button
          type="button"
          onClick={() => {
            router.back();
          }}
          className="text-sm font-medium text-ink-soft hover:text-purple"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
