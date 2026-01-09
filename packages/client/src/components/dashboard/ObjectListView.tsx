import { useState, useEffect } from 'react';
import { Button, Badge, Modal, Spinner, AgGridView, Input } from '@objectql/ui';
import { ObjectForm } from './ObjectForm';
import { cn } from '../../lib/utils';
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

    const getFieldType = (key: string) => {
        if (!objectSchema || !objectSchema.fields) return 'text';
        const field = objectSchema.fields[key];
        if (!field) return 'text';
        
        if (field.type === 'boolean') return 'boolean';
        if (field.type === 'date' || field.type === 'datetime') return 'date';
        if (field.type === 'number' || field.type === 'integer' || field.type === 'float') return 'number';
        if (field.type === 'select' && field.options) return 'badge';
        return 'text';
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
        
        fetch(`/api/object/${objectName}?${params.toString()}`, { headers: getHeaders() })
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
        fetch(`/api/object/${objectName}`, {
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

    const handleCellEdit = (rowIndex: number, columnId: string, value: any) => {
        const row = data[rowIndex];
        const id = row.id || row._id;
        
        fetch(`/api/object/${objectName}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ ...row, [columnId]: value })
        })
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then(() => {
            const newData = [...data];
            newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
            setData(newData);
        })
        .catch(err => alert(err.message));
    };

    const handleDelete = (row: any) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        const id = row.id || row._id;
        
        fetch(`/api/object/${objectName}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            fetchData(); 
        })
        .catch(err => alert(err.message));
    }

    const getAgGridColumns = () => {
         // AgGrid Column Definitions
         // Prefer schema for columns, fallback to data inspection
         let fields: string[] = [];
         if (objectSchema && objectSchema.fields) {
             fields = Object.keys(objectSchema.fields);
             if (!fields.includes('createdAt')) fields.push('createdAt');
             if (!fields.includes('updatedAt')) fields.push('updatedAt');
         } else if (data && data.length > 0) {
             fields = Object.keys(data[0]).filter(key => !['_id', '__v'].includes(key));
         }

         return fields.map(key => {
             const type = getFieldType(key);
             
             return {
                 field: key, // AgGrid uses 'field' instead of 'id'
                 headerName: getFieldLabel(key),
                 editable: !['id', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'].includes(key),
                 sortable: true,
                 filter: true,
                 resizable: true,
                 width: type === 'boolean' ? 100 : type === 'date' ? 180 : type === 'number' ? 120 : 200,
                 // Optional: Custom cell renderers can be added here if needed
             };
         });
    };

    const columns = getAgGridColumns();

    return (
        <div className="flex flex-col h-full bg-stone-50">
             <div className="bg-white border-b border-stone-200">
                 <div className="px-6 py-4 flex justify-between items-center">
                     <div>
                         <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                            <i className={`ri-${objectSchema?.icon || 'file-list-2-line'} text-xl text-stone-400`} />
                            {label}
                            <Badge className="ml-2">{data.length} records</Badge>
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
                         <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-1">
                             <button
                                 onClick={() => setViewMode('table')}
                                 className={cn(
                                     "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                     viewMode === 'table'
                                         ? 'bg-white text-stone-900 shadow-sm'
                                         : 'text-stone-600 hover:text-stone-900'
                                 )}
                             >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                 </svg>
                             </button>
                             <button
                                 onClick={() => setViewMode('grid')}
                                 className={cn(
                                     "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                     viewMode === 'grid'
                                         ? 'bg-white text-stone-900 shadow-sm'
                                         : 'text-stone-600 hover:text-stone-900'
                                 )}
                             >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                 </svg>
                             </button>
                         </div>
                         
                         <Button onClick={fetchData} variant="secondary" className="h-9 text-sm px-3">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                            Refresh
                         </Button>
                         <Button 
                            variant={showFilter ? 'default' : 'secondary'} 
                            className="h-9 text-sm px-3"
                            onClick={() => setShowFilter(!showFilter)}
                         >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                            Filter
                         </Button>
                         <Button onClick={() => navigate(`/object/${objectName}/new`)} className="h-9 text-sm px-3">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            New Record
                         </Button>
                     </div>
                 </div>
             </div>
            
            <div className="flex-1 overflow-auto p-6 relative">
                {error && (
                    <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 z-50 bg-white/50 flex items-center justify-center pointer-events-none">
                        <Spinner size="lg" />
                    </div>
                )}

                {data.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-stone-400 p-8 bg-white rounded-xl border border-stone-200">
                        <i className={`ri-${objectSchema?.icon || 'database-2-line'} text-6xl mb-4 opacity-50`} />
                        <p className="text-sm font-medium">No records found for {label}</p>
                        <Button onClick={() => navigate(`/object/${objectName}/new`)} variant="secondary" className="mt-4">
                            Create First Record
                        </Button>
                    </div>
                ) : (
                    <div className="h-full w-full">
                        <AgGridView
                            columns={columns}
                            data={data}
                            onRowClick={(row: any) => navigate(`/object/${objectName}/${row.id || row._id}`)}
                            onCellEdit={handleCellEdit}
                            onDelete={handleDelete}
                            enableSorting={true}
                            className="h-full w-full"
                        />
                    </div>
                )}
            </div>

            <Modal 
                isOpen={isCreating} 
                onClose={() => navigate(`/object/${objectName}`)} 
                title={`New ${label}`}
            >
                <ObjectForm 
                    objectName={objectName} 
                    initialValues={ {} }
                    headers={getHeaders()}
                    onSubmit={handleCreate} 
                    onCancel={() => navigate(`/object/${objectName}`)} 
                />
            </Modal>
        </div>
    );
}

