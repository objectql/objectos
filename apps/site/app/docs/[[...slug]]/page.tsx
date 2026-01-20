import { notFound } from 'next/navigation';
import { docs } from '../../../.source/server';
import { DocsPage, DocsBody } from 'fumadocs-ui/page';

export const dynamicParams = false;

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const slug = params.slug || [];
  const path = slug.length === 0 ? 'index.mdx' : `${slug.join('/')}.mdx`;
  
  // Find the page in docs array
  const page = (docs as any[]).find((doc: any) => {
    const docPath = doc.info?.path || '';
    return docPath === path || docPath === slug.join('/') + '.mdx';
  });
  
  if (!page) {
    console.error('Page not found for path:', path);
    notFound();
  }
  
  const MDX = page._exports?.default;
  const title = page.title || 'Untitled';
  const toc = page.toc || [];

  return (
    <DocsPage toc={toc} full={false}>
      <DocsBody>
        <h1>{title}</h1>
        {MDX && <MDX />}
      </DocsBody>
    </DocsPage>
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
