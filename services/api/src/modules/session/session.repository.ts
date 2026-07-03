/**
 * Session repository (Milestone 1.2) — `BaseRepository` for the refresh store.
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import type { ReadOptions } from '../../db/base-repository.js';
import { Session } from './session.model.js';
import type { ISession } from './session.types.js';

export class SessionRepository extends BaseRepository<ISession> {
  constructor() {
    super(Session);
  }

  findByJti(jti: string, opts: ReadOptions = {}): Promise<HydratedDocument<ISession> | null> {
    return this.findOne({ jti }, opts);
  }

  /** Revoke every still-active token in a family (theft response). */
  revokeFamily(family: string): Promise<number> {
    return this.updateMany({ family, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }
}

export const sessionRepository = new SessionRepository();
