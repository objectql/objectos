import { source } from '@/lib/source';
import { notFound } from 'next/navigation';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

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
      <div className="prose prose-gray max-w-none">
        {MDX && <MDX />}
      </div>
    </div>
  );
}
