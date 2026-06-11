/**
 * User serialization (Milestone 1.2) — maps a User document to the public shape
 * returned by the API. Explicit allow-list so internal fields (passwordHash,
 * deletedAt, googleId, lockout internals) can never leak through a response.
 */
import type { HydratedDocument } from 'mongoose';
import type { Role } from '@sajawat/shared';
import type { CustomerType, IUser, UserStatus } from './user.types.js';

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  role: Role;
  customerType: CustomerType;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: UserStatus;
  createdAt?: Date | undefined;
}

export function toPublicUser(user: HydratedDocument<IUser>): PublicUser {
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    customerType: user.customerType,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    status: user.status,
    createdAt: user.createdAt,
  };
}
