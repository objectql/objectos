import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organization, useActiveOrganization, useListOrganizations } from '@/lib/auth-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function OrganizationSettingsPage() {
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations, isPending: orgsPending } = useListOrganizations();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    if (activeOrg) {
      setName(activeOrg.name || '');
      setSlug(activeOrg.slug || '');
    }
  }, [activeOrg]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await organization.update({
        data: { name, slug },
        organizationId: activeOrg.id,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeOrg?.id || confirmDelete !== activeOrg.name) return;

    setDeleting(true);
    try {
      await organization.delete({ organizationId: activeOrg.id });
      navigate('/settings');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete organization');
      setDeleting(false);
    }
  };

  if (!activeOrg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>Select an organization to manage its settings.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Organization Settings</h2>
        <p className="text-muted-foreground">Manage settings for {activeOrg.name}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Switcher</CardTitle>
          <CardDescription>Select an organization to manage its settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {orgsPending && (
            <div className="text-sm text-muted-foreground">Loading organizations…</div>
          )}
          {!orgsPending &&
            organizations?.map((orgItem) => (
              <button
                key={orgItem.id}
                type="button"
                onClick={() => organization.setActive({ organizationId: orgItem.id })}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md border bg-background text-xs font-semibold">
                    {orgItem.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{orgItem.name}</span>
                </div>
                {activeOrg.id === orgItem.id && (
                  <span className="text-xs text-muted-foreground">Active</span>
                )}
              </button>
            ))}
          <div>
            <Button variant="outline" onClick={() => navigate('/organization/create')}>
              Add organization
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Update your organization name and URL slug.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdate}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary">
                Organization updated successfully!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs. Only lowercase letters, numbers, and dashes.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete this organization and all its data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. All members will be removed and all associated data will
            be permanently deleted.
          </p>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <strong>{activeOrg.name}</strong> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder={activeOrg.name}
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            variant="destructive"
            disabled={confirmDelete !== activeOrg.name || deleting}
            onClick={handleDelete}
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            {deleting ? 'Deleting...' : 'Delete Organization'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
