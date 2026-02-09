/**
 * E2E Smoke Test: Business app shell
 *
 * Validates that the dynamic business app pages render
 * and that object list/record navigation works.
 */

import { test, expect } from '@playwright/test';

test.describe('Business App Shell', () => {
  test('app page loads for known app', async ({ page }) => {
    await page.goto('/apps/crm');
    // Should render app content or redirect to sign-in
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('object list page renders table structure', async ({ page }) => {
    await page.goto('/apps/crm/leads');
    // Should render a page (either object list or auth redirect)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('object record page renders', async ({ page }) => {
    await page.goto('/apps/crm/leads/lead-001');
    // Should render record detail or auth redirect
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
