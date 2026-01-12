import { useRouter } from '../../hooks/useRouter';

interface ObjectNotFoundProps {
    objectName: string;
}

export function ObjectNotFound({ objectName }: ObjectNotFoundProps) {
    const { navigate } = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <div className="p-6 bg-red-50 rounded-full mb-4">
                <i className="ri-error-warning-line text-4xl text-red-500"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Object Not Found</h2>
            <p className="text-muted-foreground mt-2 max-w-md text-center">
                The object "{objectName}" does not exist or you do not have permission to view it.
            </p>
            <button 
                onClick={() => navigate('/')}
                className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
                Return to Dashboard
            </button>
        </div>
    );
}
