/**
 * Collection repository (Milestone 1.3a).
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import type { ReadOptions } from '../../db/base-repository.js';
import { Collection } from './collection.model.js';
import type { ICollection } from './collection.types.js';

export class CollectionRepository extends BaseRepository<ICollection> {
  constructor() {
    super(Collection);
  }

  findBySlug(slug: string, opts: ReadOptions = {}): Promise<HydratedDocument<ICollection> | null> {
    return this.findOne({ slug }, opts);
  }

  /** Slug uniqueness check spanning ALL rows (the unique index includes soft-deleted). */
  existsBySlug(slug: string): Promise<boolean> {
    return this.exists({ slug }, { includeDeleted: true });
  }
}

export const collectionRepository = new CollectionRepository();
