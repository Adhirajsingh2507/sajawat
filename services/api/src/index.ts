/**
 * @sajawat/api — HTTP server entry point.
 *
 * Boot order (AD-3): validate env (import side-effect of ./config/env) ->
 * connect to MongoDB with bounded retry -> build the app -> bind the port. The
 * instance only starts serving once the database is reachable. Graceful
 * shutdown drains HTTP, then closes the Mongoose connection.
 */
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectToDatabase, disconnectFromDatabase } from './db/index.js';

let server: Server | undefined;
let isShuttingDown = false;

async function start(): Promise<void> {
  // Connect first; on exhaustion of retries this throws and we exit below.
  await connectToDatabase();

  const app = createApp();
  server = app.listen(env.API_PORT, () => {
    logger.info(
      { port: env.API_PORT, baseUrl: env.API_BASE_URL, env: env.NODE_ENV },
      '@sajawat/api listening',
    );
  });
}

async function closeHttpServer(): Promise<void> {
  if (server === undefined) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    server!.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  logger.info({ signal }, 'Shutdown signal received; draining');

  // Failsafe: force-exit if draining stalls.
  const failsafe = setTimeout(() => {
    logger.error('Forced shutdown after 10s drain timeout');
    process.exit(1);
  }, 10_000);
  failsafe.unref();

  try {
    await closeHttpServer();
    await disconnectFromDatabase();
    logger.info('Drained HTTP + database; exiting');
    clearTimeout(failsafe);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception; exiting');
  process.exit(1);
});

start().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start @sajawat/api');
  process.exit(1);
});
