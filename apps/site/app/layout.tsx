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
        <RootProvider
          search={{
            enabled: true,
            options: {
              type: 'static',
            },
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}

export const metadata = {
  title: {
    default: 'ObjectOS - The Enterprise Low-Code Runtime Engine',
    template: '%s | ObjectOS',
  },
  description:
    'The Business Operating System. Instant Backend. Security Kernel. Workflow Automation. Turn YAML schemas into secure, scalable APIs built on ObjectQL & NestJS.',
  keywords: [
    'ObjectOS',
    'Low-Code',
    'Enterprise',
    'Runtime Engine',
    'RBAC',
    'Workflow',
    'NestJS',
    'ObjectQL',
    'Metadata-Driven',
  ],
  authors: [{ name: 'ObjectOS Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://objectos.dev',
    title: 'ObjectOS - The Enterprise Low-Code Runtime Engine',
    description:
      'The Business Operating System. Instant Backend. Security Kernel. Workflow Automation.',
    siteName: 'ObjectOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ObjectOS - The Enterprise Low-Code Runtime Engine',
    description:
      'The Business Operating System. Instant Backend. Security Kernel. Workflow Automation.',
  },
};
