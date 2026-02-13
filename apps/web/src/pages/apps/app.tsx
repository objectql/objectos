import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppDefinition } from '@/hooks/use-metadata';
import { useObjectDefinition } from '@/hooks/use-metadata';
import { useRecords } from '@/hooks/use-records';

/** Small card showing an object's record count with a link to its list view. */
function ObjectCard({ appId, objectName }: { appId: string; objectName: string }) {
  const { data: objectDef } = useObjectDefinition(objectName);
  const { data: result } = useRecords({ objectName });

  if (!objectDef) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-muted-foreground" />
            {objectDef.pluralLabel ?? objectDef.label ?? objectName}
          </CardTitle>
          <Badge variant="secondary">{result?.total ?? 0}</Badge>
        </div>
        {objectDef.description && <CardDescription>{objectDef.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link to={`/apps/${appId}/${objectName}`}>
            View {(objectDef.pluralLabel ?? objectDef.label ?? objectName).toLowerCase()}
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BusinessAppPage() {
  const { appId } = useParams();
  const { data: appDef, isLoading } = useAppDefinition(appId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!appDef) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">App not found</h2>
        <p className="text-muted-foreground">The requested business app is not installed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{appDef.label}</h2>
        <p className="text-muted-foreground">{appDef.description}</p>
        {appDef.active === false && (
          <Badge variant="outline" className="mt-2">
            Paused
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(appDef.objects ?? []).map((objectName) => (
          <ObjectCard key={objectName} appId={appDef.name} objectName={objectName} />
        ))}
      </div>
    </div>
  );
}
