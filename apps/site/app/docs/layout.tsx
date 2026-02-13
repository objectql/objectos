import { docs } from '../../.source/server';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { pageTree } from '@/lib/page-tree';
import { baseOptions } from '../layout.config';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      {...baseOptions}
      sidebar={{
        collapsible: true,
        defaultOpenLevel: 0,
      }}
    >
      {children}
    </DocsLayout>
  );
}
