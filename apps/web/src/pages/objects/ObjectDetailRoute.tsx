import { useParams } from 'react-router-dom';
import { ObjectDetailView } from '../../components/dashboard/ObjectDetailView';
import { useObjectSchema } from '../../hooks/useObjectSchema';
import { ObjectNotFound } from '../../components/dashboard/ObjectNotFound';
import { Spinner } from '@objectos/ui';
import { useRouter } from '../../hooks/useRouter';

export function ObjectDetailRoute() {
    const { objectName, recordId } = useParams(); // Matches /view/:recordId
    // Also support legacy param if needed by checking path, but let's stick to standard params
    const id = recordId; 

    const { schema, loading, error } = useObjectSchema(objectName || '');
    const { navigate } = useRouter();

    if (loading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;
    if (error || !schema) return <ObjectNotFound objectName={objectName || ''} />;

    return (
        <ObjectDetailView 
            objectName={objectName!} 
            recordId={id!} 
            navigate={navigate}
            objectSchema={schema}
        />
    );
}
