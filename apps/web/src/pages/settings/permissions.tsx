import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PermissionSet {
  name: string;
  label?: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
  objectPermissions?: Record<
    string,
    {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
      viewAll?: boolean;
      modifyAll?: boolean;
    }
  >;
}

export default function PermissionsPage() {
  const { data: setsData, isLoading } = useQuery({
    queryKey: ['permissions', 'sets'],
    queryFn: async () => {
      const response = await fetch('/api/v1/permissions/sets');
      if (!response.ok) throw new Error('Failed to fetch permission sets');
      return response.json();
    },
  });

  const permissionSets: PermissionSet[] = setsData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Permissions & RBAC</h2>
        <p className="text-muted-foreground">
          Manage roles, permission sets, and object-level access policies.
        </p>
      </div>

      {/* Permission Sets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permission Sets</CardTitle>
              <CardDescription>
                Granular permissions for objects, fields, and records
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
            </div>
          ) : permissionSets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No permission sets found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Label</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Objects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionSets.map((set) => (
                  <TableRow key={set.name}>
                    <TableCell className="font-medium font-mono text-sm">{set.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{set.label || set.name}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {set.description || '-'}
                    </TableCell>
                    <TableCell>
                      {set.isActive !== false ? (
                        <Badge variant="outline">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {set.isSystem ? (
                        <Badge variant="default">System</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      {set.objectPermissions ? Object.keys(set.objectPermissions).length : 0} object
                      {Object.keys(set.objectPermissions || {}).length !== 1 ? 's' : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permission Set Details */}
      {permissionSets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {permissionSets.slice(0, 4).map((set) => (
            <Card key={set.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{set.label || set.name}</CardTitle>
                  {set.isSystem && <Badge variant="default">System</Badge>}
                </div>
                <CardDescription className="font-mono text-xs">{set.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {set.objectPermissions && Object.keys(set.objectPermissions).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(set.objectPermissions)
                      .slice(0, 3)
                      .map(([objectName, perms]) => (
                        <div key={objectName} className="text-sm">
                          <div className="font-medium mb-1">{objectName}</div>
                          <div className="flex gap-1 flex-wrap">
                            {perms.create && (
                              <Badge variant="outline" className="text-xs">
                                Create
                              </Badge>
                            )}
                            {perms.read && (
                              <Badge variant="outline" className="text-xs">
                                Read
                              </Badge>
                            )}
                            {perms.update && (
                              <Badge variant="outline" className="text-xs">
                                Update
                              </Badge>
                            )}
                            {perms.delete && (
                              <Badge variant="outline" className="text-xs">
                                Delete
                              </Badge>
                            )}
                            {perms.viewAll && (
                              <Badge variant="default" className="text-xs">
                                ViewAll
                              </Badge>
                            )}
                            {perms.modifyAll && (
                              <Badge variant="default" className="text-xs">
                                ModifyAll
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    {Object.keys(set.objectPermissions).length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{Object.keys(set.objectPermissions).length - 3} more objects
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No object permissions defined</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Define high-level access roles and assign them to users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Role management coming soon</div>
        </CardContent>
      </Card>

      {/* Field-Level Security */}
      <Card>
        <CardHeader>
          <CardTitle>Field-Level Security</CardTitle>
          <CardDescription>Control field visibility and editability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Field-level security configuration coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
