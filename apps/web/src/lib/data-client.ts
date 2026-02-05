import { authClient } from "./auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"; // Default to NestJS port

export const dataClient = {
    async find(object: string, query: any = {}) {
        const session = await authClient.getSession();
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        
        // better-auth handles cookies, but for API calls we might need token if using bearer
        // or just rely on cookie proxy if same domain.
        
        // Construct standard ObjectQL REST Query
        // GET /api/data/:object?query=... is one way, but ObjectQL typically uses JSON body for complex queries via RPC or custom endpoints
        // Standard REST adapter: GET /api/data/:object
        
        const queryString = query ? `?q=${encodeURIComponent(JSON.stringify(query))}` : "";
        const res = await fetch(`${API_BASE}/data/${object}${queryString}`, {
            headers
        });
        
        if (!res.ok) throw new Error(`Data fetch failed: ${res.statusText}`);
        return res.json();
    },

    async create(object: string, doc: any) {
        const res = await fetch(`${API_BASE}/data/${object}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(doc)
        });
        if (!res.ok) throw new Error(`Create failed: ${res.statusText}`);
        return res.json();
    },

    async update(object: string, id: string, doc: any) {
        const res = await fetch(`${API_BASE}/data/${object}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(doc)
        });
        if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
        return res.json();
    },

    async delete(object: string, id: string) {
        const res = await fetch(`${API_BASE}/data/${object}/${id}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
        return true;
    }
};
