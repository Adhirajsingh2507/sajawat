/**
 * E2E global setup (Milestone 1.10a) — seeds a deterministic, in-stock product
 * via the admin API so the customer journeys always have something to buy.
 * Idempotent: creates the product on first run, tops up its stock thereafter.
 *
 * Prerequisites (local full-stack run): the API is up and a super-admin is
 * seeded (`admin@sajawat.test` / `AdminPass1234`, override via E2E_ADMIN_*).
 */
import type { FullConfig } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@sajawat.test';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass1234';

export const SEED_PRODUCT_SLUG = 'e2e-test-product';
const SEED_PRODUCT_NAME = 'E2E Test Product';

interface Envelope<T> {
  data: T;
}

function getSetCookies(res: Response): string[] {
  const h = res.headers as Headers & { getSetCookie?: () => string[] };
  return h.getSetCookie?.() ?? [];
}

function csrfFrom(cookies: string[]): string {
  for (const c of cookies) {
    const m = /sajawat_csrf=([^;]+)/.exec(c);
    if (m?.[1] !== undefined) return decodeURIComponent(m[1]);
  }
  return '';
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  // Only seed in full-stack mode. The default (web-only) smoke run and CI leave
  // E2E_FULL_STACK unset, so this is a no-op there.
  if (process.env.E2E_FULL_STACK !== '1') return;

  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!login.ok) {
    throw new Error(
      `E2E seed: admin login failed (${String(login.status)}). Start the API and seed the admin first.`,
    );
  }
  const cookies = getSetCookies(login);
  const { data: session } = (await login.json()) as Envelope<{ accessToken: string }>;
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${session.accessToken}`,
    'x-csrf-token': csrfFrom(cookies),
    cookie: cookies.map((c) => c.split(';')[0]).join('; '),
  };

  // Find our seed product among admin products.
  const listRes = await fetch(`${API}/admin/products?limit=100`, { headers });
  const { data: list } = (await listRes.json()) as Envelope<{
    items: { id: string; slug: string; status: string }[];
  }>;
  const existing = list.items.find((p) => p.slug === SEED_PRODUCT_SLUG);

  if (existing === undefined) {
    // Ensure a category, then create the product (active, well-stocked).
    let categoryId: string | undefined;
    const catRes = await fetch(`${API}/admin/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'E2E Collection', slug: 'e2e-collection', status: 'active' }),
    });
    if (catRes.ok) {
      categoryId = ((await catRes.json()) as Envelope<{ id: string }>).data.id;
    } else {
      const cats = (await (await fetch(`${API}/admin/categories?limit=100`, { headers })).json())
        .data as { items: { id: string }[] };
      categoryId = cats.items[0]?.id;
    }
    await fetch(`${API}/admin/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: SEED_PRODUCT_NAME,
        slug: SEED_PRODUCT_SLUG,
        sku: `E2E-${String(Date.now())}`,
        price: 1499,
        categoryId,
        status: 'active',
        quantity: 500,
      }),
    });
  } else {
    // Top the existing seed product back up so repeated runs stay in stock.
    await fetch(`${API}/admin/inventory/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ type: 'stock_added', quantity: 100, reason: 'e2e top-up' }),
    });
  }
}
