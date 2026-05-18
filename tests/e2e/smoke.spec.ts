import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AdsStarter|Digital|Marketing/i);
});

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('roi calculator redirects unauthenticated users from dashboard', async ({ page }) => {
  await page.goto('/dashboard/roi-calculator');
  await expect(page).toHaveURL(/login/);
});

test('forgot password page loads', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/reset password/i);
});

test('campaign wizard redirects when logged out', async ({ page }) => {
  await page.goto('/dashboard/campaigns/new');
  await expect(page).toHaveURL(/login/);
});
