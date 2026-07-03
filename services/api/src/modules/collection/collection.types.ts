/**
 * Collection domain types (Milestone 1.3a). Marketing groupings (Wedding,
 * Festive, …). `bannerImage` is a URL/key reference (GCS upload deferred).
 */
export type CollectionStatus = 'active' | 'inactive';

export interface ICollection {
  name: string;
  slug: string;
  description?: string | undefined;
  bannerImage?: string | undefined;
  status: CollectionStatus;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Admin-facing view (includes status + timestamps; never exposes deletedAt). */
export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description?: string | undefined;
  bannerImage?: string | undefined;
  status: CollectionStatus;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
