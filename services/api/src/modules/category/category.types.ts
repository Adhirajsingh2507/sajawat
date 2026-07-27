/**
 * Category domain types (Milestone 1.3a). Product grouping — single-company
 * (no vendor ownership). `image` is a URL/key reference; the binary upload
 * pipeline (GCS) is deferred to 1.3-media.
 */
import type mongoose from 'mongoose';

export type CategoryStatus = 'active' | 'inactive';

export interface ICategory {
  name: string;
  slug: string;
  description?: string | undefined;
  image?: string | undefined;
  status: CategoryStatus;
  sortOrder: number;
  /** Parent category ref for one-level nesting; null/absent = top-level. */
  parentId?: mongoose.Types.ObjectId | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Admin-facing view (includes status + timestamps; never exposes deletedAt). */
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | undefined;
  image?: string | undefined;
  status: CategoryStatus;
  sortOrder: number;
  parentId?: string | null;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
