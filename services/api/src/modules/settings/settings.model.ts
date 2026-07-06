/**
 * Settings model (Milestone 1.8) — a singleton document (`key: 'global'`,
 * unique). baseSchemaPlugin gives timestamps + the id transform. No soft-delete.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { ISettings } from './settings.types.js';

const { Schema } = mongoose;

const settingsSchema = new Schema<ISettings>({
  key: { type: String, required: true, default: 'global', unique: true },
  businessName: { type: String, trim: true, maxlength: 200 },
  supportEmail: { type: String, trim: true, lowercase: true, maxlength: 200 },
  adminWhatsappNumber: { type: String, trim: true, default: null, maxlength: 20 },
  instagramUrl: { type: String, trim: true, maxlength: 300 },
  facebookUrl: { type: String, trim: true, maxlength: 300 },
  youtubeUrl: { type: String, trim: true, maxlength: 300 },
  addressText: { type: String, trim: true, maxlength: 500 },
  businessHours: { type: String, trim: true, maxlength: 200 },
});

settingsSchema.plugin(baseSchemaPlugin);

export const Settings: Model<ISettings> =
  (mongoose.models.Settings as Model<ISettings> | undefined) ??
  mongoose.model<ISettings>('Settings', settingsSchema);
