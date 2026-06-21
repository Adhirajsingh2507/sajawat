/**
 * Enquiry service (Milestone 1.8b) — submits the B2B wholesale enquiry. Gated
 * (D17): the caller is an authenticated storefront user. The server persists a
 * CRM lead and fires the admin WhatsApp alert; we just get the acknowledgement.
 */
import { apiFetch } from '@/lib/api';
import type { EnquiryAck, EnquiryRequest } from '@sajawat/types';

export function submitEnquiry(input: EnquiryRequest): Promise<EnquiryAck> {
  return apiFetch<EnquiryAck>('/enquiries', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
