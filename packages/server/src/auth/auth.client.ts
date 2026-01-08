import { Pool } from "pg";

let authInstance: any;

export const getAuth = async () => {
    if (authInstance) return authInstance;
    const { betterAuth } = await import("better-auth");
    
    authInstance = betterAuth({
        database: {
            provider: "postgres",
            pool: new Pool({
                connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/objectql'
            })
        },
        emailAndPassword: {
            enabled: true
        }
    });
    return authInstance;
};

