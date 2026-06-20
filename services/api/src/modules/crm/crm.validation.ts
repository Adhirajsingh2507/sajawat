/**
 * CRM request schemas (Milestone 1.8). The public-facing enquiry body plus the
 * admin list/update shapes.
 */
import { z } from 'zod';

const LEAD_STAGES = ['new', 'contacted', 'follow_up', 'negotiation', 'won', 'lost'] as const;

export const enquirySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    company: z.string().trim().min(1).max(200),
    phone: z.string().trim().min(5).max(20),
    email: z.string().trim().email().max(200),
    city: z.string().trim().min(1).max(100),
    gst: z.string().trim().max(20).optional(),
    quantity: z.number().int().nonnegative().max(1_000_000).optional(),
    productInterest: z.string().trim().max(500).optional(),
    message: z.string().trim().max(2000).optional(),
  }),
});

export const leadListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    stage: z.enum(LEAD_STAGES).optional(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export const updateLeadSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      stage: z.enum(LEAD_STAGES).optional(),
      // Assign to a user id, or '' / null to unassign.
      assignedTo: z.string().trim().max(64).nullable().optional(),
      // A staff note to append to the lead timeline.
      note: z.string().trim().min(1).max(2000).optional(),
    })
    .refine((b) => b.stage !== undefined || b.assignedTo !== undefined || b.note !== undefined, {
      message: 'Provide at least one of stage, assignedTo, or note',
    }),
});

export type EnquiryBody = z.infer<typeof enquirySchema>['body'];
export type LeadListQuery = z.infer<typeof leadListQuerySchema>['query'];
export type UpdateLeadBody = z.infer<typeof updateLeadSchema>['body'];
