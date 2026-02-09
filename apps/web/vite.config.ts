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
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5321,
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
