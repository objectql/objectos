import { useParams } from 'react-router-dom';
import { ObjectListView } from '../../components/dashboard/ObjectListView';
import { useObjectSchema } from '../../hooks/useObjectSchema';
import { useAuth } from '../../context/AuthContext';
import { ObjectNotFound } from '../../components/dashboard/ObjectNotFound';
import { Spinner } from '@objectos/ui';
import { useRouter } from '../../hooks/useRouter';

export function ObjectListRoute({ isCreating = false }: { isCreating?: boolean }) {
    const { objectName } = useParams();
    const { schema, loading, error } = useObjectSchema(objectName || '');
    const { user } = useAuth();
    const { navigate } = useRouter();

    if (loading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;
    
    // In React Router v6, error boundary is better, but simple check works
    if (error || !schema) return <ObjectNotFound objectName={objectName || ''} />;

    return (
        <ObjectListView 
            objectName={objectName!} 
            user={user}
            isCreating={isCreating}
            navigate={navigate}
            objectSchema={schema}
        />
    );
}
