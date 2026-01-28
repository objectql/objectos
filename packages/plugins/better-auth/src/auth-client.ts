/**
 * Better-Auth Client Configuration
 * 
 * This module provides the Better-Auth instance configuration
 * with support for multiple database backends (PostgreSQL, MongoDB, SQLite)
 */

let authInstance: any;

export interface BetterAuthConfig {
    databaseUrl?: string;
    baseURL?: string;
    trustedOrigins?: string[];
}

export const getBetterAuth = async (config: BetterAuthConfig = {}) => {
    if (authInstance) return authInstance;
    
    const { betterAuth } = await import("better-auth");
    const { organization } = await import("better-auth/plugins");
    const { role } = await import("better-auth/plugins/access");
    
    try {
        let database;
        const dbUrl = config.databaseUrl || process.env.OBJECTQL_DATABASE_URL;
        const isPostgres = dbUrl && dbUrl.startsWith('postgres');
        const isMongo = dbUrl && dbUrl.startsWith('mongodb');

        // Initialize database connection based on database type
        if (isPostgres) {
            const { Pool } = await import("pg");
            database = new Pool({
                connectionString: dbUrl!
            });
        } else if (isMongo) {
            const { MongoClient } = await import("mongodb");
            const client = new MongoClient(dbUrl!);
            await client.connect();
            database = client.db();
        } else {
            const sqlite3Import = await import("better-sqlite3");
            // Handle both ESM/Interop (default export) and CJS (direct export)
            const Database = (sqlite3Import.default || sqlite3Import) as any;
            const filename = (dbUrl && dbUrl.replace('sqlite:', '')) ? (dbUrl && dbUrl.replace('sqlite:', '')) : 'objectos.db';
            console.log(`[Better-Auth Plugin] Initializing with SQLite database: ${filename}`);
            database = new Database(filename);
        }

        // Configure Better-Auth with organization and role plugins
        authInstance = betterAuth({
            database: database,
            baseURL: config.baseURL || process.env.BETTER_AUTH_URL || "http://localhost:3000/api/auth",
            trustedOrigins: config.trustedOrigins || [
                "http://localhost:5173", 
                "http://localhost:3000", 
                "http://[::1]:3000", 
                "http://[::1]:5173"
            ],
            emailAndPassword: {
                enabled: true
            },
            user: {
                additionalFields: {
                    role: {
                        type: "string",
                        required: false,
                        defaultValue: 'user',
                        input: false
                    }
                }
            },
            databaseHooks: {
                user: {
                    create: {
                        before: async (user) => {
                            try {
                                let count = 0;
                                
                                // Get user count to determine if this is the first user (admin)
                                if (isPostgres) {
                                    const result = await database.query('SELECT count(*) FROM "user"');
                                    count = parseInt(result.rows[0].count);
                                } else if (isMongo) {
                                    const collection = database.collection('user');
                                    count = await collection.countDocuments();
                                } else {
                                    try {
                                        const stmt = database.prepare('SELECT count(*) as count FROM user');
                                        const result = stmt.get() as any;
                                        count = result.count;
                                    } catch {
                                        count = 0;
                                    }
                                }

                                // First user gets super_admin role
                                const role = count === 0 ? 'super_admin' : 'user';
                                console.log(`[Better-Auth Plugin] Creating user with role: ${role} (current count: ${count})`);
                                
                                return {
                                    data: {
                                        ...user,
                                        role
                                    }
                                };
                            } catch (e) {
                                console.error("[Better-Auth Plugin] Error in user create hook:", e);
                                return { data: user };
                            }
                        }
                    }
                }
            },
            plugins: [
                organization({
                    dynamicAccessControl: {
                        enabled: true
                    },
                    teams: {
                        enabled: true
                    },
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
        
        console.log('[Better-Auth Plugin] Initialized successfully');
        return authInstance;
    } catch (e: any) {
        console.error("[Better-Auth Plugin] Initialization Error:", e);
        throw e;
    }
};

export const resetAuthInstance = () => {
    authInstance = undefined;
};

export default { getBetterAuth, resetAuthInstance };
