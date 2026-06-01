/**
 * MongoDB connection lifecycle (Mongoose, single default connection).
 *
 * Strategy (AD-2/AD-3):
 *  - One default connection (`mongoose.connect`) — the API talks to one DB.
 *  - The *initial* connect is wrapped in bounded exponential backoff + jitter.
 *    On exhaustion we throw; the caller (src/index.ts) fatal-logs and exits so
 *    the orchestrator (Cloud Run) restarts the container.
 *  - After the first successful connect, the driver auto-reconnects for
 *    transient drops; we never crash on later disconnects. Connection events are
 *    logged and reflected by the readiness health check.
 *
 * Security (AD-9): `strictQuery` + `sanitizeFilter` are enabled globally to
 * blunt query-operator injection, and the URI (which carries credentials) is
 * never logged — only a sanitized host is.
 */
import mongoose from 'mongoose';
import type { ConnectOptions } from 'mongoose';
import { env, isProduction } from '../config/env.js';
import { logger } from '../config/logger.js';

const log = logger.child({ module: 'db' });

// Global Mongoose settings (apply to all models/queries).
mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);
// autoIndex on every prod boot is a latency/lock risk; index creation is done
// explicitly via syncIndexes() when models land (AD-7).
mongoose.set('autoIndex', !isProduction);

let eventsBound = false;

/**
 * Strip credentials from a connection string so it is safe to log
 * (`mongodb+srv://user:pass@host/db` -> `mongodb+srv://host/db`).
 */
function sanitizeUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    return '[unparseable connection string]';
  }
}

function buildConnectionOptions(): ConnectOptions {
  const options: ConnectOptions = {
    appName: '@sajawat/api',
    serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    socketTimeoutMS: env.MONGODB_SOCKET_TIMEOUT_MS,
    maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
    minPoolSize: env.MONGODB_MIN_POOL_SIZE,
    retryWrites: true,
    retryReads: true,
  };
  if (env.MONGODB_DB_NAME !== undefined) {
    options.dbName = env.MONGODB_DB_NAME;
  }
  return options;
}

/** Wire connection lifecycle events to the logger exactly once. */
function bindConnectionEvents(): void {
  if (eventsBound) {
    return;
  }
  eventsBound = true;

  const connection = mongoose.connection;
  connection.on('connected', () => {
    log.info({ host: connection.host, name: connection.name }, 'MongoDB connected');
  });
  connection.on('disconnected', () => {
    // Not fatal: the driver will attempt to reconnect on its own.
    log.warn('MongoDB disconnected; driver will attempt to reconnect');
  });
  connection.on('reconnected', () => {
    log.info('MongoDB reconnected');
  });
  connection.on('error', (err: unknown) => {
    log.error({ err }, 'MongoDB connection error');
  });
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connect to MongoDB, retrying the *initial* connection with bounded
 * exponential backoff + jitter. Throws if every attempt fails.
 */
export async function connectToDatabase(): Promise<void> {
  bindConnectionEvents();

  const options = buildConnectionOptions();
  const maxAttempts = env.MONGODB_CONNECT_RETRY_ATTEMPTS;
  const baseMs = env.MONGODB_CONNECT_RETRY_BASE_MS;
  const safeUri = sanitizeUri(env.MONGODB_URI);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      log.info({ attempt, maxAttempts, uri: safeUri }, 'Connecting to MongoDB');
      await mongoose.connect(env.MONGODB_URI, options);
      return;
    } catch (err) {
      if (attempt >= maxAttempts) {
        log.error(
          { err, attempt, maxAttempts },
          'MongoDB initial connection failed; no attempts remaining',
        );
        throw err;
      }
      // Exponential backoff with full jitter, capped at 30s.
      const backoff = Math.min(baseMs * 2 ** (attempt - 1), 30_000);
      const wait = Math.floor(Math.random() * backoff);
      log.warn(
        { err, attempt, maxAttempts, retryInMs: wait },
        'MongoDB connection attempt failed; retrying',
      );
      await delay(wait);
    }
  }
}

/** Close the connection (called during graceful shutdown). */
export async function disconnectFromDatabase(): Promise<void> {
  // Nothing to close if already disconnected.
  if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) {
    return;
  }
  await mongoose.connection.close(false);
  log.info('MongoDB connection closed');
}
