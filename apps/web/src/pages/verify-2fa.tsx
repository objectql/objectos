import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { twoFactor } from '@/lib/auth-client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield } from 'lucide-react';

export default function Verify2FAPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackup, setUseBackup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (useBackup) {
        await twoFactor.verifyBackupCode(
          { code },
          {
            onSuccess: () => navigate('/settings'),
            onError: (ctx) => {
              setError(ctx.error.message || 'Invalid backup code');
              setLoading(false);
            },
          },
        );
      } else {
        await twoFactor.verifyTotp(
          { code },
          {
            onSuccess: () => navigate('/settings'),
            onError: (ctx) => {
              setError(ctx.error.message || 'Invalid verification code');
              setLoading(false);
            },
          },
        );
      }
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Two-Factor Verification"
      subtitle={useBackup ? 'Enter a backup code' : 'Enter the code from your authenticator app'}
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="size-8 text-primary" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">
              {useBackup ? 'Backup Code' : 'Verification Code'}
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={useBackup ? 'Enter backup code' : '000000'}
              maxLength={useBackup ? 20 : 6}
              className={useBackup ? '' : 'font-mono text-center tracking-widest'}
              autoFocus
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (!useBackup && code.length !== 6)}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Verifying…' : 'Verify'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setUseBackup(!useBackup);
              setCode('');
              setError('');
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {useBackup ? 'Use authenticator app instead' : 'Use a backup code instead'}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
