/**
 * Auth controllers (Milestone 1.2) — HTTP adapter only: read validated input,
 * call the service, set/clear cookies, send the standard envelope. No business
 * logic here.
 *
 * Token transport: access token in the JSON body (Bearer, client memory);
 * refresh token in an httpOnly+Secure+SameSite=Strict cookie; CSRF cookie
 * issued on session creation for the cookie-authenticated routes.
 */
import type { Request, RequestHandler } from 'express';
import { sendSuccess } from '../../http/respond.js';
import { asyncHandler } from '../../http/async-handler.js';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from '../../auth/cookies.js';
import { issueCsrfToken } from '../../middleware/csrf.js';
import { UnauthorizedError } from '../../errors/app-error.js';
import type { SessionContext } from '../session/session.service.js';
import { authService } from './auth.service.js';
import type { GoogleBody, LoginBody, RegisterBody } from './auth.validation.js';

function contextOf(req: Request): SessionContext {
  return { ip: req.ip, userAgent: req.get('user-agent') ?? undefined };
}

function refreshTokenFrom(req: Request): string {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.[REFRESH_COOKIE_NAME];
  if (typeof token !== 'string' || token.length === 0) {
    throw new UnauthorizedError('Missing refresh token');
  }
  return token;
}

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as RegisterBody;
  const { user, tokens } = await authService.register(body, contextOf(req));
  setRefreshCookie(res, tokens.refreshToken);
  issueCsrfToken(res);
  sendSuccess(res, { user, accessToken: tokens.accessToken }, 201);
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as LoginBody;
  const { user, tokens } = await authService.login(body, contextOf(req));
  setRefreshCookie(res, tokens.refreshToken);
  issueCsrfToken(res);
  sendSuccess(res, { user, accessToken: tokens.accessToken });
});

export const google: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.validatedData?.body as GoogleBody;
  const { user, tokens } = await authService.googleLogin(body, contextOf(req));
  setRefreshCookie(res, tokens.refreshToken);
  issueCsrfToken(res);
  sendSuccess(res, { user, accessToken: tokens.accessToken });
});

export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(refreshTokenFrom(req), contextOf(req));
  setRefreshCookie(res, tokens.refreshToken);
  issueCsrfToken(res); // rotate the (persistent) CSRF cookie alongside the refresh
  sendSuccess(res, { accessToken: tokens.accessToken });
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  await authService.logout(refreshTokenFrom(req));
  clearRefreshCookie(res);
  sendSuccess(res, { loggedOut: true });
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (userId === undefined) {
    throw new UnauthorizedError();
  }
  const user = await authService.getMe(userId);
  sendSuccess(res, { user });
});
