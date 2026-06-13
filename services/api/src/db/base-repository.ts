/**
 * Generic data-access layer (Milestone 1.1, AD-6).
 *
 * `BaseRepository<TDoc>` wraps a Mongoose model with the house CRUD surface every
 * domain repository inherits, so services never touch the model directly and
 * cross-cutting concerns (soft-delete scoping, pagination, validated updates)
 * live in one place. Concrete repositories (e.g. `UserRepository`) extend this
 * and add entity-specific finders.
 *
 * Soft-delete: opt-in per collection (a `deletedAt` schema path). When present,
 * every read/update is automatically scoped to non-deleted documents unless
 * `includeDeleted` is passed — so deleted rows stay queryable for audit but are
 * invisible to normal flows (matches the convention in `db/base-plugin.ts`).
 *
 * Note: Mongoose 9 stopped exporting its filter type by name, so the public
 * surface takes a structural `DocFilter` and adapts it to the driver's filter
 * overload via `asFilter` at the single call boundary.
 */
import type { HydratedDocument, Model, Schema, UpdateQuery } from 'mongoose';

/** A plain MongoDB query filter object (e.g. `{ email: 'a@b.com', deletedAt: null }`). */
export type DocFilter = Record<string, unknown>;

/** The driver's filter parameter type, recovered from the model's own method. */
type ModelFilter<TDoc> = NonNullable<Parameters<Model<TDoc>['find']>[0]>;

export interface ReadOptions {
  /** Bypass the soft-delete guard and include `deletedAt`-marked documents. */
  includeDeleted?: boolean;
}

export interface PaginateOptions extends ReadOptions {
  /** 1-based page number (clamped to >= 1). */
  page?: number | undefined;
  /** Page size (clamped to 1..100). */
  limit?: number | undefined;
  /** Sort spec, e.g. `{ createdAt: -1 }`. Defaults to newest-first. */
  sort?: Record<string, 1 | -1> | undefined;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export class BaseRepository<TDoc> {
  protected readonly model: Model<TDoc>;
  private readonly softDeletes: boolean;

  constructor(model: Model<TDoc>) {
    this.model = model;
    const schema = model.schema as Schema<TDoc>;
    this.softDeletes = 'deletedAt' in schema.paths;
  }

  /**
   * Merge the soft-delete guard into a filter. No-op when the collection has no
   * `deletedAt` path or the caller explicitly opts into deleted documents.
   */
  protected scoped(filter: DocFilter = {}, includeDeleted = false): DocFilter {
    if (!this.softDeletes || includeDeleted) {
      return filter;
    }
    return { ...filter, deletedAt: null };
  }

  /** Adapt a structural filter to the driver's filter parameter type. */
  private asFilter(filter: DocFilter): ModelFilter<TDoc> {
    return filter as unknown as ModelFilter<TDoc>;
  }

  create(data: Partial<TDoc>): Promise<HydratedDocument<TDoc>> {
    return this.model.create(data);
  }

  findById(id: string, opts: ReadOptions = {}): Promise<HydratedDocument<TDoc> | null> {
    return this.model.findOne(this.asFilter(this.scoped({ _id: id }, opts.includeDeleted))).exec();
  }

  findOne(filter: DocFilter, opts: ReadOptions = {}): Promise<HydratedDocument<TDoc> | null> {
    return this.model.findOne(this.asFilter(this.scoped(filter, opts.includeDeleted))).exec();
  }

  count(filter: DocFilter = {}, opts: ReadOptions = {}): Promise<number> {
    return this.model
      .countDocuments(this.asFilter(this.scoped(filter, opts.includeDeleted)))
      .exec();
  }

  async exists(filter: DocFilter, opts: ReadOptions = {}): Promise<boolean> {
    const hit = await this.model
      .exists(this.asFilter(this.scoped(filter, opts.includeDeleted)))
      .exec();
    return hit !== null;
  }

  /** Find all documents matching a filter (soft-delete scoped). No pagination. */
  find(filter: DocFilter = {}, opts: ReadOptions = {}): Promise<HydratedDocument<TDoc>[]> {
    return this.model.find(this.asFilter(this.scoped(filter, opts.includeDeleted))).exec();
  }

  async paginate(
    filter: DocFilter = {},
    opts: PaginateOptions = {},
  ): Promise<PaginatedResult<HydratedDocument<TDoc>>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, opts.limit ?? DEFAULT_PAGE_SIZE));
    const scoped = this.asFilter(this.scoped(filter, opts.includeDeleted));
    const [items, total] = await Promise.all([
      this.model
        .find(scoped)
        .sort(opts.sort ?? { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(scoped).exec(),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * Bulk update by filter (UNSCOPED — the caller's filter is authoritative).
   * Returns the number of modified documents. Use for administrative/bulk ops
   * like revoking a token family.
   */
  async updateMany(filter: DocFilter, update: UpdateQuery<TDoc>): Promise<number> {
    const res = await this.model.updateMany(this.asFilter(filter), update).exec();
    return res.modifiedCount;
  }

  /** Update by id with validators run; returns the updated document (scoped). */
  updateById(
    id: string,
    update: UpdateQuery<TDoc>,
    opts: ReadOptions = {},
  ): Promise<HydratedDocument<TDoc> | null> {
    return this.model
      .findOneAndUpdate(this.asFilter(this.scoped({ _id: id }, opts.includeDeleted)), update, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
  }

  /**
   * Mark a document deleted (sets `deletedAt`). Throws if the collection did not
   * opt into soft-delete — callers must not silently hard-delete auditable data.
   */
  softDeleteById(id: string): Promise<HydratedDocument<TDoc> | null> {
    if (!this.softDeletes) {
      throw new Error(`${this.model.modelName} has no deletedAt path; soft-delete is unsupported`);
    }
    return this.model
      .findOneAndUpdate(
        this.asFilter(this.scoped({ _id: id })),
        { $set: { deletedAt: new Date() } },
        { returnDocument: 'after' },
      )
      .exec();
  }
}
