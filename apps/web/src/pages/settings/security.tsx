import { useState, useEffect, useCallback } from 'react';
import { useSession, twoFactor, authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Shield, ShieldCheck, ShieldOff, Monitor, Smartphone, Globe } from 'lucide-react';

interface Session {
  id: string;
  token: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date | string;
  expiresAt: Date | string;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDeviceIcon(ua?: string) {
  if (!ua) return <Globe className="size-4" />;
  if (/mobile|android|iphone/i.test(ua)) return <Smartphone className="size-4" />;
  return <Monitor className="size-4" />;
}

function getDeviceName(ua?: string) {
  if (!ua) return 'Unknown Device';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Edge/i.test(ua)) return 'Edge';
  return 'Browser';
}

export default function SecuritySettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as
    | { id: string; name: string; email: string; twoFactorEnabled?: boolean }
    | undefined;

  // 2FA state
  const [showSetup, setShowSetup] = useState(false);
  const [totpURI, setTotpURI] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [enabling2FA, setEnabling2FA] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [error2FA, setError2FA] = useState('');

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const res = await authClient.listSessions();
      setSessions((res.data as Session[]) || []);
    } catch {
      // Sessions listing may not be available
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  if (!user) return null;

  const handleEnable2FA = async () => {
    setEnabling2FA(true);
    setError2FA('');
    try {
      const res = await twoFactor.enable({
        password: '', // Not required for TOTP setup initiation in better-auth
      });
      if (res.data) {
        setTotpURI(res.data.totpURI || '');
        setBackupCodes(res.data.backupCodes || []);
        setShowSetup(true);
      }
    } catch (err: any) {
      setError2FA(err?.message || 'Failed to enable 2FA');
    } finally {
      setEnabling2FA(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnabling2FA(true);
    setError2FA('');
    try {
      await twoFactor.verifyTotp({ code: verifyCode });
      setShowSetup(false);
      setVerifyCode('');
      // Refresh session to reflect 2FA status
      window.location.reload();
    } catch (err: any) {
      setError2FA(err?.message || 'Invalid verification code');
    } finally {
      setEnabling2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    setDisabling2FA(true);
    setError2FA('');
    try {
      await twoFactor.disable({ password: disablePassword });
      setShowDisableDialog(false);
      setDisablePassword('');
      window.location.reload();
    } catch (err: any) {
      setError2FA(err?.message || 'Failed to disable 2FA');
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleRevokeSession = async (sessionToken: string) => {
    setRevokingSession(sessionToken);
    try {
      await authClient.revokeSession({ token: sessionToken });
      setSessions((prev) => prev.filter((s) => s.token !== sessionToken));
    } catch {
      // ignore
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setRevokingAll(true);
    try {
      await authClient.revokeOtherSessions();
      await loadSessions();
    } catch {
      // ignore
    } finally {
      setRevokingAll(false);
    }
  };

  const currentSessionToken = session?.session?.token;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Security</h2>
        <p className="text-muted-foreground">
          Manage two-factor authentication and active sessions.
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account using TOTP.
              </CardDescription>
            </div>
            {user.twoFactorEnabled ? (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <ShieldCheck className="size-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <ShieldOff className="size-3 mr-1" />
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error2FA && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error2FA}
            </div>
          )}

          {user.twoFactorEnabled ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication.
              </p>
              <Button variant="destructive" size="sm" onClick={() => setShowDisableDialog(true)}>
                Disable 2FA
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Protect your account by requiring a verification code on sign in.
              </p>
              <Button onClick={handleEnable2FA} disabled={enabling2FA}>
                {enabling2FA && <Loader2 className="size-4 animate-spin" />}
                Enable 2FA
              </Button>
            </div>
          )}

          {/* 2FA Setup Dialog */}
          {showSetup && (
            <div className="mt-6 space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Set Up Authenticator App</h4>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  1. Install an authenticator app (e.g. Google Authenticator, Authy).
                </p>
                <p className="text-sm text-muted-foreground">
                  2. Scan the QR code or enter the secret manually:
                </p>
              </div>

              {totpURI && (
                <div className="flex flex-col items-center gap-4 rounded-lg bg-muted p-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpURI)}`}
                    alt="TOTP QR Code"
                    className="size-48 rounded"
                  />
                  <code className="break-all text-xs text-muted-foreground max-w-sm text-center">
                    {totpURI}
                  </code>
                </div>
              )}

              {backupCodes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Backup Codes</p>
                  <p className="text-sm text-muted-foreground">
                    Save these codes somewhere safe. Each can be used once.
                  </p>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3">
                    {backupCodes.map((code, i) => (
                      <code key={i} className="text-sm font-mono">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <form onSubmit={handleVerify2FA} className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  3. Enter the 6-digit code from your authenticator app to verify:
                </p>
                <div className="flex gap-2">
                  <Input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="w-32 font-mono text-center tracking-widest"
                  />
                  <Button type="submit" disabled={enabling2FA || verifyCode.length !== 6}>
                    {enabling2FA && <Loader2 className="size-4 animate-spin" />}
                    Verify & Enable
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to confirm disabling 2FA. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Password</Label>
              <Input
                id="disable-password"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={disabling2FA || !disablePassword}
            >
              {disabling2FA && <Loader2 className="size-4 animate-spin" />}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="size-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>Manage your active sessions across devices.</CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAllOther}
                disabled={revokingAll}
              >
                {revokingAll && <Loader2 className="size-4 animate-spin" />}
                Revoke All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active sessions found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead className="hidden sm:table-cell">IP Address</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => {
                  const isCurrent = s.token === currentSessionToken;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(s.userAgent)}
                          <span className="text-sm">{getDeviceName(s.userAgent)}</span>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {s.ipAddress || '—'}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {formatDate(s.createdAt)}
                      </TableCell>
                      <TableCell>
                        {!isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeSession(s.token)}
                            disabled={revokingSession === s.token}
                          >
                            {revokingSession === s.token ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              'Revoke'
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
