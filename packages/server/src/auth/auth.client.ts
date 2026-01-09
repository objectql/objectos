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
            trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
            emailAndPassword: {
                enabled: true
            },
            databaseHooks: {
                user: {
                    create: {
                        before: async (user) => {
                            try {
                                const result = await pool.query('SELECT count(*) FROM "user"');
                                const count = parseInt(result.rows[0].count);
                                return {
                                    data: {
                                        ...user,
                                        role: count === 0 ? 'super_admin' : 'user'
                                    }
                                };
                            } catch (e) {
                                return { data: user };
                            }
                        }
                    }
                }
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
                    creatorRole: 'admin',
                    roles: {
                        admin: role({
                            organization: ['update', 'delete', 'read'],
                            member: ['create', 'update', 'delete', 'read'],
                            invitation: ['create', 'cancel', 'read'],
                            team: ['create', 'update', 'delete', 'read']
                        }),
                        user: role({
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

