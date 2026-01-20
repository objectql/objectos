import Link from 'next/link';
import { ArrowRight, Database, Layout, Cog, Shield, Zap, Globe } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 border-b border-border">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Zap className="w-4 h-4" />
              <span>Post-SaaS Operating System</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Object<span className="text-primary">Stack</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto">
              The Universal Protocol for Enterprise Software
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Decouple data from storage. Separate logic from implementation. 
              Build systems that outlast frameworks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://github.com/objectstack-ai/objectos"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-border font-semibold hover:bg-accent transition-colors"
              >
                View on GitHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Trinity Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">The Core Trinity</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three open-source pillars. One unified architecture. Infinite possibilities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* ObjectQL - The Engine */}
            <div className="group relative p-8 rounded-xl border border-border bg-card hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">ObjectQL</h3>
              </div>
              <p className="text-sm text-primary font-semibold mb-2">The Engine</p>
              <p className="text-muted-foreground mb-4">
                The Metadata-Driven Data Engine. Abstract storage layers—SQL, NoSQL, or Excel—with a universal protocol.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Universal adapters for any database</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Metadata-driven schema evolution</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Zero vendor lock-in</span>
                </div>
              </div>
              <Link 
                href="/docs/objectql"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-4 text-sm font-medium"
              >
                Learn more <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* ObjectUI - The Components */}
            <div className="group relative p-8 rounded-xl border border-border bg-card hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">ObjectUI</h3>
              </div>
              <p className="text-sm text-primary font-semibold mb-2">The Components</p>
              <p className="text-muted-foreground mb-4">
                The Enterprise Interface Kit. Server-driven UI that adapts automatically to your data schema.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Zero API glue code</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Backend changes reflect instantly</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Framework-agnostic components</span>
                </div>
              </div>
              <Link 
                href="/docs/objectui"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-4 text-sm font-medium"
              >
                Learn more <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* ObjectOS - The Platform */}
            <div className="group relative p-8 rounded-xl border border-border bg-card hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Cog className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">ObjectOS</h3>
              </div>
              <p className="text-sm text-primary font-semibold mb-2">The Platform</p>
              <p className="text-muted-foreground mb-4">
                The Low-Code Kernel. Orchestrate identity, workflows, and local-first synchronization.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Enterprise RBAC & audit logging</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>State machine workflows</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Offline-first sync protocol</span>
                </div>
              </div>
              <Link 
                href="/docs/objectos"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-4 text-sm font-medium"
              >
                Learn more <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Why ObjectStack?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Protect your investment. Future-proof your architecture.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Asset Longevity</h3>
              </div>
              <p className="text-muted-foreground">
                <strong>Metadata-Driven Design:</strong> Don't hardcode business logic. Define it in schemas. 
                Your intellectual property survives the next tech cycle.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Data Sovereignty</h3>
              </div>
              <p className="text-muted-foreground">
                <strong>Universal Drivers:</strong> Connect to Oracle today, switch to Postgres tomorrow, 
                mount an Excel sheet meanwhile. Zero migration scripts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Infinite Extensibility</h3>
              </div>
              <p className="text-muted-foreground">
                <strong>Server-Driven UI:</strong> Backend changes instantly reflect on the frontend. 
                No "API glue code." Accelerate development velocity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Polyglot & Agnostic Section */}
      <section className="py-24 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Storage Agnostic. Framework Independent.</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              ObjectStack treats <strong>Excel</strong>, <strong>Redis</strong>, and <strong>Postgres</strong> as equal citizens. 
              Connect to any data source through universal drivers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { id: 'postgresql', name: 'PostgreSQL' },
              { id: 'mongodb', name: 'MongoDB' },
              { id: 'redis', name: 'Redis' },
              { id: 'mysql', name: 'MySQL' },
              { id: 'oracle', name: 'Oracle' },
              { id: 'excel', name: 'Excel' },
              { id: 'sqlite', name: 'SQLite' },
              { id: 'custom', name: 'Custom' }
            ].map((db) => (
              <div key={db.id} className="p-6 rounded-lg border border-border bg-card text-center">
                <p className="font-semibold">{db.name}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            React changes every 3 years. <strong>ObjectQL Protocols last for decades.</strong> 
            Build anti-fragile systems that survive framework fatigue.
          </p>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">The Ecosystem</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From open source to enterprise. Build, deploy, and scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl border border-border bg-card">
              <h3 className="text-xl font-bold mb-2">Object Marketplace</h3>
              <p className="text-muted-foreground mb-4">
                Drivers, templates, and apps. Extend your stack with community and commercial plugins.
              </p>
              <span className="text-primary text-sm font-medium" aria-disabled="true">
                Coming Soon
              </span>
            </div>

            <div className="p-8 rounded-xl border border-border bg-card">
              <h3 className="text-xl font-bold mb-2">Object Cloud</h3>
              <p className="text-muted-foreground mb-4">
                Serverless PaaS for hosting ObjectStack. Deploy in seconds.
              </p>
              <span className="text-primary text-sm font-medium" aria-disabled="true">
                Coming Soon
              </span>
            </div>

            <div className="p-8 rounded-xl border border-border bg-card">
              <h3 className="text-xl font-bold mb-2">Enterprise Edition</h3>
              <p className="text-muted-foreground mb-4">
                Governance, SSO, and audit logs. Community gives you the engine; Enterprise gives you guardrails.
              </p>
              <Link href="https://github.com/objectstack-ai/objectos/issues" className="text-primary hover:underline text-sm font-medium">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Start Building the Future
          </h2>
          <p className="text-lg text-muted-foreground">
            Open source. MIT Licensed. Production ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Read Documentation
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="https://github.com/objectstack-ai/objectos"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-border font-semibold hover:bg-accent transition-colors"
            >
              Star on GitHub
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
