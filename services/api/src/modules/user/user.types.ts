/**
 * User domain types (Milestone 1.1).
 *
 * `IUser` is the raw document shape Mongoose persists. `role` is a code-canonical
 * enum (AD-20) — there is no `roles` collection. `customerType` segments buyers
 * (B2C retail vs B2B bulk); B2B is a customer segment, NEVER a seller (the
 * platform is single-company, not a marketplace).
 */
import type { Role } from '@sajawat/shared';

export type CustomerType = 'b2c' | 'b2b';
export type UserStatus = 'active' | 'suspended' | 'deleted';

/** Single embedded address for Phase 1 (a dedicated collection may come later). */
export interface UserAddress {
  fullName?: string | undefined;
  phone?: string | undefined;
  line1?: string | undefined;
  line2?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postalCode?: string | undefined;
  country?: string | undefined;
}

export interface IUser {
  firstName: string;
  lastName: string;
  /** Stored lowercased + trimmed; unique. */
  email: string;
  /** Optional; sparse-unique when present. */
  phone?: string;
  /** Argon2id hash. `select: false` — never returned unless explicitly selected. */
  passwordHash?: string;
  /** Google OAuth subject id; sparse-unique. Absent for password accounts. */
  googleId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  customerType: CustomerType;
  role: Role;
  status: UserStatus;
  address?: UserAddress;
  /** Soft-delete marker (AD-6); null when active. */
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
