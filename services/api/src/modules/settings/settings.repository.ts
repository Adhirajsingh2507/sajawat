/**
 * Settings repository (Milestone 1.8). The settings document is a singleton:
 * `getSingleton` upserts it on first access so reads never return null.
 */
import type { HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../db/base-repository.js';
import { Settings } from './settings.model.js';
import type { ISettings } from './settings.types.js';

const SINGLETON_KEY = 'global';

export class SettingsRepository extends BaseRepository<ISettings> {
  constructor() {
    super(Settings);
  }

  /** Fetch (creating on first call) the single global settings document. */
  getSingleton(): Promise<HydratedDocument<ISettings>> {
    return Settings.findOneAndUpdate(
      { key: SINGLETON_KEY },
      { $setOnInsert: { key: SINGLETON_KEY } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    ).exec();
  }

  /** Apply a partial patch to the singleton and return the updated document. */
  patchSingleton(patch: Partial<ISettings>): Promise<HydratedDocument<ISettings>> {
    return Settings.findOneAndUpdate(
      { key: SINGLETON_KEY },
      { $set: patch, $setOnInsert: { key: SINGLETON_KEY } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    ).exec();
  }
}

export const settingsRepository = new SettingsRepository();
