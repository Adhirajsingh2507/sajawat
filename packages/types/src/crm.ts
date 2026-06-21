/**
 * CRM / B2B enquiry DTOs (Milestone 1.8). The wholesale enquiry funnel: a gated
 * enquiry form creates a `crm_lead` (type=b2b, source=web) that staff work in
 * the admin CRM board. This is NOT a quotation/checkout flow.
 */

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'follow_up'
  | 'quotation_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

/** The wholesale enquiry payload submitted from the storefront. */
export interface EnquiryRequest {
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  /** GST registration number (optional). */
  gst?: string | undefined;
  /** Approximate quantity / order size the prospect is after. */
  quantity?: number | undefined;
  /** Free-text product interest (categories, SKUs, occasion). */
  productInterest?: string | undefined;
  message?: string | undefined;
}

/** Acknowledgement returned to the storefront after a successful enquiry. */
export interface EnquiryAck {
  id: string;
  stage: LeadStage;
}

/** A staff note appended to a lead's timeline. */
export interface LeadNote {
  body: string;
  authorId: string;
  createdAt: Date;
}

/** Full lead as seen in the admin CRM. */
export interface AdminLead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  gst?: string | undefined;
  quantity?: number | null | undefined;
  productInterest?: string | undefined;
  message?: string | undefined;
  type: 'b2b';
  source: string;
  stage: LeadStage;
  assignedTo?: string | null | undefined;
  notes: LeadNote[];
  /** The signed-in user who submitted the enquiry (if any). */
  submittedBy?: string | null | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
