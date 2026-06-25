import { describe, it, expect } from 'vitest';
import { resolveTrustProxy } from './env.js';

/**
 * D20 — the Express `trust proxy` setting must be a pinned hop count, never a
 * blanket `true` (which trusts the whole X-Forwarded-For chain and is
 * spoofable). These cases lock the per-environment defaults and the explicit
 * TRUST_PROXY parsing.
 */
describe('resolveTrustProxy', () => {
  describe('unset (per-environment safe defaults)', () => {
    it.each(['development', 'test'] as const)('ignores XFF locally in %s', (nodeEnv) => {
      // No proxy locally → req.ip is the real socket address.
      expect(resolveTrustProxy(undefined, nodeEnv)).toBe(false);
    });

    it.each(['staging', 'production'] as const)('trusts a single hop in %s', (nodeEnv) => {
      // Deployed behind Cloud Run → trust exactly one proxy hop by default.
      expect(resolveTrustProxy(undefined, nodeEnv)).toBe(1);
    });
  });

  describe('explicit TRUST_PROXY (explicit always wins over the default)', () => {
    it('parses an integer hop count', () => {
      expect(resolveTrustProxy('2', 'production')).toBe(2);
      expect(resolveTrustProxy('0', 'production')).toBe(0);
    });

    it('parses false (case-insensitive, trims)', () => {
      expect(resolveTrustProxy('false', 'production')).toBe(false);
      expect(resolveTrustProxy('  FALSE  ', 'production')).toBe(false);
    });

    it('parses true (allowed but discouraged)', () => {
      expect(resolveTrustProxy('true', 'production')).toBe(true);
    });

    it('passes through Express presets and CIDR lists as strings', () => {
      expect(resolveTrustProxy('loopback', 'production')).toBe('loopback');
      expect(resolveTrustProxy('127.0.0.1,10.0.0.0/8', 'production')).toBe('127.0.0.1,10.0.0.0/8');
    });

    it('overrides the deployed default when set to false', () => {
      expect(resolveTrustProxy('false', 'production')).toBe(false);
    });
  });
});
