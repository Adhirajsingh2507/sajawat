/**
 * Security middleware (Milestone 1.9a) — closes D12-admin.
 *
 * Per-request nonce + strict Content-Security-Policy + hardening headers on
 * every HTML response. `script-src` uses `'nonce-…' 'strict-dynamic'` with NO
 * `'unsafe-inline'` (Next stamps the nonce onto its own scripts). The admin
 * console embeds no third-party widgets, so `frame-src 'none'` and there is no
 * Razorpay allowance (unlike the storefront). `style-src` keeps `'unsafe-inline'`
 * (Next / Tailwind / next-font inline styles; cannot execute JS). Dev relaxes
 * for HMR and omits `upgrade-insecure-requests` so http://localhost works.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV !== 'production';

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
    `connect-src 'self' ${apiOrigin()}${isDev ? ' ws: wss:' : ''}`,
    `frame-src 'none'`,
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
