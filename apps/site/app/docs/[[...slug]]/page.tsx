import { source } from '@/lib/source';
import { DocsBody, DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  const MDX = (page.data as any)._exports?.default || (page.data as any).exports?.default;

  return (
    <DocsPage 
      toc={(page.data as any).toc ?? []}
      full={false}
      lastUpdate={page.data.lastModified}
      editOnGithub={{
        owner: 'objectstack-ai',
        repo: 'objectos',
        path: `apps/site/content/docs/${page.file.path}`,
      }}
    >
      <DocsBody>
        <h1>{page.data.title}</h1>
        {MDX && <MDX />}
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description ?? '',
  };
}
