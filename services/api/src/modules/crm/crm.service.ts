/**
 * CRM service (Milestone 1.8). Creates leads from wholesale enquiries (persist +
 * best-effort instant WhatsApp alert), and the admin pipeline operations. The
 * notification is fire-and-await but never throws, so it can't roll back a lead.
 */
import type { HydratedDocument } from 'mongoose';
import type { AdminLead, EnquiryAck, Paginated } from '@sajawat/types';
import { NotFoundError } from '../../errors/app-error.js';
import { EVENTS, logEvent } from '../../observability/events.js';
import type { PaginatedResult } from '../../db/base-repository.js';
import { notificationService } from '../../notifications/notification.service.js';
import { crmLeadRepository } from './crm.repository.js';
import type { ICrmLead } from './crm.types.js';
import type { ContactBody, EnquiryBody, LeadListQuery, UpdateLeadBody } from './crm.validation.js';

type LeadDoc = HydratedDocument<ICrmLead>;

function toAdminLead(doc: LeadDoc): AdminLead {
  return {
    id: String(doc._id),
    name: doc.name,
    company: doc.company,
    phone: doc.phone,
    email: doc.email,
    city: doc.city,
    gst: doc.gst,
    quantity: doc.quantity,
    productInterest: doc.productInterest,
    message: doc.message,
    type: doc.type,
    source: doc.source,
    stage: doc.stage,
    assignedTo: doc.assignedTo != null ? String(doc.assignedTo) : null,
    submittedBy: doc.submittedBy != null ? String(doc.submittedBy) : null,
    notes: doc.notes.map((n) => ({
      body: n.body,
      authorId: String(n.authorId),
      createdAt: n.createdAt,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function createLead(input: EnquiryBody, submittedBy: string | null): Promise<EnquiryAck> {
  const doc = await crmLeadRepository.create({
    name: input.name,
    company: input.company,
    phone: input.phone,
    email: input.email,
    city: input.city,
    ...(input.gst !== undefined ? { gst: input.gst } : {}),
    quantity: input.quantity ?? null,
    ...(input.productInterest !== undefined ? { productInterest: input.productInterest } : {}),
    ...(input.message !== undefined ? { message: input.message } : {}),
    type: 'b2b',
    source: 'web',
    stage: 'new',
    submittedBy: submittedBy ?? null,
    notes: [],
  });

  logEvent(EVENTS.CRM_LEAD_CREATED, {
    leadId: String(doc._id),
    type: doc.type,
    source: doc.source,
  });

  // Best-effort instant admin alert; failure must not affect the saved lead.
  // company/city come from the (required) enquiry input, not the now-optional doc.
  await notificationService.sendLeadAlert({
    name: doc.name,
    company: input.company,
    phone: doc.phone,
    city: input.city,
    quantity: doc.quantity,
    productInterest: doc.productInterest,
  });

  return { id: String(doc._id), stage: doc.stage };
}

/**
 * Storefront Contact-page message → a `b2c` / `source=contact` lead in the same
 * pipeline. No company/city (not collected) and NO wholesale WhatsApp alert
 * (that channel is for B2B leads); the message still surfaces in the admin CRM.
 */
async function createContactLead(
  input: ContactBody,
  submittedBy: string | null,
): Promise<EnquiryAck> {
  const doc = await crmLeadRepository.create({
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: input.message,
    type: 'b2c',
    source: 'contact',
    stage: 'new',
    submittedBy: submittedBy ?? null,
    notes: [],
  });

  logEvent(EVENTS.CRM_LEAD_CREATED, {
    leadId: String(doc._id),
    type: doc.type,
    source: doc.source,
  });

  return { id: String(doc._id), stage: doc.stage };
}

async function listAdmin(query: LeadListQuery): Promise<Paginated<AdminLead>> {
  const filter: Record<string, unknown> = {};
  if (query.stage !== undefined) filter.stage = query.stage;
  const res: PaginatedResult<LeadDoc> = await crmLeadRepository.paginate(filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
  });
  return {
    items: res.items.map(toAdminLead),
    total: res.total,
    page: res.page,
    limit: res.limit,
    pages: res.pages,
  };
}

async function getByIdAdmin(id: string): Promise<AdminLead> {
  const doc = await crmLeadRepository.findById(id);
  if (doc === null) {
    throw new NotFoundError('Lead not found');
  }
  return toAdminLead(doc);
}

async function updateAdmin(id: string, input: UpdateLeadBody, actorId: string): Promise<AdminLead> {
  const set: Record<string, unknown> = {};
  if (input.stage !== undefined) set.stage = input.stage;
  if (input.assignedTo !== undefined) {
    set.assignedTo = input.assignedTo === null || input.assignedTo === '' ? null : input.assignedTo;
  }

  const update: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) update.$set = set;
  if (input.note !== undefined) {
    update.$push = { notes: { body: input.note, authorId: actorId, createdAt: new Date() } };
  }

  const updated = await crmLeadRepository.updateById(id, update);
  if (updated === null) {
    throw new NotFoundError('Lead not found');
  }
  return toAdminLead(updated);
}

export const crmService = {
  createLead,
  createContactLead,
  listAdmin,
  getByIdAdmin,
  updateAdmin,
};
