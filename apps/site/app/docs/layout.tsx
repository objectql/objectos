import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: 'ObjectOS',
        url: '/',
      }}
      links={[
        {
          text: 'GitHub',
          url: 'https://github.com/objectstack-ai/objectos',
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
