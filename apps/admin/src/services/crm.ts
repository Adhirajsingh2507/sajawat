/**
 * Admin CRM service (Milestone 1.8b) — wraps /admin/crm/leads (CRM_READ/WRITE).
 * Returns AdminLead DTOs; updates accept stage / assignment / a note to append.
 */
import { apiFetch } from '@/lib/api';
import type { AdminLead, LeadStage, Paginated } from '@sajawat/types';

export interface LeadListQuery {
  page?: number | undefined;
  limit?: number | undefined;
  stage?: LeadStage | undefined;
}

export interface LeadUpdateInput {
  stage?: LeadStage;
  assignedTo?: string | null;
  note?: string;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const out = sp.toString();
  return out.length > 0 ? `?${out}` : '';
}

export function listLeads(query: LeadListQuery = {}): Promise<Paginated<AdminLead>> {
  return apiFetch<Paginated<AdminLead>>(`/admin/crm/leads${qs({ ...query })}`);
}

export function getLead(id: string): Promise<AdminLead> {
  return apiFetch<AdminLead>(`/admin/crm/leads/${encodeURIComponent(id)}`);
}

export function updateLead(id: string, input: LeadUpdateInput): Promise<AdminLead> {
  return apiFetch<AdminLead>(`/admin/crm/leads/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
