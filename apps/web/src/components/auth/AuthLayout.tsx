import { Link } from 'react-router-dom';
import { Blocks } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  image?: string;
  alternativeLink?: {
    text: string;
    linkText: string;
    href: string;
  };
}

export function AuthLayout({ children, title, subtitle, alternativeLink }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side — form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-[480px] border-r border-border">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
                <Blocks className="size-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">ObjectOS</span>
            </Link>

            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div>{children}</div>

          {alternativeLink && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {alternativeLink.text}{' '}
              <Link
                to={alternativeLink.href}
                className="font-medium text-primary hover:text-primary/80"
              >
                {alternativeLink.linkText}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right side — hero */}
      <div className="hidden lg:flex relative flex-1 bg-muted items-center justify-center p-20">
        <div className="max-w-lg text-center space-y-6">
          <div className="rounded-2xl bg-card shadow-2xl overflow-hidden p-2 border rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="aspect-[4/3] bg-gradient-to-br from-primary/80 to-primary rounded-xl flex items-center justify-center">
              <Blocks className="size-24 text-primary-foreground/50" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              The Business Operating System
            </h3>
            <p className="text-muted-foreground">
              Manage your organization's data, workflows, and identity in one unified platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
