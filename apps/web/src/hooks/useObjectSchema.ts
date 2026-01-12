import { useState, useEffect } from 'react';
import { getHeaders } from '../lib/api';

const schemaCache: Record<string, any> = {};

export function useObjectSchema(objectName: string) {
    const [schema, setSchema] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!objectName) return;

        if (schemaCache[objectName]) {
            setSchema(schemaCache[objectName]);
            setLoading(false);
            return;
        }

        setLoading(true);
        // We could fetch single object too: /api/metadata/object/:name
        // But current API might be bulk. Let's try single if available or filter from bulk (inefficient but works for now)
        // Optimization: Create /api/metadata/object/:name endpoint in backend or assume bulk cache in context.
        // For now, let's fetch list and find. (Or just assume the API supports name, which standard ObjectQL usually does)
        
        fetch(`/api/metadata/object/${objectName}`, { headers: getHeaders() })
            .then(async res => {
                if (res.status === 404) return null; // Not found
                if (!res.ok) {
                    // Fallback to bulk if single endpoint fails?
                    // Let's try bulk list as fallback or primay if we know backend
                    throw new Error('Failed to load schema');
                }
                return res.json();
            })
            .then(data => {
                if (data) {
                    // Normalize fields from Array to Record if needed
                    if (data.fields && Array.isArray(data.fields)) {
                        const fieldRecord: Record<string, any> = {};
                        data.fields.forEach((f: any) => {
                            if (f.name) fieldRecord[f.name] = f;
                        });
                        data.fields = fieldRecord;
                    }

                    schemaCache[objectName] = data;
                    setSchema(data);
                    setLoading(false);
                } else {
                    // Trigger fallback
                    throw new Error('Not found');
                }
            })
            .catch(() => {
                // Fallback: Fetch all
                fetch('/api/metadata/object', { headers: getHeaders() })
                    .then(res => res.json())
                    .then(result => {
                        const list = Array.isArray(result) ? result : (result.object || result.data || []);
                        const found = list.find((o: any) => o.name === objectName);
                        if (found) {
                            schemaCache[objectName] = found;
                            setSchema(found);
                             setError(null);
                        } else {
                            setError(new Error('Object not found'));
                        }
                    })
                    .catch(e => setError(e))
                    .finally(() => setLoading(false));
            });

    }, [objectName]);

    return { schema, loading, error };
}
