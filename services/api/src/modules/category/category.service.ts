/**
 * Category service (Milestone 1.3a) — business logic + DTO mapping. Public reads
 * are scoped to `active`; admin reads see all (soft-deleted excluded by the
 * repository). Slugs are derived + uniquified across all rows.
 */
import type { HydratedDocument } from 'mongoose';
import type { Paginated, PublicCategory } from '@sajawat/types';
import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import type { PaginatedResult } from '../../db/base-repository.js';
import { ensureUniqueSlug, slugify } from '../../utils/slug.js';
import { categoryRepository } from './category.repository.js';
import type { AdminCategory, ICategory } from './category.types.js';
import type { CreateCategoryBody, ListQuery, UpdateCategoryBody } from './category.validation.js';

type CategoryDoc = HydratedDocument<ICategory>;

function toPublicCategory(doc: CategoryDoc): PublicCategory {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    image: doc.image,
    sortOrder: doc.sortOrder,
  };
}

function toAdminCategory(doc: CategoryDoc): AdminCategory {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    image: doc.image,
    status: doc.status,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function paginated<T>(res: PaginatedResult<CategoryDoc>, map: (d: CategoryDoc) => T): Paginated<T> {
  return {
    items: res.items.map(map),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

const SORT = { sortOrder: 1, name: 1 } as const;

async function listPublic(query: ListQuery): Promise<Paginated<PublicCategory>> {
  const res = await categoryRepository.paginate(
    { status: 'active' },
    { page: query.page, limit: query.limit, sort: SORT },
  );
  return paginated(res, toPublicCategory);
}

async function getBySlugPublic(slug: string): Promise<PublicCategory> {
  const doc = await categoryRepository.findOne({ slug, status: 'active' });
  if (doc === null) {
    throw new NotFoundError('Category not found');
  }
  return toPublicCategory(doc);
}

async function listAdmin(query: ListQuery): Promise<Paginated<AdminCategory>> {
  const res = await categoryRepository.paginate(
    {},
    { page: query.page, limit: query.limit, sort: SORT },
  );
  return paginated(res, toAdminCategory);
}

async function getByIdAdmin(id: string): Promise<AdminCategory> {
  const doc = await categoryRepository.findById(id);
  if (doc === null) {
    throw new NotFoundError('Category not found');
  }
  return toAdminCategory(doc);
}

async function create(input: CreateCategoryBody): Promise<AdminCategory> {
  const base = slugify(input.slug ?? input.name);
  const slug = await ensureUniqueSlug(base, (candidate) =>
    categoryRepository.existsBySlug(candidate),
  );
  const doc = await categoryRepository.create({
    name: input.name,
    slug,
    description: input.description,
    image: input.image,
    status: input.status ?? 'active',
    sortOrder: input.sortOrder ?? 0,
  });
  return toAdminCategory(doc);
}

async function update(id: string, input: UpdateCategoryBody): Promise<AdminCategory> {
  const patch: Partial<ICategory> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.image !== undefined) patch.image = input.image;
  if (input.status !== undefined) patch.status = input.status;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.slug !== undefined) {
    const slug = slugify(input.slug);
    const conflict = await categoryRepository.findBySlug(slug, { includeDeleted: true });
    if (conflict !== null && String(conflict._id) !== id) {
      throw new ConflictError('Slug already in use');
    }
    patch.slug = slug;
  }
  const updated = await categoryRepository.updateById(id, { $set: patch });
  if (updated === null) {
    throw new NotFoundError('Category not found');
  }
  return toAdminCategory(updated);
}

async function remove(id: string): Promise<void> {
  const deleted = await categoryRepository.softDeleteById(id);
  if (deleted === null) {
    throw new NotFoundError('Category not found');
  }
}

export const categoryService = {
  listPublic,
  getBySlugPublic,
  listAdmin,
  getByIdAdmin,
  create,
  update,
  remove,
};
