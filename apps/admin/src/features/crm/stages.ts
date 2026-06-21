/** CRM pipeline stages (Milestone 1.8b) — canonical order + labels. */
import type { LeadStage } from '@sajawat/types';

export const LEAD_STAGES: readonly LeadStage[] = [
  'new',
  'contacted',
  'follow_up',
  'quotation_sent',
  'negotiation',
  'won',
  'lost',
];

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow-up',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};
