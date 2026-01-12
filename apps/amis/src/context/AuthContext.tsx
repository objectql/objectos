import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '../lib/auth';

interface User {
    id: string;
    email: string;
    name?: string;
    [key: string]: any;
}

interface Session {
    session: {
        id: string;
        userId: string;
        activeOrganizationId?: string | null;
        [key: string]: any;
    };
    user: User;
}

interface AuthContextType {
    user: User | null;
    session: Session["session"] | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session["session"] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authClient.getSession().then(({ data }) => {
            if (data?.user) {
                setUser(data.user);
                setSession(data.session);
            } else {
                setUser(null);
                setSession(null);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await authClient.signIn.email({
            email,
            password
        });
        if (error) throw error;
        const sessionData = await authClient.getSession();
        if (sessionData.data) {
            setUser(sessionData.data.user);
            setSession(sessionData.data.session);
        }
    };

    const signOut = async () => {
        await authClient.signOut();
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
