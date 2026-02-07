import '@testing-library/jest-dom/vitest';

// Set window.location.origin for auth-client tests
// jsdom defaults to 'about:blank', we need a proper origin
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    origin: 'http://localhost:3001',
    href: 'http://localhost:3001/',
    hostname: 'localhost',
    port: '3001',
    protocol: 'http:',
    pathname: '/',
  },
  writable: true,
});
