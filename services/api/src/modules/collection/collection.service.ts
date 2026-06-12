/**
 * Collection service (Milestone 1.3a) — business logic + DTO mapping. Public
 * reads scoped to `active`; admin reads see all (soft-deleted excluded).
 */
import type { HydratedDocument } from 'mongoose';
import type { Paginated, PublicCollection } from '@sajawat/types';
import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import type { PaginatedResult } from '../../db/base-repository.js';
import { ensureUniqueSlug, slugify } from '../../utils/slug.js';
import { collectionRepository } from './collection.repository.js';
import type { AdminCollection, ICollection } from './collection.types.js';
import type {
  CreateCollectionBody,
  ListQuery,
  UpdateCollectionBody,
} from './collection.validation.js';

type CollectionDoc = HydratedDocument<ICollection>;

function toPublicCollection(doc: CollectionDoc): PublicCollection {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    bannerImage: doc.bannerImage,
  };
}

function toAdminCollection(doc: CollectionDoc): AdminCollection {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    bannerImage: doc.bannerImage,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function paginated<T>(
  res: PaginatedResult<CollectionDoc>,
  map: (d: CollectionDoc) => T,
): Paginated<T> {
  return {
    items: res.items.map(map),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

const SORT = { name: 1 } as const;

async function listPublic(query: ListQuery): Promise<Paginated<PublicCollection>> {
  const res = await collectionRepository.paginate(
    { status: 'active' },
    { page: query.page, limit: query.limit, sort: SORT },
  );
  return paginated(res, toPublicCollection);
}

async function getBySlugPublic(slug: string): Promise<PublicCollection> {
  const doc = await collectionRepository.findOne({ slug, status: 'active' });
  if (doc === null) {
    throw new NotFoundError('Collection not found');
  }
  return toPublicCollection(doc);
}

async function listAdmin(query: ListQuery): Promise<Paginated<AdminCollection>> {
  const res = await collectionRepository.paginate(
    {},
    { page: query.page, limit: query.limit, sort: SORT },
  );
  return paginated(res, toAdminCollection);
}

async function getByIdAdmin(id: string): Promise<AdminCollection> {
  const doc = await collectionRepository.findById(id);
  if (doc === null) {
    throw new NotFoundError('Collection not found');
  }
  return toAdminCollection(doc);
}

async function create(input: CreateCollectionBody): Promise<AdminCollection> {
  const base = slugify(input.slug ?? input.name);
  const slug = await ensureUniqueSlug(base, (candidate) =>
    collectionRepository.existsBySlug(candidate),
  );
  const doc = await collectionRepository.create({
    name: input.name,
    slug,
    description: input.description,
    bannerImage: input.bannerImage,
    status: input.status ?? 'active',
  });
  return toAdminCollection(doc);
}

async function update(id: string, input: UpdateCollectionBody): Promise<AdminCollection> {
  const patch: Partial<ICollection> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.bannerImage !== undefined) patch.bannerImage = input.bannerImage;
  if (input.status !== undefined) patch.status = input.status;
  if (input.slug !== undefined) {
    const slug = slugify(input.slug);
    const conflict = await collectionRepository.findBySlug(slug, { includeDeleted: true });
    if (conflict !== null && String(conflict._id) !== id) {
      throw new ConflictError('Slug already in use');
    }
    patch.slug = slug;
  }
  const updated = await collectionRepository.updateById(id, { $set: patch });
  if (updated === null) {
    throw new NotFoundError('Collection not found');
  }
  return toAdminCollection(updated);
}

async function remove(id: string): Promise<void> {
  const deleted = await collectionRepository.softDeleteById(id);
  if (deleted === null) {
    throw new NotFoundError('Collection not found');
  }
}

export const collectionService = {
  listPublic,
  getBySlugPublic,
  listAdmin,
  getByIdAdmin,
  create,
  update,
  remove,
};
