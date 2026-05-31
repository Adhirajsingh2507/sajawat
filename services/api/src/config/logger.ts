/**
 * Structured logger (pino). JSON by default — ideal for Cloud Run / Cloud
 * Logging ingestion. In development it is piped through pino-pretty for
 * human-readable output. Sensitive fields are redacted everywhere.
 */
import pino from 'pino';
import { env, isDevelopment } from './env.js';

const redact = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    '*.password',
    '*.token',
    '*.secret',
    '*.accessToken',
    '*.refreshToken',
  ],
  censor: '[REDACTED]',
};

export const logger = pino({
  level: env.LOG_LEVEL,
  redact,
  base: { service: '@sajawat/api', env: env.NODE_ENV },
  formatters: {
    level: (label) => ({ level: label }),
  },
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname,service,env',
          },
        },
      }
    : {}),
});

export type Logger = typeof logger;
