/**
 * API client for ObjectStack REST endpoints.
 *
 * Uses the official @objectstack/client SDK to interact with the
 * ObjectStack server for data and metadata operations.
 *
 * Falls back to mock data when the server is unreachable, allowing
 * the UI to be developed independently of the backend.
 */

import { ObjectStackClient } from '@objectstack/client';

const API_BASE = '/api/v1';

/**
 * Shared ObjectStackClient singleton for the frontend.
 *
 * - In dev, Vite proxies `/api/v1` → `http://localhost:5320`
 * - In production, the SPA is served from the same origin as the API
 */
export const objectStackClient = new ObjectStackClient({
  baseUrl: API_BASE,
});
