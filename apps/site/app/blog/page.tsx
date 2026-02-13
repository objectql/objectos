import Link from 'next/link';
import { blog } from '@/lib/source';

export default function BlogIndex() {
  const posts = [...blog].sort((a, b) => {
    const dateA = (a as any).date;
    const dateB = (b as any).date;
    if (!dateA || !dateB) return 0;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <main className="container max-w-4xl mx-auto py-12 px-4">
      <div className="flex flex-col gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground text-lg">
            Latest updates and insights from the ObjectOS team.
          </p>
        </div>

        <div className="grid gap-8">
          {posts.map((post) => (
            <Link
              key={post.url}
              href={post.url}
              className="flex flex-col gap-2 p-6 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              <h2 className="text-2xl font-bold">{(post as any).title}</h2>
              {(post as any).description && (
                <p className="text-muted-foreground">{(post as any).description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                {(post as any).date && timeElement((post as any).date)}
                {(post as any).author && <span>By {(post as any).author}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

function timeElement(date: string | Date) {
  const d = new Date(date);
  return (
    <time dateTime={d.toISOString()}>
      {d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </time>
  );
}
