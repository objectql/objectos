import { Pool } from "pg";

let authInstance: any;

export const getAuth = async () => {
    if (authInstance) return authInstance;
    const { betterAuth } = await import("better-auth");
    const { organization } = await import("better-auth/plugins");
    const { role } = await import("better-auth/plugins/access");
    
    try {
        const pool = new Pool({
            connectionString: process.env.OBJECTQL_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/objectql'
        });
        authInstance = betterAuth({
            database: pool,
            baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000/api/auth",
            trustedOrigins: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3000"],
            emailAndPassword: {
                enabled: true
            },
            user: {
                additionalFields: {
                    role: {
                        type: "string",
                        required: false,
                        defaultValue: 'user'
                    }
                }
            },
            databaseHooks: {
                user: {
                    create: {
                        before: async (user) => {
                            try {
                                const result = await pool.query('SELECT count(*) FROM "user"');
                                const count = parseInt(result.rows[0].count);
                                const role = count === 0 ? 'super_admin' : 'user';
                                console.log(`Creating user with role: ${role} (current count: ${count})`);
                                return {
                                    data: {
                                        ...user,
                                        role
                                    }
                                };
                            } catch (e) {
                                console.error("Error in user create hook:", e);
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
                    creatorRole: 'owner',
                    roles: {
                        owner: role({
                            organization: ['update', 'delete', 'read'],
                            member: ['create', 'update', 'delete', 'read'],
                            invitation: ['create', 'cancel', 'read'],
                            team: ['create', 'update', 'delete', 'read']
                        }),
                        admin: role({
                            organization: ['update', 'read'],
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

export default { getAuth };

