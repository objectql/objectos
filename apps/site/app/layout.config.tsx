import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export const baseOptions: BaseLayoutProps = {
  nav: {
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
  },
  links: [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
    {
      text: 'Blog',
      url: '/blog',
      active: 'nested-url',
    },
    {
      text: 'GitHub',
      url: 'https://github.com/objectstack-ai/objectos',
    },
  ],
};
