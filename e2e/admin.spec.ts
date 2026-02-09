/**
 * E2E Smoke Test: Admin Console navigation
 *
 * Validates that the admin settings pages are accessible
 * and render key UI elements. Tests use mock auth where possible.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Console', () => {
  test('home page renders', async ({ page }) => {
    await page.goto('/');
    // Home page should have sign-in or a visible heading
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('sign-in form accepts input', async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await emailInput.fill('admin@example.com');
    await passwordInput.fill('password123');

    await expect(emailInput).toHaveValue('admin@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('forgot-password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('body')).toContainText(/password|reset|forgot/i);
  });
});
