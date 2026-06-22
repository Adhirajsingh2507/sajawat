/**
 * Customer business journeys (Milestone 1.10a) — real browser flows against the
 * live stack (web + API + Mongo). Replaces the 0.9 smoke scaffold for the B2C
 * revenue path and the B2B lead funnel. Requires the full stack running and the
 * global-setup seed (a deterministic in-stock product).
 *
 * The three tests run serially on one shared (authenticated) page so they tell
 * one story: a new shopper registers, buys via COD, then submits a wholesale
 * enquiry.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { SEED_PRODUCT_SLUG } from './global-setup';

const stamp = Date.now();
const customer = {
  firstName: 'E2E',
  lastName: 'Buyer',
  email: `e2e+${String(stamp)}@example.test`,
  password: 'E2ePass1234',
};

let page: Page;

test.describe.serial('customer journeys', () => {
  // These journeys drive the real web + API + Mongo stack. The default web-only
  // smoke run / CI leaves the flag unset and skips the whole group.
  test.skip(
    process.env.E2E_FULL_STACK !== '1',
    'Full-stack journeys: run with E2E_FULL_STACK=1 and the API + web both up.',
  );

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('register a new account', async () => {
    await page.goto('/register');
    await page.getByLabel('First name').fill(customer.firstName);
    await page.getByLabel('Last name').fill(customer.lastName);
    await page.getByLabel('Email').fill(customer.email);
    await page.getByLabel('Password').fill(customer.password);
    await page.getByRole('button', { name: 'Create account' }).click();

    // Successful registration lands on the (authenticated) home shell.
    await expect(page).toHaveURL(new RegExp(`${escapeBase()}/?$`));
    await expect(page.getByRole('link', { name: 'Sajawat' }).first()).toBeVisible();
  });

  test('browse → add to cart → COD checkout → order confirmed', async () => {
    // Open the seeded product's PDP directly (deterministic + in stock).
    await page.goto(`/products/${SEED_PRODUCT_SLUG}`);
    await expect(page.getByRole('heading', { name: 'E2E Test Product' })).toBeVisible();

    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByText(/added to cart/i)).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Shopping cart' })).toBeVisible();
    await page.getByRole('link', { name: /proceed to checkout/i }).click();

    await expect(page).toHaveURL(/\/checkout/);
    await page.getByLabel('Full name').fill('E2E Buyer');
    await page.getByLabel('Phone').fill('9876543210');
    await page.getByLabel('Address line 1').fill('1 Test Street');
    await page.getByLabel('City').fill('Jaipur');
    await page.getByLabel('State').fill('Rajasthan');
    await page.getByLabel('Postal code').fill('302001');
    // Country defaults to India; COD is the default payment method.
    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page).toHaveURL(/\/account\/orders\/[a-f0-9]+/);
    await expect(page.getByText(/your order is confirmed/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Order #/ })).toBeVisible();
  });

  test('submit a B2B wholesale enquiry', async () => {
    await page.goto('/wholesale');
    await page.getByLabel('Your name').fill('E2E Buyer');
    await page.getByLabel('Company').fill('E2E Traders Pvt Ltd');
    await page.getByLabel('Phone').fill('9876543210');
    await page.getByLabel('Email').fill(customer.email);
    await page.getByLabel('City').fill('Surat');
    await page.getByRole('button', { name: 'Send enquiry' }).click();

    await expect(page.getByText(/we've received your enquiry/i)).toBeVisible();
  });
});

/** The app may be served at a host root; build a tolerant home-URL matcher. */
function escapeBase(): string {
  const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
  return base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/$/, '');
}
