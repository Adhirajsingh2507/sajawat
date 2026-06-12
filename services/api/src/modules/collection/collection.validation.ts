/**
 * Collection request schemas (Milestone 1.3a).
 */
import { z } from 'zod';

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');

export const createCollectionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    slug: slugField.optional(),
    description: z.string().trim().max(2000).optional(),
    bannerImage: z.string().trim().max(2048).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const updateCollectionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: slugField.optional(),
    description: z.string().trim().max(2000).optional(),
    bannerImage: z.string().trim().max(2048).optional(),
    status: z.enum(['active', 'inactive']).optional(),
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

export type CreateCollectionBody = z.infer<typeof createCollectionSchema>['body'];
export type UpdateCollectionBody = z.infer<typeof updateCollectionSchema>['body'];
export type ListQuery = z.infer<typeof listQuerySchema>['query'];
