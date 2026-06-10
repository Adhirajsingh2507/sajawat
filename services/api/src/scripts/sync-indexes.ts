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

// Register every model whose indexes must be synced. Append as domains land.
const MODELS: Model<unknown>[] = [User];

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
