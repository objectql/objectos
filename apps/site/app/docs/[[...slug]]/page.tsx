import { source } from '@/lib/source';
import { DocsBody, DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  const MDX = (page.data as any)._exports?.default || (page.data as any).exports?.default;
  const githubPath = params.slug
    ? `apps/site/content/docs/${params.slug.join('/')}.mdx`
    : 'apps/site/content/docs/index.mdx';

  return (
    <DocsPage
      toc={(page.data as any).toc ?? []}
      full={false}
      footer={{
        children: (
          <a
            href={`https://github.com/objectstack-ai/objectos/blob/main/${githubPath}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit this page on GitHub
          </a>
        ),
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
