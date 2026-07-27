/**
 * Profile service — self-service account updates via PATCH /auth/me. Returns the
 * refreshed PublicUser so the auth context can update in place. Only name, phone,
 * and address are editable (role/status/email are server-controlled).
 */
import { apiFetch } from '@/lib/api';
import type { PublicUser, UserAddress } from '@/features/auth/auth-context';

export interface ProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: UserAddress;
}

export async function updateProfile(input: ProfileInput): Promise<PublicUser> {
  const { user } = await apiFetch<{ user: PublicUser }>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return user;
}
