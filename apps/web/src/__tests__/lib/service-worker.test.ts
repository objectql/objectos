/**
 * Tests for service-worker registration utility.
 */
import { describe, it, expect } from 'vitest';
import { registerServiceWorker, unregisterServiceWorker } from '@/lib/service-worker';

describe('service-worker registration', () => {
  it('exports registerServiceWorker as a function', () => {
    expect(registerServiceWorker).toBeTypeOf('function');
  });

  it('exports unregisterServiceWorker as a function', () => {
    expect(unregisterServiceWorker).toBeTypeOf('function');
  });

  it('registerServiceWorker does not throw in jsdom (no real SW support)', () => {
    // jsdom doesn't support full ServiceWorker API — this validates
    // that the guard check prevents errors.
    expect(() => registerServiceWorker({ onError: () => {} })).not.toThrow();
  });
});
