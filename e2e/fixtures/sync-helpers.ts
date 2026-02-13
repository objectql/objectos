/**
 * E2E Sync Test Helpers
 *
 * Playwright utilities for testing offline/sync flows.
 *
 * @see docs/guide/technical-debt-resolution.md — TD-6 / M.2.5
 */

import type { Page } from '@playwright/test';

/** Simulate going offline by disabling the browser's network. */
export async function goOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
}

/** Simulate going back online by re-enabling the browser's network. */
export async function goOnline(page: Page): Promise<void> {
  await page.context().setOffline(false);
}

/** Wait for the sync-status indicator to show "synced" state. */
export async function waitForSync(page: Page, timeout = 10_000): Promise<void> {
  await page.waitForSelector('[data-testid="sync-status-synced"]', { timeout });
}

/** Wait for the offline indicator to become visible. */
export async function waitForOfflineIndicator(page: Page, timeout = 5_000): Promise<void> {
  await page.waitForSelector('[data-testid="offline-indicator"]', { timeout });
}
