import { useState, useEffect } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Spinner } from '@objectos/ui';
import { getHeaders } from '../../lib/api';
import { ChevronLeft, Pencil, Trash } from 'lucide-react';
import { ObjectForm } from './ObjectForm';

interface ObjectDetailViewProps {
    objectName: string;
    recordId: string;
    navigate: (path: string) => void;
    objectSchema: any;
}

export function ObjectDetailView({ objectName, recordId, navigate, objectSchema }: ObjectDetailViewProps) {
    const [data, setData] = useState<any>(null);
    const [schema, setSchema] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const label = objectSchema?.label || objectSchema?.title || objectName;

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`/api/data/${objectName}/${recordId}`, { headers: getHeaders() }).then(async r => {
                    if (!r.ok) throw new Error("Failed to load record");
                    return r.json();
            }),
            fetch(`/api/metadata/object/${objectName}`, { headers: getHeaders() }).then(r => r.json())
        ]).then(([record, schemaData]) => {
            setData(record);
            setSchema(schemaData);
        }).catch(console.error)
        .finally(() => setLoading(false));
    }, [objectName, recordId]);

    const handleDelete = () => {
            if (!confirm('Are you sure you want to delete this record?')) return;
            fetch(`/api/data/${objectName}/${recordId}`, {
            method: 'DELETE',
            headers: getHeaders()
        }).then(() => navigate(`/object/${objectName}`))
        .catch(e => alert(e.message));
    };
    
    const handleUpdate = (formData: any) => {
            fetch(`/api/data/${objectName}/${recordId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(formData)
        }).then(async res => {
            if(!res.ok) throw new Error(await res.text());
            return res.json();
        }).then(() => {
            setIsEditing(false);
            // Reload data
            fetch(`/api/data/${objectName}/${recordId}`, { headers: getHeaders() })
                .then(r => r.json())
                .then(setData);
        }).catch(e => alert(e.message));
    };

    if (loading) return (
        <div className="flex flex-col h-full bg-background rounded-xl border shadow-sm overflow-hidden p-8 items-center justify-center">
            <Spinner className="w-6 h-6" />
        </div>
    );
    
    if (!data) return <div>Record not found</div>;

    return (
        <div className="flex flex-col h-full bg-background rounded-xl border shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-card">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/object/${objectName}`)} className="rounded-full">
                        <ChevronLeft className="w-5 h-5"/>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-medium tracking-wider mb-0.5">
                            {label}
                            <span className="text-muted-foreground/30">/</span>
                            <span className="text-muted-foreground">{recordId}</span>
                        </div>
                        <h1 className="text-xl font-bold text-foreground">{data.name || data.title || recordId}</h1>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                            <Pencil className="w-4 h-4" />
                            Edit
                    </Button>
                    <Button variant="outline" onClick={handleDelete} className="hover:bg-destructive/10 hover:text-destructive gap-2 border-transparent text-destructive">
                        <Trash className="w-4 h-4" />
                        Delete
                    </Button>
                </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-muted/20 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                         {Object.entries(data).map(([key, value]) => {
                             if (['id', '_id', '__v'].includes(key)) return null;
                             const fieldLabel = schema?.fields?.[key]?.label || key;
                             
                             return (
                                 <div key={key} className="space-y-1">
                                     <div className="text-sm font-medium text-muted-foreground capitalize">{fieldLabel}</div>
                                     <div className="text-base font-medium break-words">
                                         {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                     </div>
                                 </div>
                             )
                         })}
                    </div>
                </div>

                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit {label}</DialogTitle>
                        </DialogHeader>
                         <ObjectForm 
                            objectName={objectName} 
                            initialValues={data}
                            headers={getHeaders()}
                            onSubmit={handleUpdate} 
                            onCancel={() => setIsEditing(false)} 
                        />
                    </DialogContent>
                </Dialog>
        </div>
    );
}
