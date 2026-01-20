import { source } from '@/lib/source';
import { DocsBody, DocsPage } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  const MDX = (page.data as any)._exports?.default || (page.data as any).exports?.default;

  return (
    <DocsPage toc={(page.data as any).toc}>
      <DocsBody>
        <h1>{page.data.title}</h1>
        {MDX && <MDX />}
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  const pages = source.getPages();
  
  // Fallback if no pages found
  if (!pages || pages.length === 0) {
    return [{ slug: [] }];
  }
  
  return pages.map((page) => ({
    slug: page.slugs,
  }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
