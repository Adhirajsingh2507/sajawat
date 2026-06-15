/**
 * Explicit index synchronization (Milestone 1.1, AD-7).
 *
 * Production boots with `autoIndex` off (building indexes on every cold start is
 * a latency/lock risk), so indexes are materialized deliberately by running this
 * script after a deploy that changes the index contract. `syncIndexes()` creates
 * missing indexes and drops ones no longer declared on the schema.
 *
 * Run (operator): pnpm --filter @sajawat/api exec tsx src/scripts/sync-indexes.ts
 * or, against the built image:  node dist/scripts/sync-indexes.js
 */
import type { Model } from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../db/index.js';
import { logger } from '../config/logger.js';
import { User } from '../modules/user/user.model.js';
import { Session } from '../modules/session/session.model.js';
import { Category } from '../modules/category/category.model.js';
import { Collection } from '../modules/collection/collection.model.js';
import { Product } from '../modules/product/product.model.js';
import { Inventory } from '../modules/inventory/inventory.model.js';
import { InventoryMovement } from '../modules/inventory/inventory-movement.model.js';
import { Promotion } from '../modules/promotion/promotion.model.js';
import { Cart } from '../modules/cart/cart.model.js';
import { Wishlist } from '../modules/wishlist/wishlist.model.js';
import { Order } from '../modules/order/order.model.js';
import { Payment } from '../modules/payment/payment.model.js';

// Register every model whose indexes must be synced. Append as domains land.
const MODELS: Model<unknown>[] = [
  User,
  Session,
  Category,
  Collection,
  Product,
  Inventory,
  InventoryMovement,
  Promotion,
  Cart,
  Wishlist,
  Order,
  Payment,
];

async function syncIndexes(): Promise<void> {
  await connectToDatabase();
  try {
    for (const model of MODELS) {
      await model.syncIndexes();
      logger.info({ model: model.modelName }, 'indexes synced');
    }
  } finally {
    await disconnectFromDatabase();
  }
}

syncIndexes().catch((err: unknown) => {
  logger.fatal({ err }, 'sync-indexes failed');
  process.exit(1);
});
