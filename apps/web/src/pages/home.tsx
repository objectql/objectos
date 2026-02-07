import { Link, Navigate } from 'react-router-dom';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Blocks, ShieldCheck, Users, GitBranch, Lock, Mail, Loader2 } from 'lucide-react';

const features = [
  { icon: Mail, label: 'Email & Password Authentication' },
  { icon: Users, label: 'Organization Management' },
  { icon: ShieldCheck, label: 'Role-Based Access Control (RBAC)' },
  { icon: GitBranch, label: 'Team Collaboration' },
  { icon: Lock, label: 'Secure Session Management' },
];

export default function HomePage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Already logged in → go straight to settings
  if (session?.user) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center">
            <Blocks className="size-7 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-4 text-foreground tracking-tight">
          Welcome to ObjectOS
        </h1>
        <p className="text-xl mb-8 text-muted-foreground">
          A Business Operating System for the ObjectStack Ecosystem
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg">
            <Link to="/sign-in">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/sign-up">Sign Up</Link>
          </Button>
        </div>

        <Card className="mt-12 text-left">
          <CardHeader>
            <CardTitle className="text-2xl">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-muted-foreground">
                  <Icon className="size-5 text-primary shrink-0" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
