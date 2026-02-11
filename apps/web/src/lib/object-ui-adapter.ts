/**
 * ObjectUI Adapter
 * 
 * Bridges ObjectStack backend with @object-ui React components.
 * This adapter provides the data layer for @object-ui using @object-ui/data-objectstack.
 */

import { createObjectStackAdapter } from '@object-ui/data-objectstack';

/**
 * Create ObjectStack data adapter for ObjectUI
 * 
 * This adapter allows ObjectUI components to fetch data from the ObjectStack backend
 * through the @objectstack/client API.
 */
export const objectUIAdapter = createObjectStackAdapter({
  // Base URL for ObjectStack API
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  
  // Optional: Custom headers for authentication
  headers: {
    'Content-Type': 'application/json',
  },
  
  // Optional: Enable credentials for cookie-based auth
  credentials: 'include',
});

/**
 * Export adapter as default for convenience
 */
export default objectUIAdapter;
