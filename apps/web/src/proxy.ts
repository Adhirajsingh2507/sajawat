/**
 * Security middleware (Milestone 1.9a) — closes D12-web.
 *
 * Emits a per-request nonce and a strict Content-Security-Policy plus the
 * standard hardening headers on every HTML response. `script-src` uses
 * `'nonce-…' 'strict-dynamic'` with NO `'unsafe-inline'` — the meaningful XSS
 * defense; Next applies the nonce to its own scripts automatically, and
 * `strict-dynamic` covers the Razorpay checkout script the storefront injects
 * at runtime. `style-src` keeps `'unsafe-inline'` (Next / Tailwind / next-font
 * inject inline styles; styles can't execute JS, so this is an accepted,
 * low-risk relaxation). Razorpay's iframe/API origins are allowed for the
 * (dormant) online-payment path. Dev relaxes for HMR (eval + websockets) and
 * omits `upgrade-insecure-requests` so http://localhost works.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV !== 'production';

/** Razorpay needs its iframe + API origins (dormant until keys, see D18). */
const RAZORPAY = 'https://*.razorpay.com';

function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1').origin;
  } catch {
    return 'http://localhost:4000';
  }
}

function buildCsp(nonce: string): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' https: data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${apiOrigin()} ${RAZORPAY}${isDev ? ' ws: wss:' : ''}`,
    `frame-src ${RAZORPAY}`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];
  if (!isDev) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  // Next reads the nonce from the request CSP header and stamps it onto the
  // scripts it renders, so hydration works under the nonce policy.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if (!isDev) {
    response.headers.set(
      'strict-transport-security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }
  return response;
}

export const config = {
  // Run on documents, not static assets or the optimizer; skip prefetches.
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
