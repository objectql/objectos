import { useState, useEffect } from 'react';
import { 
    Spinner,
} from '@objectql/ui';
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
    const { path, navigate } = useRouter();
    
    // Parse path
    // /object/project/123 -> parts ['', 'object', 'project', '123']
    const parts = path.split('/');
    const objectName = parts[1] === 'object' ? parts[2] : null;
    const isObjectView = parts[1] === 'object';
    const recordId = isObjectView ? parts[3] : null; // Index 3 is ID because parts[2] is name

    useEffect(() => {
        if (user) {
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
                    
                    const objNames = Object.keys(objectsMap);
                    setObjects(objectsMap);
                    
                    const currentPath = window.location.pathname;
                    if ((currentPath === '/' || currentPath === '/object') && objNames.length > 0) {
                        navigate(`/object/${objNames[0]}`);
                    }

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
                    navigate={navigate}
                    objectSchema={objects[objectName]}
                />
            );
        }
        return (
            <ObjectListView 
                objectName={objectName} 
                user={user}
                isCreating={false}
                navigate={navigate}
                objectSchema={objects[objectName]}
            />
        );
    }

    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                    Welcome to ObjectQL
                </h3>
                <p className="text-sm text-muted-foreground">
                    Select an object from the sidebar to get started.
                </p>
            </div>
        </div>
    );
}
