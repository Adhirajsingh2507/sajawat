/**
 * CRM lead types (Milestone 1.8). A wholesale enquiry persisted as a `crm_lead`
 * (type=b2b, source=web) worked by staff through the pipeline stages. Not a
 * quotation/checkout flow.
 */
import type { Types } from 'mongoose';
import type { LeadStage } from '@sajawat/types';

export interface ILeadNote {
  body: string;
  authorId: Types.ObjectId | string;
  createdAt: Date;
}

export interface ICrmLead {
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  gst?: string | undefined;
  quantity?: number | null;
  productInterest?: string | undefined;
  message?: string | undefined;
  type: 'b2b';
  source: string;
  stage: LeadStage;
  assignedTo?: Types.ObjectId | string | null;
  submittedBy?: Types.ObjectId | string | null;
  notes: ILeadNote[];
  deletedAt?: Date | null;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
