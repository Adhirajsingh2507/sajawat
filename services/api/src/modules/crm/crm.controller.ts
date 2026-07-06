/**
 * CRM controllers (Milestone 1.8). `submitEnquiry` is the gated storefront entry
 * point; the rest are admin pipeline adapters. The actor for writes comes from
 * the authenticated session.
 */
import type { Request, RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { UnauthorizedError } from '../../errors/app-error.js';
import { crmService } from './crm.service.js';
import type { ContactBody, EnquiryBody, LeadListQuery, UpdateLeadBody } from './crm.validation.js';

function userId(req: Request): string {
  const id = req.user?.id;
  if (id === undefined) {
    throw new UnauthorizedError();
  }
  return id;
}

export const submitEnquiry: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as EnquiryBody;
  // Gated storefront (D17): the submitter is always authenticated.
  sendSuccess(res, await crmService.createLead(body, req.user?.id ?? null), 201);
});

export const submitContact: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as ContactBody;
  sendSuccess(res, await crmService.createContactLead(body, req.user?.id ?? null), 201);
});

export const adminList: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.validatedData?.query ?? {}) as LeadListQuery;
  sendSuccess(res, await crmService.listAdmin(query));
});

export const adminGet: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  sendSuccess(res, await crmService.getByIdAdmin(id));
});

export const adminUpdate: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params as { id: string };
  const body = req.validatedData?.body as UpdateLeadBody;
  sendSuccess(res, await crmService.updateAdmin(id, body, userId(req)));
});
