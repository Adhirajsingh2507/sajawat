/**
 * Contact service (Contact page). Reads public business info for the storefront
 * and submits a Contact-page message, which the API persists as a b2c/contact
 * CRM lead (gated + rate-limited — the caller is a signed-in user, D17).
 */
import { apiFetch } from '@/lib/api';
import type { ContactRequest, EnquiryAck, PublicSettings } from '@sajawat/types';

export function getContactInfo(): Promise<PublicSettings> {
  return apiFetch<PublicSettings>('/settings/public');
}

export function submitContact(input: ContactRequest): Promise<EnquiryAck> {
  return apiFetch<EnquiryAck>('/contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
