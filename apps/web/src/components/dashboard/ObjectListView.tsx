import { useState, useEffect } from 'react';
import { 
    Button, 
    Badge, 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    Spinner, 
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator
} from '@objectos/ui';
import { ObjectForm } from './ObjectForm';
import { Plus, RefreshCw, Grid, List as ListIcon, Filter, MoreHorizontal, FileText, Trash, Pencil } from 'lucide-react';
// import { useRouter } from ... passed as prop

interface ObjectListViewProps {
    objectName: string;
    user: any;
    isCreating: boolean;
    navigate: (path: string) => void;
    objectSchema: any;
}

interface SortConfig {
    columnId: string;
    direction: 'asc' | 'desc';
}

export function ObjectListView({ objectName, user, isCreating, navigate, objectSchema }: ObjectListViewProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [sortConfig] = useState<SortConfig[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilter, setShowFilter] = useState(false); // New state for filter visibility
    
    const label = objectSchema?.label || objectSchema?.title || objectName;

    // Debounce search term
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    
    const getFieldLabel = (key: string) => {
        if (!objectSchema || !objectSchema.fields) return key;
        const field = objectSchema.fields[key];
        return field ? (field.label || field.title || key) : key;
    };


    const getHeaders = () => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        headers['x-user-id'] = 'admin'; 
        return headers;
    };

    const fetchData = () => {
        if (!objectName) return;
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (sortConfig.length > 0) {
            // API expects sort=field:order or multiple
             const sortParam = sortConfig.map(s => `${s.columnId}:${s.direction}`).join(',');
             params.append('sort', sortParam);
        }
        
        if (debouncedSearch) {
            // Simple search implementation: try to search in name or title or description fields
            // Or search in all text fields
            const textFields = objectSchema?.fields ? 
                Object.entries(objectSchema.fields)
                    .filter(([_, field]: [string, any]) => !field.type || field.type === 'string')
                    .map(([key]) => key) 
                : ['name', 'title', 'description', 'email'];
                
            if (textFields.length > 0) {
                 // Construct array-based filters: [['field', 'contains', 'val'], 'or', ['field2', ...]]
                 const searchFilters: any[] = [];
                 textFields.forEach((field, index) => {
                     if (index > 0) searchFilters.push('or');
                     searchFilters.push([field, 'contains', debouncedSearch]);
                 });
                 // If sending strict JSON array for unified query
                 params.append('filters', JSON.stringify(searchFilters));
            }
        }
        
        fetch(`/api/v6/data/${objectName}?${params.toString()}`, { headers: getHeaders() })
            .then(async res => {
                if (!res.ok) {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const json = await res.json();
                        throw new Error(json.error || "Failed to load data");
                    }
                    throw new Error(await res.text() || res.statusText);
                }
                return res.json();
            })
            .then(result => {
                const items = Array.isArray(result) ? result : (result.list || []);
                setData(items);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setData([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (objectName) fetchData();
    }, [objectName, user, sortConfig, debouncedSearch]);

    const handleCreate = (formData: any) => {
        fetch(`/api/v6/data/${objectName}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(formData)
        })
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then(() => {
            navigate(`/object/${objectName}`);
            fetchData();
        })
        .catch(err => alert(err.message));
    }



    const handleDelete = (row: any) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        const id = row.id || row._id;
        
        fetch(`/api/v6/data/${objectName}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            fetchData(); 
        })
        .catch(err => alert(err.message));
    }

    const getColumns = () => {
         let fields: string[] = [];
         if (objectSchema && objectSchema.fields) {
             fields = Object.keys(objectSchema.fields);
             if (!fields.includes('createdAt')) fields.push('createdAt');
             if (!fields.includes('updatedAt')) fields.push('updatedAt');
         } else if (data && data.length > 0) {
             fields = Object.keys(data[0]).filter(key => !['_id', '__v'].includes(key));
         }
         return fields;
    };

    const columns = getColumns();

    return (
        <div className="flex flex-col h-full bg-background">
             <div className="border-b bg-background">
                 <div className="px-6 py-4 flex justify-between items-center">
                     <div>
                         <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                             <FileText className="w-5 h-5 text-muted-foreground"/>
                            {label}
                            <Badge variant="secondary" className="ml-2">{data.length} records</Badge>
                         </h3>
                     </div>
                     <div className="flex items-center gap-2">
                         {showFilter && (
                             <div className="w-64 animate-in slide-in-from-right-2 fade-in duration-200">
                                 <Input 
                                     placeholder="Search..." 
                                     value={searchTerm}
                                     autoFocus
                                     onChange={(e) => setSearchTerm(e.target.value)}
                                     className="h-9"
                                 />
                             </div>
                         )}
                         <div className="flex items-center border rounded-md shadow-sm">
                             <Button
                                 variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                 size="icon"
                                 className="h-8 w-8 rounded-none rounded-l-md"
                                 onClick={() => setViewMode('table')}
                             >
                                 <ListIcon className="h-4 w-4" />
                             </Button>
                             <Button
                                 variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                 size="icon"
                                 className="h-8 w-8 rounded-none rounded-r-md"
                                 onClick={() => setViewMode('grid')}
                             >
                                 <Grid className="h-4 w-4" />
                             </Button>
                         </div>
                         
                         <Button onClick={fetchData} variant="outline" size="sm" className="h-9">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                         </Button>
                         <Button 
                            variant={showFilter ? 'default' : 'outline'} 
                            size="sm"
                            className="h-9"
                            onClick={() => setShowFilter(!showFilter)}
                         >
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                         </Button>
                         <Button onClick={() => navigate(`/object/${objectName}/new`)} size="sm" className="h-9">
                            <Plus className="w-4 h-4 mr-2" />
                            New Record
                         </Button>
                     </div>
                 </div>
             </div>
            
            <div className="flex-1 overflow-auto p-6 relative">
                {error && (
                    <div className="mb-4 p-4 text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 z-50 bg-background/50 flex items-center justify-center pointer-events-none">
                        <Spinner className="w-8 h-8" />
                    </div>
                )}

                {data.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 rounded-xl border border-dashed">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-sm font-medium">No records found for {label}</p>
                        <Button onClick={() => navigate(`/object/${objectName}/new`)} variant="secondary" className="mt-4">
                            Create First Record
                        </Button>
                    </div>
                ) : (
                   viewMode === 'table' ? (
                       <div className="rounded-md border bg-card">
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       {columns.map(col => (
                                           <TableHead key={col}>{getFieldLabel(col)}</TableHead>
                                       ))}
                                       <TableHead className="w-[50px]"></TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {data.map((row, i) => (
                                       <TableRow key={i} className="group">
                                           {columns.map(col => (
                                               <TableCell key={col}>
                                                   {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                                               </TableCell>
                                           ))}
                                           <TableCell>
                                               <DropdownMenu>
                                                   <DropdownMenuTrigger asChild>
                                                       <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                                                           <span className="sr-only">Open menu</span>
                                                           <MoreHorizontal className="h-4 w-4" />
                                                       </Button>
                                                   </DropdownMenuTrigger>
                                                   <DropdownMenuContent align="end">
                                                       <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                       <DropdownMenuItem onClick={() => navigate(`/object/${objectName}/${row.id || row._id}`)}>
                                                           <Pencil className="mr-2 h-4 w-4" /> Edit
                                                       </DropdownMenuItem>
                                                       <DropdownMenuSeparator />
                                                       <DropdownMenuItem 
                                                           className="text-destructive focus:text-destructive"
                                                           onClick={() => handleDelete(row.id || row._id)}
                                                        >
                                                           <Trash className="mr-2 h-4 w-4" /> Delete
                                                       </DropdownMenuItem>
                                                   </DropdownMenuContent>
                                               </DropdownMenu>
                                           </TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                       </div>
                   ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                           {data.map((row, i) => (
                               <div key={i} className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/object/${objectName}/${row.id || row._id}`)}>
                                   <div className="font-semibold mb-2">{row.name || row.title || `Item ${i}`}</div>
                                   <div className="text-sm text-muted-foreground truncate">
                                       {Object.entries(row).slice(0, 3).map(([k, v]) => (
                                           <div key={k}>{k}: {String(v)}</div>
                                       ))}
                                   </div>
                               </div>
                           ))}
                       </div>
                   )
                )}
            </div>

            <Dialog 
                open={isCreating} 
                onOpenChange={(open) => !open && navigate(`/object/${objectName}`)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New {label}</DialogTitle>
                    </DialogHeader>
                    <ObjectForm 
                        objectName={objectName} 
                        initialValues={ {} }
                        headers={getHeaders()}
                        onSubmit={handleCreate} 
                        onCancel={() => navigate(`/object/${objectName}`)} 
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

