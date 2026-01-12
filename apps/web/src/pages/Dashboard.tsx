import { useState, useEffect } from 'react';
import { Spinner } from '@objectos/ui';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../hooks/useRouter';
import { ObjectListView } from '../components/dashboard/ObjectListView';
import { ObjectDetailView } from '../components/dashboard/ObjectDetailView';
import { SettingsView } from '../components/dashboard/SettingsView';
import { ObjectNotFound } from '../components/dashboard/ObjectNotFound';
import { DashboardHome } from './DashboardHome';
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
            fetch('/api/data/app?limit=100', { headers: getHeaders() })
                .then(res => res.json())
                .then(result => {
                    const data = Array.isArray(result) ? result : (result.data || []);
                    setApps(data);
                })
                .catch(console.error);

            // Fetch objects
            fetch('/api/metadata/object', { headers: getHeaders() })
                .then(res => res.json())
                .then(result => {
                    // Handle potential wrapper format { object: [...] } or { data: [...] }
                    const list = Array.isArray(result) ? result : (result.object || result.data || []);
                    
                    // Convert array to map
                    const objectsMap: Record<string, any> = {};
                    if (Array.isArray(list)) {
                        list.forEach((obj: any) => {
                            if (obj && obj.name) {
                                objectsMap[obj.name] = obj;
                            }
                        });
                    }
                    
                    setObjects(objectsMap);
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

    // Handle Object Routes
    if (objectName) {
        if (objects[objectName]) {
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
        } else {
             // Object requested but not found in metadata
             return <ObjectNotFound objectName={objectName} />;
        }
    }

    // Default Dashboard View (App Selection)
    return <DashboardHome apps={apps} />;
}
