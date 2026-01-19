import { source } from '@/lib/source';
import { DocsPage, DocsBody } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = (page.data as any).exports?.default;

  return (
    <DocsPage 
      toc={(page.data as any).toc || []} 
      full={(page.data as any).full}
    >
      <DocsBody>
        <h1>{page.data.title || 'Untitled'}</h1>
        {MDX && <MDX />}
      </DocsBody>
    </DocsPage>
  );
}
