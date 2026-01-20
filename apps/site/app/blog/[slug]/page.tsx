import { blog } from '@/lib/source';
import { notFound } from 'next/navigation';
import { DocsBody } from 'fumadocs-ui/layouts/docs/page';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blog.find((post) => post.slug === slug);

  if (!post) notFound();

  // Handle MDX content retrieval safely
  const MDX = (post as any).body;

  return (
    <main className="container max-w-3xl mx-auto py-12 px-4">
      <Link 
        href="/blog" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <article>
        <header className="mb-8 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{(post as any).title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {(post as any).date && (
               <time dateTime={new Date((post as any).date).toISOString()}>
                  {new Date((post as any).date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })}
              </time>
            )}
            {(post as any).author && <span>• By {(post as any).author}</span>}
          </div>
        </header>
        
        <DocsBody className="text-foreground">
          {MDX ? <MDX /> : <p>No content found</p>}
        </DocsBody>
      </article>
    </main>
  );
}

export function generateStaticParams() {
    return blog.map((post) => ({
        slug: post.slug,
    }));
}
