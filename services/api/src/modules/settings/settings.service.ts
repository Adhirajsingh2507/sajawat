/**
 * Settings service (Milestone 1.8) — read/update the business-settings singleton
 * and expose the admin WhatsApp number to the notification layer.
 */
import type { HydratedDocument } from 'mongoose';
import type { AdminSettings, PublicSettings } from '@sajawat/types';
import { settingsRepository } from './settings.repository.js';
import type { ISettings } from './settings.types.js';
import type { UpdateSettingsBody } from './settings.validation.js';

type SettingsDoc = HydratedDocument<ISettings>;

function toDto(doc: SettingsDoc): AdminSettings {
  return {
    businessName: doc.businessName,
    supportEmail: doc.supportEmail,
    adminWhatsappNumber: doc.adminWhatsappNumber ?? null,
    instagramUrl: doc.instagramUrl,
    facebookUrl: doc.facebookUrl,
    youtubeUrl: doc.youtubeUrl,
    addressText: doc.addressText,
    businessHours: doc.businessHours,
    updatedAt: doc.updatedAt,
  };
}

/** Public projection — display fields only, never the raw alert target/secrets. */
function toPublicDto(doc: SettingsDoc): PublicSettings {
  return {
    businessName: doc.businessName,
    supportEmail: doc.supportEmail,
    whatsappNumber: doc.adminWhatsappNumber ?? undefined,
    instagramUrl: doc.instagramUrl,
    facebookUrl: doc.facebookUrl,
    youtubeUrl: doc.youtubeUrl,
    addressText: doc.addressText,
    businessHours: doc.businessHours,
  };
}

async function getSettings(): Promise<AdminSettings> {
  return toDto(await settingsRepository.getSingleton());
}

async function getPublicSettings(): Promise<PublicSettings> {
  return toPublicDto(await settingsRepository.getSingleton());
}

async function updateSettings(input: UpdateSettingsBody): Promise<AdminSettings> {
  const patch: Partial<ISettings> = {};
  if (input.businessName !== undefined) patch.businessName = input.businessName;
  if (input.supportEmail !== undefined) patch.supportEmail = input.supportEmail;
  if (input.adminWhatsappNumber !== undefined) {
    patch.adminWhatsappNumber = input.adminWhatsappNumber === '' ? null : input.adminWhatsappNumber;
  }
  if (input.instagramUrl !== undefined) patch.instagramUrl = input.instagramUrl || undefined;
  if (input.facebookUrl !== undefined) patch.facebookUrl = input.facebookUrl || undefined;
  if (input.youtubeUrl !== undefined) patch.youtubeUrl = input.youtubeUrl || undefined;
  if (input.addressText !== undefined) patch.addressText = input.addressText;
  if (input.businessHours !== undefined) patch.businessHours = input.businessHours;
  return toDto(await settingsRepository.patchSingleton(patch));
}

/** The configured lead-alert recipient, or null when unset. */
async function getAdminWhatsappNumber(): Promise<string | null> {
  const doc = await settingsRepository.getSingleton();
  return doc.adminWhatsappNumber ?? null;
}

export const settingsService = {
  getSettings,
  getPublicSettings,
  updateSettings,
  getAdminWhatsappNumber,
};
