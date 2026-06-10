/**
 * User repository (Milestone 1.1) — `BaseRepository` specialized for `User`,
 * plus the email finders auth (Phase 1.2) will build on.
 */
import type { HydratedDocument, Model } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import type { ReadOptions } from '../../db/base-repository.js';
import { User } from './user.model.js';
import type { IUser } from './user.types.js';

/** The driver's filter parameter type, recovered from the model's own method. */
type UserFilter = NonNullable<Parameters<Model<IUser>['findOne']>[0]>;

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /** Find by (normalized) email. `passwordHash` is NOT included. */
  findByEmail(email: string, opts: ReadOptions = {}): Promise<HydratedDocument<IUser> | null> {
    return this.findOne({ email: normalizeEmail(email) }, opts);
  }

  /**
   * Find by email WITH the normally-excluded `passwordHash` selected — for
   * credential verification at login (Phase 1.2). Soft-delete scoped.
   */
  findByEmailWithPassword(email: string): Promise<HydratedDocument<IUser> | null> {
    const filter = this.scoped({ email: normalizeEmail(email) }) as unknown as UserFilter;
    return this.model.findOne(filter).select('+passwordHash').exec();
  }
}

/** Shared singleton (stateless; safe to reuse across requests). */
export const userRepository = new UserRepository();
