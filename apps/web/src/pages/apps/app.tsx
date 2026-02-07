import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAppById } from '@/lib/app-registry';

export default function BusinessAppPage() {
  const { appId } = useParams();
  const app = getAppById(appId);

  if (!app) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">App not found</h2>
        <p className="text-muted-foreground">
          The requested business app is not installed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{app.name}</h2>
        <p className="text-muted-foreground">{app.description}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>App Home</CardTitle>
            {app.status === 'paused' && <Badge variant="outline">Paused</Badge>}
          </div>
          <CardDescription>
            This is a placeholder shell for the business app workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          Configure ObjectUI routes and modules for {app.name} here.
        </CardContent>
      </Card>
    </div>
  );
}
