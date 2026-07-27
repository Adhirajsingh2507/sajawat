/**
 * Auth service (Milestone 1.2) — business logic for register/login/google/
 * refresh/logout/me. Orchestrates the user repository + session service; holds
 * no Express types (controllers adapt HTTP ⇄ service).
 *
 * Security notes:
 * - Registration ALWAYS creates a `customer` / `b2c` account. Client-supplied
 *   role/customerType are never honored (no privilege escalation; B2B is
 *   lead-gen, not self-serve — per the business model).
 * - Credential errors are generic ("Invalid email or password") to avoid user
 *   enumeration on login.
 */
import { ROLES } from '@sajawat/shared';
import { hashPassword, verifyPassword } from '../../auth/password.js';
import { verifyRefreshToken } from '../../auth/jwt.js';
import { verifyGoogleIdToken } from '../../auth/google.js';
import { env } from '../../config/env.js';
import { EVENTS, logEvent, logEventFailure } from '../../observability/events.js';
import { ConflictError, NotImplementedError, UnauthorizedError } from '../../errors/app-error.js';
import { userRepository } from '../user/user.repository.js';
import { toPublicUser } from '../user/user.serializer.js';
import type { PublicUser } from '../user/user.serializer.js';
import { sessionService } from '../session/session.service.js';
import type { IssuedTokens, SessionContext } from '../session/session.service.js';
import type { GoogleBody, LoginBody, RegisterBody, UpdateProfileBody } from './auth.validation.js';
import type { IUser } from '../user/user.types.js';

export interface AuthResult {
  user: PublicUser;
  tokens: IssuedTokens;
}

async function register(input: RegisterBody, ctx: SessionContext): Promise<AuthResult> {
  const existing = await userRepository.findByEmail(input.email, { includeDeleted: true });
  if (existing !== null) {
    throw new ConflictError('An account with this email already exists');
  }
  const passwordHash = await hashPassword(input.password);
  const user = await userRepository.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    passwordHash,
    role: ROLES.CUSTOMER,
    customerType: 'b2c',
    isEmailVerified: false,
    isPhoneVerified: false,
    status: 'active',
  });
  const tokens = await sessionService.issue(String(user._id), user.role, ctx);
  logEvent(EVENTS.AUTH_REGISTERED, { userId: String(user._id) });
  return { user: toPublicUser(user), tokens };
}

async function login(input: LoginBody, ctx: SessionContext): Promise<AuthResult> {
  const user = await userRepository.findByEmailWithPassword(input.email);
  // Run a hash compare only when a password account exists; the generic error
  // keeps the email-exists signal out of the response.
  if (user === null || user.passwordHash === undefined) {
    logEventFailure(EVENTS.AUTH_LOGIN_FAILED, {
      email: input.email,
      reason: 'invalid_credentials',
    });
    throw new UnauthorizedError('Invalid email or password');
  }
  if (user.status !== 'active') {
    logEventFailure(EVENTS.AUTH_LOGIN_FAILED, { email: input.email, reason: 'inactive_account' });
    throw new UnauthorizedError('Account is not active');
  }
  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) {
    logEventFailure(EVENTS.AUTH_LOGIN_FAILED, {
      email: input.email,
      reason: 'invalid_credentials',
    });
    throw new UnauthorizedError('Invalid email or password');
  }
  const tokens = await sessionService.issue(String(user._id), user.role, ctx);
  logEvent(EVENTS.AUTH_LOGIN_SUCCEEDED, { userId: String(user._id), role: user.role });
  return { user: toPublicUser(user), tokens };
}

async function googleLogin(input: GoogleBody, ctx: SessionContext): Promise<AuthResult> {
  if (env.GOOGLE_CLIENT_ID === undefined) {
    throw new NotImplementedError('Google sign-in not configured');
  }
  const identity = await verifyGoogleIdToken(input.idToken);
  if (!identity.emailVerified) {
    throw new UnauthorizedError('Google email is not verified');
  }

  let user =
    (await userRepository.findOne({ googleId: identity.sub })) ??
    (await userRepository.findByEmail(identity.email));

  if (user !== null) {
    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is not active');
    }
    // Link Google to a pre-existing password account on first Google sign-in.
    if (user.googleId === undefined) {
      user.googleId = identity.sub;
      await user.save();
    }
  } else {
    user = await userRepository.create({
      firstName: identity.firstName ?? 'Sajawat',
      lastName: identity.lastName ?? 'Customer',
      email: identity.email,
      googleId: identity.sub,
      role: ROLES.CUSTOMER,
      customerType: 'b2c',
      isEmailVerified: identity.emailVerified,
      isPhoneVerified: false,
      status: 'active',
    });
  }

  const tokens = await sessionService.issue(String(user._id), user.role, ctx);
  return { user: toPublicUser(user), tokens };
}

async function refresh(refreshToken: string, ctx: SessionContext): Promise<IssuedTokens> {
  const claims = await verifyRefreshToken(refreshToken);
  const user = await userRepository.findById(claims.sub);
  if (user === null || user.status !== 'active') {
    // The account is gone/disabled — kill the whole family defensively.
    await sessionService.revokeFamily(claims.family);
    throw new UnauthorizedError('Session is no longer valid');
  }
  return sessionService.rotate(claims, user.role, ctx);
}

async function logout(refreshToken: string): Promise<void> {
  try {
    const claims = await verifyRefreshToken(refreshToken);
    await sessionService.revoke(claims.jti);
  } catch {
    // Already-invalid token ⇒ nothing to revoke; logout is idempotent.
  }
}

async function getMe(userId: string): Promise<PublicUser> {
  const user = await userRepository.findById(userId);
  if (user === null) {
    throw new UnauthorizedError();
  }
  return toPublicUser(user);
}

/** Self-service profile update. Only name/phone/address — never role/status/email. */
async function updateProfile(userId: string, input: UpdateProfileBody): Promise<PublicUser> {
  const patch: Partial<IUser> = {};
  if (input.firstName !== undefined) patch.firstName = input.firstName;
  if (input.lastName !== undefined) patch.lastName = input.lastName;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.address !== undefined) patch.address = input.address;
  const updated = await userRepository.updateById(userId, { $set: patch });
  if (updated === null) {
    throw new UnauthorizedError();
  }
  return toPublicUser(updated);
}

export const authService = {
  register,
  login,
  googleLogin,
  refresh,
  logout,
  getMe,
  updateProfile,
};
