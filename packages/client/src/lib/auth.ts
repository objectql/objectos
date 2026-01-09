export const authClient = {
    baseUrl: '/api/auth',
    async signIn(email: string, password: string) {
        const res = await fetch(`${this.baseUrl}/sign-in/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },
    async signUp(email: string, password: string, name: string) {
        const res = await fetch(`${this.baseUrl}/sign-up/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
            credentials: 'include'
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },
    async signOut() {
        try {
            await fetch(`${this.baseUrl}/sign-out`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
        } catch (e) {
            console.error("Sign out error:", e);
        }
    },
    async getSession() {
        const res = await fetch(`${this.baseUrl}/get-session?_t=${Date.now()}`, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache'
            },
            credentials: 'include'
        });
        if (!res.ok) return null;
        return res.json();
    }
};
