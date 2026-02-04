/**
 * Service Worker for API Request Interception
 * 
 * This service worker intercepts HTTP requests to the API and routes them
 * to browser-based handlers, enabling a fully offline-capable application.
 */

import type { APIRequestHandler } from '../types';

/**
 * Service Worker Manager
 * Manages service worker registration and communication
 */
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private apiBasePath: string;
  private handlers: Map<string, APIRequestHandler> = new Map();

  constructor(apiBasePath: string = '/api') {
    this.apiBasePath = apiBasePath;
  }

  /**
   * Register the service worker
   */
  async register(scriptPath: string = '/sw.js'): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported in this environment');
    }

    try {
      this.registration = await navigator.serviceWorker.register(scriptPath);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      console.log('[ServiceWorker] Registered successfully');
      
      // Set up message handler
      this.setupMessageHandler();
    } catch (error) {
      console.error('[ServiceWorker] Registration failed:', error);
      throw error;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
      console.log('[ServiceWorker] Unregistered');
    }
  }

  /**
   * Register an API request handler
   */
  registerHandler(pattern: string, handler: APIRequestHandler): void {
    this.handlers.set(pattern, handler);
    
    // Notify service worker
    this.postMessage({
      type: 'REGISTER_HANDLER',
      payload: { pattern }
    });
  }

  /**
   * Unregister an API request handler
   */
  unregisterHandler(pattern: string): void {
    this.handlers.delete(pattern);
    
    // Notify service worker
    this.postMessage({
      type: 'UNREGISTER_HANDLER',
      payload: { pattern }
    });
  }

  /**
   * Post message to service worker
   */
  private postMessage(message: any): void {
    if (!this.registration?.active) {
      console.warn('[ServiceWorker] No active service worker to send message to');
      return;
    }

    this.registration.active.postMessage(message);
  }

  /**
   * Set up message handler for service worker communication
   */
  private setupMessageHandler(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener('message', async (event) => {
      const { type, payload, id } = event.data;

      if (type === 'API_REQUEST') {
        await this.handleAPIRequest(payload, id);
      }
    });
  }

  /**
   * Handle API request from service worker
   */
  private async handleAPIRequest(payload: any, requestId: string): Promise<void> {
    const { url, method, headers, body } = payload;
    
    try {
      // Find matching handler
      const handler = this.findHandler(url);
      
      if (!handler) {
        this.postMessage({
          type: 'API_RESPONSE',
          id: requestId,
          payload: {
            status: 404,
            statusText: 'Not Found',
            body: JSON.stringify({ error: 'No handler found for this request' })
          }
        });
        return;
      }

      // Create Request object
      const request = new Request(url, {
        method,
        headers: new Headers(headers),
        body: body ? JSON.stringify(body) : undefined
      });

      // Execute handler
      const response = await handler(request);

      // Send response back to service worker
      const responseBody = await response.text();
      
      this.postMessage({
        type: 'API_RESPONSE',
        id: requestId,
        payload: {
          status: response.status,
          statusText: response.statusText,
          headers: Array.from(response.headers.entries()),
          body: responseBody
        }
      });
    } catch (error) {
      console.error('[ServiceWorker] Handler error:', error);
      
      this.postMessage({
        type: 'API_RESPONSE',
        id: requestId,
        payload: {
          status: 500,
          statusText: 'Internal Server Error',
          body: JSON.stringify({ error: String(error) })
        }
      });
    }
  }

  /**
   * Find handler for URL
   */
  private findHandler(url: string): APIRequestHandler | undefined {
    for (const [pattern, handler] of this.handlers.entries()) {
      if (this.matchPattern(url, pattern)) {
        return handler;
      }
    }
    return undefined;
  }

  /**
   * Match URL against pattern
   */
  private matchPattern(url: string, pattern: string): boolean {
    // Simple pattern matching - can be enhanced with regex
    const urlPath = new URL(url, 'http://localhost').pathname;
    
    // Exact match
    if (urlPath === pattern) {
      return true;
    }

    // Wildcard match
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(urlPath);
    }

    // Prefix match
    return urlPath.startsWith(pattern);
  }
}

/**
 * Service Worker Script Template
 * This should be used to generate the actual service worker file
 */
export const SERVICE_WORKER_SCRIPT = `
/**
 * ObjectOS Browser Runtime Service Worker
 * Intercepts API requests and routes them to browser-based handlers
 */

const API_BASE_PATH = '/api';
const registeredPatterns = new Set();
const pendingRequests = new Map();

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept API requests
  if (!url.pathname.startsWith(API_BASE_PATH)) {
    return;
  }

  event.respondWith(handleAPIRequest(event.request));
});

self.addEventListener('message', (event) => {
  const { type, payload, id } = event.data;

  if (type === 'REGISTER_HANDLER') {
    registeredPatterns.add(payload.pattern);
    console.log('[SW] Registered handler:', payload.pattern);
  }

  if (type === 'UNREGISTER_HANDLER') {
    registeredPatterns.delete(payload.pattern);
    console.log('[SW] Unregistered handler:', payload.pattern);
  }

  if (type === 'API_RESPONSE') {
    const resolver = pendingRequests.get(id);
    if (resolver) {
      resolver(payload);
      pendingRequests.delete(id);
    }
  }
});

async function handleAPIRequest(request) {
  const requestId = crypto.randomUUID();
  
  // Send request to main thread
  const clients = await self.clients.matchAll();
  if (clients.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No client available' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const client = clients[0];
  
  // Parse request
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let body = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.json();
    } catch {
      // Not JSON, ignore
    }
  }

  // Create promise for response
  const responsePromise = new Promise((resolve) => {
    pendingRequests.set(requestId, resolve);
  });

  // Send request to main thread
  client.postMessage({
    type: 'API_REQUEST',
    id: requestId,
    payload: {
      url: request.url,
      method: request.method,
      headers,
      body
    }
  });

  // Wait for response (with timeout)
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      pendingRequests.delete(requestId);
      resolve({
        status: 504,
        statusText: 'Gateway Timeout',
        body: JSON.stringify({ error: 'Request timeout' })
      });
    }, 30000); // 30 second timeout
  });

  const response = await Promise.race([responsePromise, timeoutPromise]);

  // Create Response object
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers || { 'Content-Type': 'application/json' })
  });
}
`;
