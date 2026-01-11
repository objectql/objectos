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
import { AppWindow, Settings, ChevronRight } from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';

interface App {
    id?: string;
    name: string;
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
                if (Array.isArray(data)) {
                    setApps(data);
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apps.map((app, idx) => {
                    const appCode = app.code || app.id || app.name; // Fallback for code
                    const appName = app.name;
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

                {/* Always show Global/Admin App */}
                <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow group border-dashed"
                    onClick={() => navigate('/settings')}
                >
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                                <Settings className="w-6 h-6" />
                            </div>
                        </div>
                        <CardTitle className="mt-4">System Settings</CardTitle>
                        <CardDescription>
                            Configure organization, users, and global settings.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
