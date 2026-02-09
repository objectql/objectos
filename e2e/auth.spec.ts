/**
 * E2E Smoke Test: Authentication flows
 *
 * Validates that the sign-in and sign-up pages render correctly
 * and that unauthenticated users are redirected to sign-in.
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('sign-in page renders', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('sign-up page renders', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: /sign up|create.*account/i })).toBeVisible();
  });

  test('unauthenticated user is redirected to sign-in', async ({ page }) => {
    await page.goto('/settings');
    // Should redirect to sign-in when not authenticated
    await expect(page).toHaveURL(/sign-in/);
  });

  test('sign-in page has link to sign-up', async ({ page }) => {
    await page.goto('/sign-in');
    const signUpLink = page.getByRole('link', { name: /sign up|create.*account|register/i });
    await expect(signUpLink).toBeVisible();
  });
});
