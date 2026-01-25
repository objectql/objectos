import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from './layout.config';
import { Shield, Zap, Cog, Lock, Workflow, Database, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <HomeLayout {...baseOptions}>
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 border-b border-border">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Zap className="w-4 h-4" />
              <span>Enterprise Low-Code Runtime Engine</span>
            </div>
            
            {/* Preview Release Notice */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-base font-semibold border border-green-500/30 shadow-lg">
              <span className="animate-pulse">🚀</span>
              <span>Preview Version Coming March 2026</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Object<span className="text-primary">OS</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto">
              The Business Operating System
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Instant Backend. Security Kernel. Workflow Automation. 
              Built on <Link href="https://github.com/objectql/objectql" className="text-primary hover:underline">ObjectQL</Link> & NestJS.
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

      {/* Introduction */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              The Operating System for Enterprise Data
            </h2>
            <p className="text-lg text-muted-foreground">
              ObjectOS is a production-ready, metadata-driven runtime platform. 
              While <strong>ObjectQL</strong> defines <em>how data looks</em>, <strong>ObjectOS</strong> defines <em>how business runs</em>.
            </p>
            <p className="text-lg text-muted-foreground">
              Instantly turn static YAML schemas into secure, scalable, and compliant APIs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">The Enforcer</h3>
              </div>
              <p className="text-muted-foreground">
                Intercepts every request to enforce RBAC (Role-Based Access Control) and Record-Level Security (RLS).
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">The Server</h3>
              </div>
              <p className="text-muted-foreground">
                Automatically serves REST, GraphQL, and JSON-RPC APIs for Object UI.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Workflow className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">The Automator</h3>
              </div>
              <p className="text-muted-foreground">
                Runs server-side triggers, workflows, and scheduled jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Key Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build enterprise applications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Enterprise Security Kernel */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Enterprise Security Kernel</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                ObjectOS doesn't just read data; it protects it.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Authentication:</strong> Integrated OIDC, SAML, and LDAP support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Fine-Grained Permission:</strong> Field-level and record-level sharing rules</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Audit Logging:</strong> Built-in tracking of who did what and when</span>
                </li>
              </ul>
            </div>

            {/* Instant API Gateway */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Instant API Gateway</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Stop writing boilerplate controllers.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Auto-generated REST API:</strong> Works out-of-the-box</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Auto-generated GraphQL:</strong> Instant schema stitching</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Metadata API:</strong> Serves UI configuration to frontend clients</span>
                </li>
              </ul>
            </div>

            {/* Workflow & Automation */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Workflow className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Workflow & Automation</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Business logic that adapts to your needs.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Triggers:</strong> Run code beforeInsert, afterUpdate, beforeDelete</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Flow Engine:</strong> Visual workflow execution (BPMN-style)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Job Queue:</strong> Background task processing based on Redis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Built as a Modular Monorepo</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ObjectOS is built with NestJS and organized into focused packages.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: '@objectos/kernel', role: 'The Brain', desc: 'Core logic engine. Wraps ObjectQL, manages plugins, and handles the event bus.' },
              { name: '@objectos/server', role: 'The Gateway', desc: 'NestJS application layer. Handles HTTP/WS traffic, Middlewares, and Guards.' },
              { name: '@objectos/plugin-auth', role: 'Auth', desc: 'Authentication strategies (Local, OAuth2, Enterprise SSO).' },
              { name: '@objectos/plugin-workflow', role: 'Logic', desc: 'Workflow engine and trigger runner.' },
              { name: '@objectos/presets', role: 'Config', desc: 'Standard system objects (_users, _roles, _audit_log).' }
            ].map((pkg) => (
              <div key={pkg.name} className="p-6 rounded-lg border border-border bg-card">
                <code className="text-sm font-mono text-primary">{pkg.name}</code>
                <h4 className="font-bold mt-2 mb-1">{pkg.role}</h4>
                <p className="text-sm text-muted-foreground">{pkg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Start Building with ObjectOS
          </h2>
          <p className="text-lg text-muted-foreground">
            Open source. AGPL v3 Licensed. Production ready.
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
    </HomeLayout>
  );
}
