import '@testing-library/jest-dom/vitest';

// Set window.location.origin for auth-client tests
// jsdom defaults to 'about:blank', we need a proper origin
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    origin: 'http://localhost:5321',
    href: 'http://localhost:5321/',
    hostname: 'localhost',
    port: '5321',
    protocol: 'http:',
    pathname: '/',
  },
  writable: true,
});
