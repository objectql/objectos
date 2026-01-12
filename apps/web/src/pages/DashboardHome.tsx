import { 
    Card,
    CardHeader,
    CardTitle,
    CardDescription
} from '@objectos/ui';
import { useRouter } from '../hooks/useRouter';

interface App {
    id?: string;
    _id?: string;
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    objects?: string[];
}

interface DashboardHomeProps {
    apps: App[];
}

export function DashboardHome({ apps }: DashboardHomeProps) {
    const { navigate } = useRouter();

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
                                navigate(`/app/${app.slug || app.name}/object/${app.objects[0]}`);
                            } else {
                                navigate(`/app/${app.slug || app.name}`);
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
