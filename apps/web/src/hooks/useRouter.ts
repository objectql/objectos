import { useState, useEffect, useCallback } from 'react';

export function useRouter() {
    const [path, setPath] = useState(window.location.pathname);

    useEffect(() => {
        const onPopState = () => setPath(window.location.pathname);
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);
    
    const navigate = useCallback((newPath: string) => {
        window.history.pushState({}, '', newPath);
        setPath(newPath);
        // Dispatch popstate event to notify other listeners (like App.tsx if it listens)
        window.dispatchEvent(new Event('popstate')); 
    }, []);
    
    return { path, navigate };
}
