import { useState, useEffect, useCallback } from 'react';
import { ObjectGridTable } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

/**
 * Enhanced ObjectListView using ObjectGridTable
 * This is an improved version that uses metadata-driven AG Grid table
 */

interface EnhancedObjectListViewProps {
    objectName: string;
    user: any;
}

export function EnhancedObjectListView({ objectName, user }: EnhancedObjectListViewProps) {
    const [data, setData] = useState<any[]>([]);
    const [objectConfig, setObjectConfig] = useState<ObjectConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = useCallback(() => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        // Use the actual user ID from props instead of hard-coded value
        if (user?.id || user?._id) {
            headers['x-user-id'] = user.id || user._id;
        }
        return headers;
    }, [user]);

    // Fetch object metadata
    useEffect(() => {
        if (!objectName) return;

        fetch(`/api/metadata/object/${objectName}`, { headers: getHeaders() })
            .then(async res => {
                if (!res.ok) {
                    throw new Error(await res.text() || res.statusText);
                }
                return res.json();
            })
            .then(config => {
                setObjectConfig(config);
            })
            .catch(err => {
                console.error('Failed to load object metadata:', err);
                setError(err.message);
            });
    }, [objectName, getHeaders]);

    // Fetch data
    useEffect(() => {
        if (!objectName) return;
        
        setLoading(true);
        setError(null);

        fetch(`/api/data/${objectName}`, { headers: getHeaders() })
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
    }, [objectName, getHeaders]);

    const handleSelectionChanged = (selectedRows: any[]) => {
        console.log('Selected rows:', selectedRows);
        // You can add more selection handling logic here
    };

    if (error) {
        return (
            <div className="p-6">
                <div className="mb-4 p-4 text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                    {error}
                </div>
            </div>
        );
    }

    if (!objectConfig) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading object metadata...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background p-6">
            <div className="mb-4">
                <h2 className="text-2xl font-bold">{objectConfig.label || objectName}</h2>
                {objectConfig.description && (
                    <p className="text-muted-foreground mt-1">{objectConfig.description}</p>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center flex-1">
                    <div className="text-muted-foreground">Loading data...</div>
                </div>
            ) : (
                <ObjectGridTable
                    objectConfig={objectConfig}
                    data={data}
                    height="calc(100vh - 200px)"
                    pagination={true}
                    pageSize={20}
                    rowSelection="multiple"
                    onSelectionChanged={handleSelectionChanged}
                />
            )}
        </div>
    );
}
