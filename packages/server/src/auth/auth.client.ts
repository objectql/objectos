import { Pool } from "pg";

let authInstance: any;

export const getAuth = async () => {
    if (authInstance) return authInstance;
    const { betterAuth } = await import("better-auth");
    const { organization } = await import("better-auth/plugins");
    const { role } = await import("better-auth/plugins/access");
    
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/objectql'
        });
        authInstance = betterAuth({
            database: pool,
            trustedOrigins: ["http://localhost:5173"],
            emailAndPassword: {
                enabled: true
            },
            plugins: [
                organization({
                    // Enable role-based access control
                    dynamicAccessControl: {
                        enabled: true
                    },
                    // Enable teams feature
                    teams: {
                        enabled: true
                    },
                    // Define default organization roles with permissions
                    roles: {
                        owner: role({
                            organization: ['create', 'read', 'update', 'delete'],
                            member: ['create', 'read', 'update', 'delete'],
                            invitation: ['create', 'read', 'delete'],
                            team: ['create', 'read', 'update', 'delete']
                        }),
                        admin: role({
                            organization: ['read', 'update'],
                            member: ['create', 'read', 'update', 'delete'],
                            invitation: ['create', 'read', 'delete'],
                            team: ['create', 'read', 'update']
                        }),
                        member: role({
                            organization: ['read'],
                            member: ['read'],
                            team: ['read']
                        })
                    }
                })
            ]
        });
        return authInstance;
    } catch (e: any) {
        console.error("Better Auth Initialization Error:", e);
        throw e;
    }
};

