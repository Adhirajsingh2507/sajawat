/**
 * Wishlist request schemas (Milestone 1.5b).
 */
import { z } from 'zod';

export const productIdParamSchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
});
