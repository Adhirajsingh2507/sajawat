/**
 * Settings service (Milestone 1.8) — read/update the business-settings singleton
 * and expose the admin WhatsApp number to the notification layer.
 */
import type { HydratedDocument } from 'mongoose';
import type { AdminSettings } from '@sajawat/types';
import { settingsRepository } from './settings.repository.js';
import type { ISettings } from './settings.types.js';
import type { UpdateSettingsBody } from './settings.validation.js';

type SettingsDoc = HydratedDocument<ISettings>;

function toDto(doc: SettingsDoc): AdminSettings {
  return {
    businessName: doc.businessName,
    supportEmail: doc.supportEmail,
    adminWhatsappNumber: doc.adminWhatsappNumber ?? null,
    updatedAt: doc.updatedAt,
  };
}

async function getSettings(): Promise<AdminSettings> {
  return toDto(await settingsRepository.getSingleton());
}

async function updateSettings(input: UpdateSettingsBody): Promise<AdminSettings> {
  const patch: Partial<ISettings> = {};
  if (input.businessName !== undefined) patch.businessName = input.businessName;
  if (input.supportEmail !== undefined) patch.supportEmail = input.supportEmail;
  if (input.adminWhatsappNumber !== undefined) {
    patch.adminWhatsappNumber = input.adminWhatsappNumber === '' ? null : input.adminWhatsappNumber;
  }
  return toDto(await settingsRepository.patchSingleton(patch));
}

/** The configured lead-alert recipient, or null when unset. */
async function getAdminWhatsappNumber(): Promise<string | null> {
  const doc = await settingsRepository.getSingleton();
  return doc.adminWhatsappNumber ?? null;
}

export const settingsService = {
  getSettings,
  updateSettings,
  getAdminWhatsappNumber,
};
