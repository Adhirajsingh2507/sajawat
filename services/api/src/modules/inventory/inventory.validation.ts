/**
 * Inventory request schemas (Milestone 1.3b). `order` is excluded from the admin
 * adjust enum (system-only, written at checkout).
 */
import { z } from 'zod';

export const adjustInventorySchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
  body: z.object({
    type: z.enum(['stock_added', 'stock_removed', 'manual_adjustment', 'return']),
    quantity: z.number().int().nonnegative(),
    reason: z.string().trim().max(500).optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
  }),
});

export const inventoryListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
  }),
});

export const inventoryHistoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    productId: z.string().min(1).optional(),
  }),
});

export type AdjustInventoryBody = z.infer<typeof adjustInventorySchema>['body'];
export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>['query'];
export type InventoryHistoryQuery = z.infer<typeof inventoryHistoryQuerySchema>['query'];
