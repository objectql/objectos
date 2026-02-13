import { useState, useEffect, useCallback } from 'react';
import { organization, useActiveOrganization } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Mail, Check, X, Ban } from 'lucide-react';

interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected' | 'canceled';
  expiresAt: Date | string;
  createdAt: Date | string;
  inviterId: string;
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'secondary' as const;
    case 'accepted':
      return 'default' as const;
    case 'rejected':
    case 'canceled':
      return 'outline' as const;
    default:
      return 'outline' as const;
  }
};

export default function InvitationsPage() {
  const { data: activeOrg } = useActiveOrganization();
  const [orgInvitations, setOrgInvitations] = useState<Invitation[]>([]);
  const [userInvitations, setUserInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch invitations for the current user (across all orgs)
      const userRes = await organization.listUserInvitations();
      setUserInvitations((userRes.data as Invitation[]) || []);

      // Fetch invitations for the active org (if any)
      if (activeOrg?.id) {
        const orgRes = await organization.listInvitations({
          query: { organizationId: activeOrg.id },
        });
        setOrgInvitations((orgRes.data as Invitation[]) || []);
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleAccept = async (invitationId: string) => {
    try {
      await organization.acceptInvitation({ invitationId });
      await fetchInvitations();
    } catch (err) {
      console.error('Failed to accept invitation:', err);
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      await organization.rejectInvitation({ invitationId });
      await fetchInvitations();
    } catch (err) {
      console.error('Failed to reject invitation:', err);
    }
  };

  const handleCancel = async (invitationId: string) => {
    try {
      await organization.cancelInvitation({ invitationId });
      await fetchInvitations();
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingUserInvitations = userInvitations.filter((inv) => inv.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Invitations</h2>
        <p className="text-muted-foreground">Manage organization invitations.</p>
      </div>

      {/* Pending invitations for the current user */}
      {pendingUserInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              Your Pending Invitations
            </CardTitle>
            <CardDescription>
              You have been invited to join the following organizations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUserInvitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{inv.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => handleAccept(inv.id)}>
                          <Check className="size-4" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(inv.id)}>
                          <X className="size-4" />
                          Decline
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Org-level invitations (admin view) */}
      {activeOrg && (
        <Card>
          <CardHeader>
            <CardTitle>Invitations for {activeOrg.name}</CardTitle>
            <CardDescription>All invitations sent from this organization.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {orgInvitations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No invitations found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgInvitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{inv.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {inv.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleCancel(inv.id)}
                            title="Cancel invitation"
                          >
                            <Ban className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
