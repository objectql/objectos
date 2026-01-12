import { useState, useEffect } from 'react';
import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardContent,
    Button,
    Spinner
} from '@objectos/ui';
import { useRouter } from '../hooks/useRouter';
import { getHeaders } from '../lib/api';
import { AppWindow, ChevronRight } from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';

interface App {
    id?: string;
    name: string;
    label?: string; // App Label for display
    description?: string;
    code?: string;
    icon?: string;
    color?: string;
    dark?: boolean;
    menu?: any[];
}

export default function AppList() {
    const [apps, setApps] = useState<App[]>([]);
    const [loading, setLoading] = useState(true);
    const { navigate } = useRouter();

    useEffect(() => {
        fetch('/api/metadata/app', { headers: getHeaders() })
            .then(res => res.json())
            .then(data => {
                // Handle wrapped response { app: [...] } or direct array [...]
                const appList = Array.isArray(data) ? data : (data.app || []);
                if (Array.isArray(appList)) {
                    setApps(appList);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load apps', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="flex h-full items-center justify-center p-8"><Spinner /></div>;
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">My Apps</h1>
            <p className="text-muted-foreground mb-8">Select an application to start working</p>
            
            {apps.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed">
                    <AppWindow className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No apps found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        Get started by creating your first application in the backend configuration.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.map((app, idx) => {
                        const appCode = app.code || app.id || app.name; // Fallback for code
                        const appName = app.label || app.name; // Use label if available, fallback to name
                        const appColor = app.color;
                        const key = app.id || app.code || `app-${idx}`;

                        return (
                            <Card 
                                key={key} 
                                className="cursor-pointer hover:shadow-lg transition-shadow group relative overflow-hidden"
                                onClick={() => navigate(`/app/${appCode}`)}
                            >
                                {/* Color strip on top or side if defined */}
                                {appColor && (
                                    <div 
                                        className="absolute top-0 left-0 w-1 h-full" 
                                        style={{ backgroundColor: appColor }}
                                    />
                                )}
                                
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-2 rounded-lg bg-gray-100 ${appColor ? 'text-white' : 'text-gray-600'}`}
                                            style={appColor ? { backgroundColor: appColor } : {}}
                                        >
                                            <DynamicIcon 
                                                name={app.icon} 
                                                fallback={AppWindow} 
                                                className="w-6 h-6" 
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <CardTitle className="mt-4">{appName}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">
                                        {app.description || 'No description provided.'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Additional info bits */}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
