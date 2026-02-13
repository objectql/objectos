import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '../layout.config';
import type { ReactNode } from 'react';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
