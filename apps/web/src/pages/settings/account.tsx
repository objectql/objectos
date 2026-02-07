import { useState } from 'react';
import { useSession, authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Check, User, Mail, Shield } from 'lucide-react';

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as
    | { id: string; name: string; email: string; role?: string; twoFactorEnabled?: boolean }
    | undefined;

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      await authClient.updateUser({ name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">Manage your profile, password, and security preferences.</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Input id="email" value={user.email} disabled className="opacity-60" />
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Role:</span>
              <Badge variant="secondary">{user.role || 'user'}</Badge>
              {user.twoFactorEnabled && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <Shield className="size-3 mr-1" />
                    2FA Enabled
                  </Badge>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saved && <Check className="size-4" />}
                {saving ? 'Saving…' : saved ? 'Saved' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-600 dark:text-green-400">
                Password changed successfully.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading && <Loader2 className="size-4 animate-spin" />}
                {passwordLoading ? 'Changing…' : 'Change Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
