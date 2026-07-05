/**
 * Business-event logging (Milestone 1.10b.3). Verifies the stable `event` +
 * `outcome` contract the monitoring log-metrics depend on. We spy on the shared
 * pino logger's info/warn to assert the emitted shape.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../config/logger.js';
import { EVENTS, logEvent, logEventFailure } from './events.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logEvent', () => {
  it('emits at info with the event id, outcome=success, and payload', () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    logEvent(EVENTS.ORDER_PLACED, { orderId: 'o1', total: 999 });
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(
      { event: 'order.placed', outcome: 'success', orderId: 'o1', total: 999 },
      'order.placed',
    );
  });

  it('defaults to an empty payload', () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    logEvent(EVENTS.AUTH_REGISTERED);
    expect(info).toHaveBeenCalledWith(
      { event: 'auth.registered', outcome: 'success' },
      'auth.registered',
    );
  });
});

describe('logEventFailure', () => {
  it('emits at warn with outcome=failure', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    logEventFailure(EVENTS.PAYMENT_FAILED, { razorpayOrderId: 'ro1', reason: 'bad_sig' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      { event: 'payment.failed', outcome: 'failure', razorpayOrderId: 'ro1', reason: 'bad_sig' },
      'payment.failed',
    );
  });
});

describe('EVENTS catalog', () => {
  it('every value is a dot-namespaced, unique event id', () => {
    const values = Object.values(EVENTS);
    expect(new Set(values).size).toBe(values.length);
    for (const v of values) expect(v).toMatch(/^[a-z]+(\.[a-z_]+)+$/);
  });
});
