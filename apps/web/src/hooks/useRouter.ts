import { useNavigate, useLocation } from 'react-router-dom';

export function useRouter() {
    const navigate = useNavigate();
    const location = useLocation();

    return {
        path: location.pathname,
        navigate: (path: string) => navigate(path),
        search: location.search
    };
}
