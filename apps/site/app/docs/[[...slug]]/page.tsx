import { notFound } from 'next/navigation';
import { docs } from '../../../.source/server';

export const dynamicParams = false;

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const slug = params.slug || [];
  const path = slug.length === 0 ? 'index.mdx' : `${slug.join('/')}.mdx`;
  
  // Find the page in docs array
  const page = (docs as any[]).find((doc: any) => {
    const docPath = doc.path || doc.url || '';
    return docPath === path || docPath.endsWith(`/${path}`) || docPath === slug.join('/');
  });
  
  if (!page) {
    console.error('Page not found for path:', path, 'Available docs:', docs);
    notFound();
  }
  
  const MDX = page.data?.exports?.default;
  const title = page.data?.title || 'Untitled';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <div className="prose prose-gray max-w-none dark:prose-invert">
        {MDX && <MDX />}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  // Manually list all documentation pages
  const pages = [
    { slug: [] }, // index
    { slug: ['guide'] },
    { slug: ['guide', 'architecture'] },
    { slug: ['guide', 'contributing-development'] },
    { slug: ['guide', 'data-modeling'] },
    { slug: ['guide', 'development-plan'] },
    { slug: ['guide', 'logic-actions'] },
    { slug: ['guide', 'logic-hooks'] },
    { slug: ['guide', 'platform-components'] },
    { slug: ['guide', 'sdk-reference'] },
    { slug: ['guide', 'security-guide'] },
    { slug: ['guide', 'ui-framework'] },
    { slug: ['spec'] },
    { slug: ['spec', 'http-protocol'] },
    { slug: ['spec', 'metadata-format'] },
    { slug: ['spec', 'query-language'] },
  ];
  
  return pages;
}
