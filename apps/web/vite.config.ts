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

export default defineConfig({
  plugins: [react(), tailwindcss(), htmlBaseUrl()],
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
      'react-router-dom',
      'better-auth/react',
      'better-auth/client/plugins',
      '@tanstack/react-query',
    ],
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
