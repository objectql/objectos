import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">
          Object<span className="text-primary">OS</span>
        </h1>
        <p className="text-2xl text-muted-foreground font-medium">
          The Business Operating System
        </p>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Orchestrate Identity, Workflows, and Local-First Sync in one unified runtime. 
          The Kernel for your Enterprise.
        </p>
        <div className="flex gap-4 justify-center pt-8">
          <Link
            href="/docs"
            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/docs/guide/architecture"
            className="px-8 py-3 rounded-lg border border-border font-semibold hover:bg-accent transition-colors"
          >
            Architecture
          </Link>
        </div>
      </div>
    </main>
  );
}
