import './global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}

export const metadata = {
  title: {
    default: 'ObjectStack - The Universal Protocol for Enterprise Software',
    template: '%s | ObjectStack',
  },
  description: 'Post-SaaS Operating System. Decouple data from storage. Separate logic from implementation. ObjectQL, ObjectUI, and ObjectOS—the core trinity for building systems that outlast frameworks.',
  keywords: ['ObjectStack', 'ObjectQL', 'ObjectUI', 'ObjectOS', 'Low-Code', 'Metadata-Driven', 'Enterprise Software', 'Post-SaaS'],
  authors: [{ name: 'ObjectStack Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://objectstack.ai',
    title: 'ObjectStack - The Universal Protocol for Enterprise Software',
    description: 'Post-SaaS Operating System. Build systems that outlast frameworks with ObjectQL, ObjectUI, and ObjectOS.',
    siteName: 'ObjectStack',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ObjectStack - The Universal Protocol for Enterprise Software',
    description: 'Post-SaaS Operating System. Build systems that outlast frameworks.',
  },
};
