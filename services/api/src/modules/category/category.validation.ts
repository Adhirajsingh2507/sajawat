/**
 * Category request schemas (Milestone 1.3a). `sort`/page/limit are coerced and
 * bounded; slug is optional on create (derived from name when omitted).
 */
import { z } from 'zod';

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');

// Accept a 24-char hex ObjectId, or '' / null to mean "top-level" (clear parent).
const parentIdField = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{24}$/, 'Invalid parent category')
  .or(z.literal(''))
  .nullable()
  .optional();

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    slug: slugField.optional(),
    description: z.string().trim().max(2000).optional(),
    image: z.string().trim().max(2048).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    sortOrder: z.number().int().optional(),
    parentId: parentIdField,
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: slugField.optional(),
    description: z.string().trim().max(2000).optional(),
    image: z.string().trim().max(2048).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    sortOrder: z.number().int().optional(),
    parentId: parentIdField,
  }),
});

export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const slugParamSchema = z.object({ params: z.object({ slug: z.string().min(1) }) });
export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export type CreateCategoryBody = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>['body'];
export type ListQuery = z.infer<typeof listQuerySchema>['query'];
