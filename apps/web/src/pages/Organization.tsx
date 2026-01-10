import { useEffect, useState } from 'react';
import { Card, Input, Label, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@objectos/ui';
import { useAuth } from '../context/AuthContext';
import { authClient } from '../lib/auth';

export default function Organization() {
    const { session } = useAuth();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [activeOrg, setActiveOrg] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Org Form
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgSlug, setNewOrgSlug] = useState('');

    // Invite Member Form
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('user');

    useEffect(() => {
        loadOrganizations();
    }, [session?.activeOrganizationId]);

    const loadOrganizations = async () => {
        try {
            const { data: orgs } = await authClient.organization.list();
            setOrganizations(orgs || []);
            
            if (session?.activeOrganizationId) {
                const current = orgs?.find(o => o.id === session.activeOrganizationId);
                setActiveOrg(current);
                if (current) loadMembers();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        // listMembers uses the current active organization from session/headers
        const { data } = await authClient.organization.listMembers();
        setMembers(data?.members || []);
    };

    const createOrg = async () => {
        const { data, error } = await authClient.organization.create({
            name: newOrgName,
            slug: newOrgSlug
        });
        if (error) alert(error.message);
        if (data) {
            await authClient.organization.setActive({ organizationId: data.id });
            window.location.reload(); // Simple reload to refresh context
        }
    };

    const inviteMember = async () => {
        if (!activeOrg) return;
        const { data, error } = await authClient.organization.inviteMember({
            email: inviteEmail,
            role: inviteRole as "member" | "admin" | "owner",
        });
        if (error) alert(error.message);
        if (data) {
            setInviteEmail('');
            alert('Invitation sent!');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Organization Management</h1>
                {!activeOrg && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Create Organization</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Organization</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={newOrgName} onChange={e => setNewOrgName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input id="slug" value={newOrgSlug} onChange={e => setNewOrgSlug(e.target.value)} />
                                </div>
                                <Button onClick={createOrg}>Create</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {!activeOrg ? (
                <Card className="p-6">
                    <p className="text-muted-foreground">You are not currently in an active organization.</p>
                    {organizations.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <Label>Your Organizations:</Label>
                            <div className="flex gap-2 flex-wrap">
                                {organizations.map(org => (
                                    <Button key={org.id} variant="outline" onClick={async () => {
                                        await authClient.organization.setActive({ organizationId: org.id });
                                        window.location.reload();
                                    }}>
                                        Switch to {org.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            ) : (
                <>
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">{activeOrg.name}</h2>
                                <p className="text-sm text-muted-foreground">Slug: {activeOrg.slug}</p>
                            </div>
                            <Button variant="outline" onClick={async () => {
                                await authClient.organization.setActive({ organizationId: null });
                                window.location.reload();
                            }}>
                                Exit Organization
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Members</h2>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button size="sm">Invite Member</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite Member</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Input id="role" value={inviteRole} onChange={e => setInviteRole(e.target.value)} />
                                        </div>
                                        <Button onClick={inviteMember}>Send Invitation</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map(member => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.user.name}</TableCell>
                                        <TableCell>{member.user.email}</TableCell>
                                        <TableCell>{member.role}</TableCell>
                                        <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </>
            )}
        </div>
    );
}
