import { describe, it, expect } from 'vitest';
import { passwordSchema } from './password-policy.js';

describe('passwordSchema', () => {
  it('accepts a valid password (letter + number, ≥8)', () => {
    expect(passwordSchema.safeParse('Sajawat123').success).toBe(true);
  });

  it('rejects too-short passwords', () => {
    expect(passwordSchema.safeParse('Saj1').success).toBe(false);
  });

  it('rejects passwords with no number', () => {
    expect(passwordSchema.safeParse('OnlyLetters').success).toBe(false);
  });

  it('rejects passwords with no letter', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(false);
  });

  it('rejects oversized passwords (hasher abuse guard)', () => {
    expect(passwordSchema.safeParse(`a1${'x'.repeat(200)}`).success).toBe(false);
  });
});
