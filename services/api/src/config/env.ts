/**
 * Environment configuration — validated once at boot with Zod and frozen.
 *
 * Strategy: fail-fast. Malformed values (bad port, bad URL, unknown NODE_ENV)
 * crash the process immediately with a readable report rather than surfacing as
 * obscure runtime failures later. Values are loaded from `process.env`, which
 * Node populates from `--env-file` / `--env-file-if-exists` (see package
 * scripts) and, in the cloud, from Google Secret Manager.
 *
 * Variables the API needs to *boot* are validated here. MONGODB_URI is now
 * required (Milestone 0.5); JWT/secret material (0.7) graduates to required in
 * its milestone.
 */
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().max(65535).default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // CORS — comma-separated allowed origins; defaults cover local web (:3000)
  // and admin (:3001). Parsed into a deduped array.
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001')
    .transform((value) => [
      ...new Set(
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0),
      ),
    ]),

  // Global rate limit (per IP). Auth-specific stricter limits are layered later
  // via the createRateLimiter factory.
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  // ---- Database (MongoDB Atlas) ----
  // Required. Credentials live in the URI; never logged (see db/connection.ts).
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .refine(
      (value) => /^mongodb(\+srv)?:\/\//.test(value),
      'MONGODB_URI must be a mongodb:// or mongodb+srv:// connection string',
    ),
  // Optional explicit database name (otherwise taken from the URI path).
  MONGODB_DB_NAME: z.string().min(1).optional(),
  // Connection pool sizing. Keep modest: Cloud Run scales horizontally, so
  // (instances x maxPoolSize) must stay under the Atlas tier connection cap.
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().max(500).default(10),
  MONGODB_MIN_POOL_SIZE: z.coerce.number().int().nonnegative().default(0),
  // Fail fast if Atlas is unreachable rather than hanging the boot.
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  MONGODB_SOCKET_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
  // Bounded exponential backoff for the *initial* connect (driver auto-reconnects
  // for transient drops afterwards).
  MONGODB_CONNECT_RETRY_ATTEMPTS: z.coerce.number().int().positive().max(20).default(5),
  MONGODB_CONNECT_RETRY_BASE_MS: z.coerce.number().int().positive().default(1_000),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // Logger depends on env, so it is not available yet — use stderr directly.
  process.stderr.write(`\n[env] Invalid environment configuration:\n${issues}\n\n`);
  process.exit(1);
}

export const env: Readonly<Env> = Object.freeze(parsed.data);

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
