import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing (argon2id)', () => {
  it('produces an argon2id-encoded hash', async () => {
    const hash = await hashPassword('Sajawat123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies the correct password', async () => {
    const hash = await hashPassword('Sajawat123');
    await expect(verifyPassword(hash, 'Sajawat123')).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('Sajawat123');
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
  });

  it('salts: same input yields distinct hashes', async () => {
    const a = await hashPassword('Sajawat123');
    const b = await hashPassword('Sajawat123');
    expect(a).not.toBe(b);
  });
});
