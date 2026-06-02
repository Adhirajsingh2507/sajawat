import { test, expect } from '@playwright/test';

test('web /health responds ok', async ({ request }) => {
  const res = await request.get('/health');
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ status: 'ok', service: 'web' });
});

test('web homepage renders', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/.+/);
});
