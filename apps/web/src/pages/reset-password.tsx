import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await authClient.resetPassword({
        newPassword: password,
        token,
      });
      setSuccess(true);
      setTimeout(() => navigate('/sign-in'), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout
        title="Invalid Link"
        subtitle="This password reset link is invalid or has expired"
        alternativeLink={{
          text: 'Need a new link?',
          linkText: 'Request password reset',
          href: '/forgot-password',
        }}
      >
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-8 text-center">
          <p className="text-sm text-destructive">
            The reset token is missing. Please request a new password reset link.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Enter your new password below"
      alternativeLink={{
        text: 'Remember your password?',
        linkText: 'Sign in',
        href: '/sign-in',
      }}
    >
      {success ? (
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-8 text-center">
          <CheckCircle2 className="size-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Password Reset</h3>
          <p className="text-sm text-muted-foreground">
            Your password has been successfully reset. Redirecting to sign in…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Resetting…' : 'Reset Password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
