import { useState, useEffect } from 'react';
import { 
    Spinner,
    Card,
    CardHeader,
    CardTitle,
    CardDescription
} from '@objectos/ui';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../hooks/useRouter';
import { ObjectListView } from '../components/dashboard/ObjectListView';
import { ObjectDetailView } from '../components/dashboard/ObjectDetailView';
import { SettingsView } from '../components/dashboard/SettingsView';
import { getHeaders } from '../lib/api';

export default function Dashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [objects, setObjects] = useState<Record<string, any>>({});
    const [apps, setApps] = useState<any[]>([]);
    const { path, navigate } = useRouter();
    
    // Parse path
    // Support patterns:
    // 1. /object/:objectName/:recordId?
    // 2. /app/:appName/object/:objectName/:recordId?
    const parts = path.split('/');
    
    let objectName: string | null = null;
    let recordId: string | undefined = undefined;
    let appName: string | null = null;

    if (parts[1] === 'object') {
        objectName = parts[2];
        recordId = parts[3];
    } else if (parts[1] === 'app' && parts[3] === 'object') {
        appName = parts[2];
        objectName = parts[4];
        recordId = parts[5];
    }
    
    // Wrap navigate to preserve app context
    const wrappedNavigate = (to: string) => {
        if (appName && to.startsWith('/object/')) {
            navigate(to.replace('/object/', `/app/${appName}/object/`));
        } else {
            navigate(to);
        }
    };

    useEffect(() => {
        if (user) {
            fetch('/api/v6/data/app?limit=100', { headers: getHeaders() })
                .then(res => res.json())
                .then(result => {
                    const data = Array.isArray(result) ? result : (result.data || []);
                    setApps(data);
                })
                .catch(console.error);

            // Fetch objects
            fetch('/api/v6/metadata/object', { headers: getHeaders() })
                .then(res => res.json())
                .then(result => {
                    // Convert array to map
                    const objectsMap: Record<string, any> = {};
                    if (Array.isArray(result)) {
                        result.forEach((obj: any) => {
                            objectsMap[obj.name] = obj;
                        });
                    }
                    
                    setObjects(objectsMap);
                    // Auto-redirect removed to show App List
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch objects", err);
                    setLoading(false);
                });
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    // Since Dashboard is now rendered INSIDE App.tsx's Layout, 
    // we only need to render the content specific to the route
    
    if (path === '/settings') {
        return <SettingsView />;
    }

    if (objectName && objects[objectName]) {
        if (recordId) {
            return (
                <ObjectDetailView 
                    objectName={objectName} 
                    recordId={recordId}
                    navigate={wrappedNavigate}
                    objectSchema={objects[objectName]}
                />
            );
        }
        return (
            <ObjectListView 
                objectName={objectName} 
                user={user}
                isCreating={false}
                navigate={wrappedNavigate}
                objectSchema={objects[objectName]}
            />
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Applications</h2>
                    <p className="text-muted-foreground mt-2">
                        Select an application to start working.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {apps.map(app => (
                    <Card 
                        key={app._id || app.id} 
                        className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/20"
                        onClick={() => {
                            // Navigate to first object or app root
                            if (app.objects && Array.isArray(app.objects) && app.objects.length > 0) {
                                navigate(`/app/${app.slug}/object/${app.objects[0]}`);
                            } else {
                                navigate(`/app/${app.slug}`);
                            }
                        }}
                    >
                        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                            <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                <i className={`${app.icon || 'ri-apps-line'} text-xl`}></i>
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-lg">{app.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {app.description || 'No description provided'}
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
                
                {apps.length === 0 && (
                     <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <i className="ri-apps-line text-2xl text-muted-foreground"></i>
                        </div>
                        <h3 className="text-lg font-semibold">No Applications Found</h3>
                        <p className="text-muted-foreground">Admin needs to create an application first.</p>
                     </div>
                )}
            </div>
        </div>
    );
}
