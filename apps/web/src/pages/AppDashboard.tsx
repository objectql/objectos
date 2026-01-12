import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Card, 
    Spinner
} from '@objectos/ui';
import { useRouter } from '../hooks/useRouter';
import { DynamicIcon } from '../components/DynamicIcon';
import { getHeaders } from '../lib/api';

export default function AppDashboard() {
    const { appName } = useParams();
    const { navigate } = useRouter();
    const [app, setApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!appName) return;
        setLoading(true);
        fetch(`/api/metadata/app/${appName}`, { headers: getHeaders() })
            .then(res => {
                if (!res.ok) throw new Error('App not found');
                return res.json();
            })
            .then(data => {
                setApp(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [appName]);

    if (loading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;
    if (!app) return <div className="p-8 text-center text-muted-foreground">App not found</div>;

    // Helper to resolve absolute vs relative paths
    const resolveLink = (item: any) => {
        if (item.object) return `/app/${appName}/object/${item.object}`;
        if (item.page) return `/app/${appName}/page/${item.page}`;
        if (item.url) return item.url;
        return '#';
    };

    const MenuItemCard = ({ item }: { item: any }) => (
        <Card 
            className="hover:shadow-md transition-all cursor-pointer border hover:border-primary/40 flex flex-col items-center justify-center p-6 bg-card text-card-foreground shadow-sm h-32"
            onClick={() => navigate(resolveLink(item))}
        >
             <div className="rounded-md bg-primary/5 p-3 mb-3">
               <DynamicIcon name={item.icon || 'square'} className="h-6 w-6 text-primary" />
            </div>
            <span className="font-semibold text-center text-sm">{item.label || item.object || 'Item'}</span>
            {item.description && <span className="text-xs text-muted-foreground mt-1 text-center line-clamp-2">{item.description}</span>}
        </Card>
    );

    const MenuSection = ({ section }: { section: any }) => {
        const title = section.label;
        const items = section.items || [];
        
        if (!items.length) return null;

        return (
            <div className="mb-8">
                {title && !section._isDefaultWrapper && (
                    <h3 className="text-lg font-semibold tracking-tight mb-4 flex items-center text-foreground/80">
                         {section.icon && <DynamicIcon name={section.icon} className="mr-2 h-5 w-5" />}
                         {title}
                    </h3>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {items.map((item: any, idx: number) => (
                        <MenuItemCard key={idx} item={item} />
                    ))}
                </div>
            </div>
        );
    };

    // Prepare sections
    const rawMenu = app.menu;
    const isSection = (item: any) => item && item.items && Array.isArray(item.items) && !item.type && !item.object && !item.url;
    const isGrouped = Array.isArray(rawMenu) && rawMenu.length > 0 && isSection(rawMenu[0]);
    const sections = rawMenu ? (isGrouped ? rawMenu : [{ label: 'Menu', items: rawMenu, _isDefaultWrapper: true }]) : [];

    return (
        <div className="p-8 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
                <div className="flex items-center space-x-4 mb-2">
                     <div className="p-3 bg-primary/10 rounded-xl">
                        <DynamicIcon name={app.icon || 'box'} className="h-8 w-8 text-primary" />
                     </div>
                     <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">{app.label || app.name}</h1>
                        <p className="text-muted-foreground text-lg">{app.description || `Welcome to ${app.label || app.name}`}</p>
                     </div>
                </div>
            </div>

            {sections.length > 0 ? (
                sections.map((section: any, idx: number) => (
                    <MenuSection key={idx} section={section} />
                ))
            ) : (
                <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">This app has no menu items configured.</p>
                </div>
            )}
        </div>
    );
}
