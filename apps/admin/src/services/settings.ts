/**
 * Admin settings service (Milestone 1.8b) — wraps /admin/settings
 * (SETTINGS_MANAGE). The singleton always resolves (server upserts it).
 */
import { apiFetch } from '@/lib/api';
import type { AdminSettings } from '@sajawat/types';

export interface SettingsInput {
  businessName?: string;
  supportEmail?: string;
  adminWhatsappNumber?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  addressText?: string;
  businessHours?: string;
}

export function getSettings(): Promise<AdminSettings> {
  return apiFetch<AdminSettings>('/admin/settings');
}

export function updateSettings(input: SettingsInput): Promise<AdminSettings> {
  return apiFetch<AdminSettings>('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
