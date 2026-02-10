import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { I18nProvider } from './hooks/use-i18n';
import { registerServiceWorker } from './lib/service-worker';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// BASE_URL is set by Vite based on the `base` config:
// Vercel → "/" (stripped to ""), Local → "/console/" (stripped to "/console")
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '');

// Register service worker for PWA offline support (production only).
// In dev mode the SW's cache-first strategy serves stale Vite pre-bundled
// chunks, causing React hook mismatches and HMR WebSocket failures.
if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: () => console.log('[SW] Content cached for offline use'),
    onUpdate: () => console.log('[SW] New content available; please refresh'),
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
);
