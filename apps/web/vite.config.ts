import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

const base = process.env.VERCEL ? '/' : '/console/';

/** Replace %BASE_URL% placeholders inside index.html at build time. */
function htmlBaseUrl(): Plugin {
  return {
    name: 'html-base-url',
    transformIndexHtml(html) {
      return html.replace(/%BASE_URL%/g, base);
    },
  };
}

/**
 * Rollup plugin: stub Node.js built-in modules that leak into the browser
 * bundle via server-side transitive dependencies (e.g. @objectstack/core).
 * Each built-in is resolved to a virtual module exporting a Proxy so that
 * any named import (e.g. `import { createHash } from "crypto"`) receives a
 * no-op function instead of failing the build.
 */
const nodeBuiltins = ['crypto', 'path', 'module', 'fs', 'os', 'util'];
const VIRTUAL_PREFIX = '\0node-stub:';
function nodeBuiltinStubs(): Plugin {
  return {
    name: 'node-builtin-stubs',
    enforce: 'pre',
    resolveId(source) {
      if (nodeBuiltins.includes(source)) return VIRTUAL_PREFIX + source;
    },
    load(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        // Return a module that exports a Proxy as its default + re-exports
        // any named binding the consumer asks for as a no-op function.
        return `
const handler = { get: (_, prop) => typeof prop === 'string' ? () => '' : undefined };
const stub = new Proxy({}, handler);
export default stub;
export const createHash = () => ({ update: () => ({ digest: () => '' }) });
`;
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), htmlBaseUrl(), nodeBuiltinStubs()],
  base,
  resolve: {
    // Ensure every dependency resolves to exactly ONE copy of React, its DOM
    // renderer, and the router — prevents "Invalid hook call" errors.
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    // Force these into the Vite pre-bundle so they share a single React chunk.
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router',
      'react-router-dom',
      'better-auth/react',
      'better-auth/client/plugins',
      '@tanstack/react-query',
    ],
    // @objectstack/core contains Node.js built-ins (crypto, path).
    // Exclude it from pre-bundling so the stubs plugin resolves them.
    exclude: ['@objectstack/core'],
  },
  server: {
    port: 5321,
    hmr: {
      // With base: '/console/' the default WS path becomes /console/ which
      // can fail behind proxies or when a stale Service Worker intercepts the
      // upgrade request.  Use a dedicated path so HMR always connects.
      path: 'hmr',
    },
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5320',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Performance budget: warn if chunks exceed 250 KB
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
