import { useState, useEffect, useCallback } from 'react';
import { organization, useActiveOrganization } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Plus, MoreHorizontal, Users, Trash2 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date | string;
}

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  user?: {
    name: string;
    email: string;
  };
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TeamsPage() {
  const activeOrg = useActiveOrganization();
  const orgId = (activeOrg.data as any)?.id;

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create team state
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  // Team members state
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Add member state
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const loadTeams = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await organization.listTeams({ query: { organizationId: orgId } });
      setTeams((res.data as Team[]) || []);
    } catch {
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newTeamName.trim()) return;
    setCreating(true);
    try {
      await organization.createTeam({
        name: newTeamName.trim(),
        organizationId: orgId,
      });
      setNewTeamName('');
      setShowCreate(false);
      await loadTeams();
    } catch (err: any) {
      setError(err?.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await organization.removeTeam({ teamId, organizationId: orgId } as any);
      await loadTeams();
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setTeamMembers([]);
      }
    } catch {
      setError('Failed to delete team');
    }
  };

  const loadTeamMembers = async (team: Team) => {
    setSelectedTeam(team);
    setLoadingMembers(true);
    try {
      const res = await organization.listTeamMembers({ query: { teamId: team.id } });
      setTeamMembers((res.data || []) as unknown as TeamMember[]);
    } catch {
      setTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !addMemberEmail.trim()) return;
    setAddingMember(true);
    try {
      await organization.addTeamMember({
        teamId: selectedTeam.id,
        userId: addMemberEmail.trim(),
      });
      setAddMemberEmail('');
      await loadTeamMembers(selectedTeam);
    } catch (err: any) {
      setError(err?.message || 'Failed to add member to team');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!selectedTeam) return;
    try {
      await organization.removeTeamMember({
        teamId: selectedTeam.id,
        userId: memberId as unknown,
      });
      await loadTeamMembers(selectedTeam);
    } catch {
      setError('Failed to remove team member');
    }
  };

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Organization Selected</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select an organization from the sidebar to manage teams.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Teams</h2>
          <p className="text-muted-foreground">
            Organize members into teams for better collaboration.
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateTeam}>
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
                <DialogDescription>Create a new team within your organization.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Engineering, Design, Sales"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !newTeamName.trim()}>
                  {creating && <Loader2 className="size-4 animate-spin" />}
                  {creating ? 'Creating…' : 'Create Team'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-auto p-0"
            onClick={() => setError('')}
          >
            ×
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle>All Teams</CardTitle>
            <CardDescription>
              {teams.length} {teams.length === 1 ? 'team' : 'teams'} in this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : teams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No teams yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => loadTeamMembers(team)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Users className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {formatDate(team.createdAt)}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTeam ? `${selectedTeam.name} — Members` : 'Team Members'}
            </CardTitle>
            <CardDescription>
              {selectedTeam ? 'Manage members of this team' : 'Select a team to view its members'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedTeam ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a team from the left to manage its members.
              </p>
            ) : loadingMembers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add member form */}
                <form onSubmit={handleAddTeamMember} className="flex gap-2">
                  <Input
                    value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                    placeholder="User ID to add"
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={addingMember || !addMemberEmail.trim()}>
                    {addingMember && <Loader2 className="size-4 animate-spin" />}
                    Add
                  </Button>
                </form>

                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members in this team yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="text-sm">
                            {member.user?.name || member.user?.email || member.userId}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{member.role || 'member'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleRemoveTeamMember(member.id)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
