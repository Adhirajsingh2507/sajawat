/**
 * Idempotent super-admin bootstrap (Milestone 1.1).
 *
 * Creates the first SUPER_ADMIN user if it does not already exist. Credentials
 * are sourced from the environment (Secret Manager in the cloud) — NEVER
 * hardcoded. Safe to run repeatedly: a matching email is a no-op.
 *
 * Run (operator): provide SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD, then
 *   pnpm --filter @sajawat/api exec tsx src/scripts/seed-admin.ts
 * or, against the built image:  node dist/scripts/seed-admin.js
 */
import { ROLES } from '@sajawat/shared';
import { connectToDatabase, disconnectFromDatabase } from '../db/index.js';
import { logger } from '../config/logger.js';
import { hashPassword } from '../auth/password.js';
import { userRepository } from '../modules/user/user.repository.js';

const MIN_PASSWORD_LENGTH = 12;

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email === undefined || email.length === 0 || password === undefined) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_ADMIN_PASSWORD must be at least ${String(MIN_PASSWORD_LENGTH)} characters`,
    );
  }

  await connectToDatabase();
  try {
    // includeDeleted: never silently resurrect or duplicate a removed admin.
    const existing = await userRepository.findByEmail(email, { includeDeleted: true });
    if (existing !== null) {
      logger.info({ email }, 'seed-admin: a user with this email already exists; no-op');
      return;
    }
    const passwordHash = await hashPassword(password);
    await userRepository.create({
      firstName: 'Sajawat',
      lastName: 'Admin',
      email,
      passwordHash,
      role: ROLES.SUPER_ADMIN,
      customerType: 'b2c',
      isEmailVerified: true,
      status: 'active',
    });
    logger.info({ email }, 'seed-admin: super admin created');
  } finally {
    await disconnectFromDatabase();
  }
}

seedAdmin().catch((err: unknown) => {
  logger.fatal({ err }, 'seed-admin failed');
  process.exit(1);
});
