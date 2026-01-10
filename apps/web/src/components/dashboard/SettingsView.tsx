import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle,
    Badge 
} from '@objectos/ui';

interface SettingsViewProps {
    objectCount?: number;
}

export function SettingsView({ objectCount = 0 }: SettingsViewProps) {
    return (
        <div className="overflow-auto w-full">
            <div className="max-w-4xl mx-auto space-y-6">
                 <div>
                    <h3 className="text-lg font-medium">Settings</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your server configuration and view system status.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>About ObjectQL</CardTitle>
                        <CardDescription>System information and status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Version</span>
                            <span className="font-medium">v0.2.0</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Environment</span>
                            <span className="font-medium">Development</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-muted-foreground">Collections</span>
                            <Badge variant="secondary">{objectCount}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
