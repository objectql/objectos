/**
 * ServiceWorkerManager — Service Worker registration and cache management.
 *
 * Manages Service Worker lifecycle: registration, update detection,
 * and cache strategy configuration for offline-first capability.
 *
 * Phase K — Task K.1
 */

import { useEffect, useState, useCallback } from 'react';

export interface ServiceWorkerState {
  /** Whether a Service Worker is registered */
  isRegistered: boolean;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Whether the app is being served from cache */
  isServedFromCache: boolean;
  /** Registration error, if any */
  error: string | null;
}

/**
 * Register the Service Worker for offline support.
 * In production, caches static assets and API responses.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * useServiceWorker — hook for managing Service Worker state.
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isRegistered: false,
    updateAvailable: false,
    isServedFromCache: false,
    error: null,
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Check existing registration
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        setState((prev) => ({ ...prev, isRegistered: true }));

        registration.addEventListener('updatefound', () => {
          setState((prev) => ({ ...prev, updateAvailable: true }));
        });
      }
    }).catch(() => {
      // Ignore — serviceWorker may not be available
    });
  }, []);

  const register = useCallback(async () => {
    try {
      const registration = await registerServiceWorker();
      if (registration) {
        setState((prev) => ({ ...prev, isRegistered: true, error: null }));
      }
    } catch {
      setState((prev) => ({ ...prev, error: 'Failed to register Service Worker' }));
    }
  }, []);

  const update = useCallback(async () => {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.update();
      setState((prev) => ({ ...prev, updateAvailable: false }));
    }
  }, []);

  return { ...state, register, update };
}
