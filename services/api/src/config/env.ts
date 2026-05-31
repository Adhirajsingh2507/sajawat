/**
 * Environment configuration — validated once at boot with Zod and frozen.
 *
 * Strategy: fail-fast. Malformed values (bad port, bad URL, unknown NODE_ENV)
 * crash the process immediately with a readable report rather than surfacing as
 * obscure runtime failures later. Values are loaded from `process.env`, which
 * Node populates from `--env-file` / `--env-file-if-exists` (see package
 * scripts) and, in the cloud, from Google Secret Manager.
 *
 * Only variables the API needs to *boot* in Milestone 0.4 are validated here.
 * MONGODB_URI (0.5) and JWT/secret material (0.7) graduate to required fields
 * in their respective milestones.
 */
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().max(65535).default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
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
