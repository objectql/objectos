import { source } from '@/lib/source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <a href="/" className="text-xl font-bold">ObjectOS</a>
        </div>
      </nav>
      <div className="container mx-auto px-4">
        <div className="flex">
          <aside className="w-64 py-8">
            {/* Sidebar navigation would go here */}
            <div className="text-sm">
              <a href="/docs/guide" className="block py-1">Guide</a>
              <a href="/docs/spec" className="block py-1">Specifications</a>
            </div>
          </aside>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
