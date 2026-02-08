/**
 * Service Worker registration utility.
 *
 * Registers the SW for PWA offline support and exposes
 * update lifecycle events to the application.
 */

export interface SWRegistrationCallbacks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

export function registerServiceWorker(callbacks: SWRegistrationCallbacks = {}): void {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: import.meta.env.BASE_URL,
      });

      registration.onupdatefound = () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.onstatechange = () => {
          if (installing.state !== 'installed') return;
          if (navigator.serviceWorker.controller) {
            // New content is available; trigger update callback
            callbacks.onUpdate?.(registration);
          } else {
            // Content is cached for the first time
            callbacks.onSuccess?.(registration);
          }
        };
      };
    } catch (err) {
      callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

export function unregisterServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister();
  });
}
