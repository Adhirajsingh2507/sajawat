/**
 * Category repository (Milestone 1.3a).
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import type { ReadOptions } from '../../db/base-repository.js';
import { Category } from './category.model.js';
import type { ICategory } from './category.types.js';

export class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(Category);
  }

  findBySlug(slug: string, opts: ReadOptions = {}): Promise<HydratedDocument<ICategory> | null> {
    return this.findOne({ slug }, opts);
  }

  /** Slug uniqueness check spanning ALL rows (the unique index includes soft-deleted). */
  existsBySlug(slug: string): Promise<boolean> {
    return this.exists({ slug }, { includeDeleted: true });
  }
}

export const categoryRepository = new CategoryRepository();
