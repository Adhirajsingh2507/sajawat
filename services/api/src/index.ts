/**
 * @sajawat/api — HTTP server entry point.
 *
 * Validates the environment (via the import side-effect of ./config/env),
 * builds the app, binds the port, and installs graceful-shutdown + last-resort
 * process error handlers. Business modules (Controller -> Service -> Repository)
 * and the MongoDB connection arrive in Milestones 0.5+.
 */
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();

const server = app.listen(env.API_PORT, () => {
  logger.info(
    { port: env.API_PORT, baseUrl: env.API_BASE_URL, env: env.NODE_ENV },
    '@sajawat/api listening',
  );
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutdown signal received; closing HTTP server');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error while closing HTTP server');
      process.exit(1);
    }
    logger.info('HTTP server closed; exiting');
    process.exit(0);
  });
  // Failsafe: force-exit if in-flight connections do not drain in time.
  setTimeout(() => {
    logger.error('Forced shutdown after 10s drain timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  shutdown('SIGINT');
});
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception; exiting');
  process.exit(1);
});
