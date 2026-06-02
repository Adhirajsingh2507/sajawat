/**
 * Password hashing (Milestone 0.7, AD-19) — Argon2id via `@node-rs/argon2`
 * (prebuilt, no node-gyp; Docker/Cloud-Run friendly).
 *
 * Parameters follow the OWASP Argon2id baseline (m=19456 KiB, t=2, p=1).
 * Raw passwords are never stored or logged. Upper-bound the input length at the
 * call site (see `passwordSchema`) so the hasher can't be abused with huge input.
 */
import { hash, verify } from '@node-rs/argon2';

// Argon2id is the library default; set the OWASP-baseline cost parameters
// explicitly. (`Algorithm` is an ambient const enum and cannot be referenced
// under verbatimModuleSyntax, so we rely on the default algorithm.)
const HASH_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

/** Hash a plaintext password. Returns an encoded Argon2id string (self-describing). */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain, HASH_OPTIONS);
}

/** Constant-time verify of a plaintext password against a stored Argon2id hash. */
export function verifyPassword(passwordHash: string, plain: string): Promise<boolean> {
  return verify(passwordHash, plain);
}
