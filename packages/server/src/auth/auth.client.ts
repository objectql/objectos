
let authInstance: any;

export const getAuth = async () => {
    if (authInstance) return authInstance;
    const { betterAuth } = await import("better-auth");
    const { organization } = await import("better-auth/plugins");
    const { role } = await import("better-auth/plugins/access");
    
    try {
        let database;
        const dbUrl = process.env.OBJECTQL_DATABASE_URL;
        const isPostgres = dbUrl && dbUrl.startsWith('postgres');
        const isMongo = dbUrl && dbUrl.startsWith('mongodb');

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
             console.log(`Initializing Better-Auth with SQLite database: ${filename}`);
             database = new Database(filename);
        }

        authInstance = betterAuth({
            database: database,
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
        return authInstance;
    } catch (e: any) {
        console.error("Better Auth Initialization Error:", e);
        throw e;
    }
};

export default { getAuth };

