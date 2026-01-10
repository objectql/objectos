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
    signUp: (email: string, password: string, name: string) => Promise<void>;
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
        // Refresh session to Ensure we get the full session object
        const sessionData = await authClient.getSession();
        if (sessionData.data) {
            setUser(sessionData.data.user);
            setSession(sessionData.data.session);
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        const { error } = await authClient.signUp.email({
            email,
            password,
            name
        });
        if (error) throw error;
        // Refresh session
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
        <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
