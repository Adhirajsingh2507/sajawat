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
  // Cloud Run / container platforms inject PORT; when present it wins over
  // API_PORT (AD-27). Optional so local dev keeps using API_PORT.
  PORT: z.coerce.number().int().positive().max(65535).optional(),
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

  // Express `trust proxy` setting (D20). Controls how X-Forwarded-For is
  // interpreted when deriving req.ip — which keys the rate limiters. RAW string
  // here; parsed + defaulted per-environment into the `trustProxy` export below.
  //   "false"          → ignore XFF (req.ip = socket; correct with no proxy)
  //   "<N>" (integer)  → trust exactly N proxy hops nearest the app (preferred)
  //   "true"           → trust the WHOLE XFF chain (spoofable — avoid; D20)
  //   preset/CIDR str  → passed through to Express (e.g. "loopback", CIDR list)
  TRUST_PROXY: z.string().min(1).optional(),

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

  // ---- Auth / JWT (Milestone 0.7) ----
  // Required, distinct, >=32 chars. [secret] — Secret Manager in cloud.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  // Token lifetimes (jose duration strings, e.g. "15m", "7d").
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
  // Required issuer/audience — validated on every verify (claim binding).
  JWT_ISSUER: z.string().min(1, 'JWT_ISSUER is required'),
  JWT_AUDIENCE: z.string().min(1, 'JWT_AUDIENCE is required'),

  // Auth-route rate limit (very strict; built via createRateLimiter).
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // ---- Google OAuth (Milestone 1.2 — GIS ID-token flow) ----
  // OPTIONAL. The Client ID is NOT secret (it is embedded in the frontend); set
  // as a plain Cloud Run env var, not via Secret Manager. When absent,
  // `POST /api/v1/auth/google` returns 501 "Google sign-in not configured".
  // Real staging/production Client IDs are created during storefront work (1.4).
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),

  // ---- Razorpay (Milestone 1.6b) ---- [secret]
  // OPTIONAL. When key id/secret are absent, online checkout returns 501 and
  // only COD is available. Key secret + webhook secret come from Secret Manager.
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

  // ---- WhatsApp (Meta Cloud API — Milestone 1.8) ---- [secret]
  // OPTIONAL. When PHONE_NUMBER_ID/ACCESS_TOKEN are absent, B2B lead alerts are
  // logged and skipped (the lead is still persisted). The recipient admin number
  // lives in business settings, not here. ACCESS_TOKEN comes from Secret Manager.
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_API_VERSION: z.string().min(1).default('v21.0'),

  // ---- Google Cloud Storage media (Milestone 1.3-media) ----
  // OPTIONAL. When GCS_BUCKET is absent, media upload endpoints return 501 and
  // the admin keeps the manual image-URL fallback. Credentials come from
  // Application Default Credentials (the Cloud Run runtime SA) — no key file.
  // GCS_PROJECT_ID is only needed when ADC can't infer it (e.g. local dev).
  // GCS_PUBLIC_HOST overrides the default public host (e.g. a CDN/custom domain).
  GCS_BUCKET: z.string().min(1).optional(),
  GCS_PROJECT_ID: z.string().min(1).optional(),
  GCS_PUBLIC_HOST: z.string().url().optional(),
});

const EnvSchemaChecked = EnvSchema.superRefine((value, ctx) => {
  // Access and refresh secrets must differ so a leak of one does not compromise
  // the other (compromise isolation, AD-21).
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_REFRESH_SECRET'],
      message: 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET',
    });
  }
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchemaChecked.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // Logger depends on env, so it is not available yet — use stderr directly.
  process.stderr.write(`\n[env] Invalid environment configuration:\n${issues}\n\n`);
  process.exit(1);
}

export const env: Readonly<Env> = Object.freeze(parsed.data);

/**
 * Environment-aware hardening (AD-14): in production, refuse to boot with
 * development defaults that would be unsafe or simply wrong (e.g. a localhost
 * API URL or a localhost CORS origin). This extends the fail-fast philosophy to
 * catch a dev config accidentally shipped to prod.
 */
function isLocalhostUrl(value: string): boolean {
  try {
    const { hostname } = new URL(value);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

if (env.NODE_ENV === 'production') {
  const problems: string[] = [];
  if (isLocalhostUrl(env.API_BASE_URL)) {
    problems.push(`API_BASE_URL must not be localhost in production (got "${env.API_BASE_URL}")`);
  }
  const localOrigins = env.CORS_ORIGINS.filter(isLocalhostUrl);
  if (localOrigins.length > 0) {
    problems.push(
      `CORS_ORIGINS must not include localhost in production (got "${localOrigins.join(', ')}")`,
    );
  }
  if (problems.length > 0) {
    const report = problems.map((problem) => `  - ${problem}`).join('\n');
    process.stderr.write(`\n[env] Insecure production configuration:\n${report}\n\n`);
    process.exit(1);
  }
}

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

/**
 * Resolve the Express `trust proxy` setting (D20). Trusting the *entire* XFF
 * chain (`true`, the old hardcoded value) lets a client spoof an XFF entry to
 * forge req.ip and land in a fresh per-IP rate-limit bucket, evading the
 * limiters. We pin to a hop count instead. The correct count depends on the live
 * topology: Cloud Run alone is 1 hop; a *proxied* Cloudflare in front adds a
 * 2nd. Set TRUST_PROXY explicitly per environment once the chain is confirmed in
 * staging; the defaults below are safe starting points.
 */
export function resolveTrustProxy(
  raw: string | undefined,
  nodeEnv: Env['NODE_ENV'],
): boolean | number | string {
  if (raw === undefined) {
    // No proxy locally → ignore XFF (req.ip = real socket). Deployed behind
    // Cloud Run → trust a single hop; bump to 2 via TRUST_PROXY once a proxied
    // Cloudflare is confirmed in the live chain.
    return nodeEnv === 'development' || nodeEnv === 'test' ? false : 1;
  }
  const value = raw.trim();
  if (value.toLowerCase() === 'false') return false;
  if (value.toLowerCase() === 'true') return true;
  if (/^\d+$/.test(value)) return Number(value);
  return value; // Express preset ("loopback"/"uniquelocal") or CIDR allow-list.
}

export const trustProxy: boolean | number | string = resolveTrustProxy(
  env.TRUST_PROXY,
  env.NODE_ENV,
);
