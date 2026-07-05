/**
 * Structured business-event logging (Milestone 1.10b.3).
 *
 * Emits a stable `event: '<domain>.<action>'` field on the shared pino logger so
 * Cloud Logging log-based metrics + alert policies can key on business events —
 * not just HTTP status. Successes log at `info`, failures at `warn` with
 * `outcome: 'failure'`.
 *
 * CONTRACT: the `event` string values below are the filter keys the monitoring
 * scripts depend on (`infrastructure/monitoring/03-log-metrics.sh`). Renaming or
 * removing one requires updating those log-metric filters in lockstep. Never put
 * secrets/PII beyond stable identifiers in the payload — the logger's redaction
 * only covers credential-shaped fields.
 */
import { logger } from '../config/logger.js';

export const EVENTS = {
  AUTH_LOGIN_SUCCEEDED: 'auth.login.succeeded',
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_REGISTERED: 'auth.registered',
  ORDER_PLACED: 'order.placed',
  ORDER_CANCELLED: 'order.cancelled',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  INVENTORY_LOW_STOCK: 'inventory.low_stock',
  INVENTORY_OUT_OF_STOCK: 'inventory.out_of_stock',
  CRM_LEAD_CREATED: 'crm.lead.created',
} as const;

export type BusinessEvent = (typeof EVENTS)[keyof typeof EVENTS];

type EventData = Record<string, unknown>;

/** Emit a successful business event (`info`, `outcome: 'success'`). */
export function logEvent(event: BusinessEvent, data: EventData = {}): void {
  logger.info({ event, outcome: 'success', ...data }, event);
}

/** Emit a failed business event (`warn`, `outcome: 'failure'`). */
export function logEventFailure(event: BusinessEvent, data: EventData = {}): void {
  logger.warn({ event, outcome: 'failure', ...data }, event);
}
