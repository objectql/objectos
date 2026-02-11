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
 * 
 * Note: The adapter uses 'baseUrl' (not 'baseURL') as per the @objectstack/client API.
 * This follows Node.js URL conventions where 'baseUrl' is used for configuration.
 */
export const objectUIAdapter = createObjectStackAdapter({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  
  // Optional: Token for authentication (if not using cookies)
  // By default, the adapter uses cookie-based authentication from better-auth
  // token: 'your-auth-token',
});

/**
 * Export adapter as default for convenience
 */
export default objectUIAdapter;
