import { docs } from '../../.source/server';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { pageTree } from '@/lib/page-tree';
import Image from 'next/image';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: (
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="ObjectOS Logo"
              width={24}
              height={24}
            />
            <span className="font-bold">ObjectOS</span>
          </div>
        ),
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
