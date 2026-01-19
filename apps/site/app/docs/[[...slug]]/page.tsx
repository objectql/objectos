import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamicParams = false;

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  try {
    const params = await props.params;
    const page = source.getPage(params.slug);
    
    if (!page) {
      return {};
    }

    return {
      title: page.data.title || 'Documentation',
      description: page.data.description || undefined,
    };
  } catch (error) {
    console.error('Error in generateMetadata:', error);
    return {};
  }
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = (page.data as any).exports?.default;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">{page.data.title || 'Untitled'}</h1>
      {page.data.description && (
        <p className="text-lg text-gray-600 mb-6">{page.data.description}</p>
      )}
      <div className="prose prose-gray max-w-none">
        {MDX && <MDX />}
      </div>
    </div>
  );
}
