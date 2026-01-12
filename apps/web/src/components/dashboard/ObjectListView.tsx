import { useState, useEffect, useCallback } from 'react';
import { 
    Button, 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    ObjectGridTable,
    Input
} from '@objectos/ui';
import { ObjectForm } from './ObjectForm';
import { Plus, RefreshCw, Search } from 'lucide-react';

interface ObjectListViewProps {
    objectName: string;
    user: any;
    isCreating: boolean;
    navigate: (path: string) => void;
    objectSchema: any;
}

export function ObjectListView({ objectName, user, isCreating, navigate, objectSchema }: ObjectListViewProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Use schema label or title or object name
    const label = objectSchema?.label || objectSchema?.title || objectName;

    // Headers helper
    const getHeaders = useCallback(() => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (user?.id || user?._id) headers['x-user-id'] = user.id || user._id;
        return headers;
    }, [user]);

    // Data Fetching
    const fetchData = useCallback(() => {
        if (!objectName) return;
        setLoading(true);
        
        const params = new URLSearchParams();
        if (searchTerm) {
             let textFields: string[] = [];
             
             if (objectSchema?.fields) {
               const fieldsArr = Array.isArray(objectSchema.fields) 
                 ? objectSchema.fields 
                 : Object.values(objectSchema.fields);
                 
               textFields = fieldsArr
                 .filter((field: any) => !field.type || field.type === 'string')
                 .map((field: any) => field.name);
             } else {
               textFields = ['name', 'title', 'description', 'email'];
             }
                
            if (textFields.length > 0) {
                 const searchFilters: any[] = [];
                 textFields.forEach((field, index) => {
                     // OR logic for simple search
                     if (index > 0) searchFilters.push('or');
                     searchFilters.push([field, 'contains', searchTerm]);
                 });
                 params.append('filters', JSON.stringify(searchFilters));
            }
        }

        // Add default sort descending by created/updated if possible?
        // params.append('sort', 'created:desc'); 

        fetch(`/api/data/${objectName}?${params.toString()}`, { headers: getHeaders() })
            .then(async res => {
                if (!res.ok) throw new Error(await res.text() || res.statusText);
                return res.json();
            })
            .then(result => {
                const items = Array.isArray(result) ? result : (result.list || result.data || result.value || []);
                setData(items);
            })
            .catch(err => {
                console.error(err);
                setData([]);
            })
            .finally(() => setLoading(false));
    }, [objectName, searchTerm, objectSchema, getHeaders]);

    useEffect(() => {
        fetchData();
    }, [objectName, fetchData]); // Re-fetch when objectName changes or fetchData logic changes

    const handleCreate = (formData: any) => {
        fetch(`/api/data/${objectName}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(formData)
        })
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then(() => {
            navigate('..');
            fetchData();
        })
        .catch(err => alert(err.message));
    }

    const onRowClick = (event: any) => {
        const id = event.data?.id || event.data?._id;
        if (id) navigate(`${id}`);
    };

    return (
        <div className="h-full flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
                    <span className="text-muted-foreground ml-2 text-sm">
                        {data.length} records
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                     <div className="relative w-64 mr-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                            className="pl-8"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => navigate('new')} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 border rounded-md overflow-hidden bg-background">
                 {objectSchema ? (
                     <ObjectGridTable 
                        objectConfig={objectSchema} 
                        data={data} 
                        onCellClicked={onRowClick}
                        height="100%"
                        pagination={true}
                        pageSize={20}
                     />
                 ) : (
                     <div className="flex items-center justify-center h-full text-muted-foreground">
                        Loading schema...
                     </div>
                 )}
            </div>

            <Dialog 
                open={isCreating} 
                onOpenChange={(open) => !open && navigate('..')}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>New {label}</DialogTitle>
                    </DialogHeader>
                    <ObjectForm 
                        objectName={objectName} 
                        initialValues={{}}
                        headers={getHeaders()}
                        onSubmit={handleCreate} 
                        onCancel={() => navigate('..')} 
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
