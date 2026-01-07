import { ObjectQL } from '@objectql/core';

export interface BetterAuthAdapterOptions {
    objectql: ObjectQL;
}

export function objectQLAdapter(options: BetterAuthAdapterOptions) {
    const { objectql } = options;
    
    // Helper to get helper context
    const getCtx = () => objectql.createContext({ isSystem: true });

    return {
        id: "objectql-adapter",
        
        async create(data: any) {
            // This is a placeholder. better-auth usually passes model name and data.
            // We need to see the exact signature.
            // Assuming generic adapter call: create({ model: 'user', data: ... })
            return null;
        },

        // Detailed implementation of DB operations for User, Session, Account models
        // Since better-auth adapter API is specific, we implement standard methods consumers expect
        
        async createUser(data: any) {
            const repo = getCtx().object('user');
            return await repo.create(data);
        },

        async getUser(id: string) {
            const repo = getCtx().object('user');
            return await repo.findOne(id);
        },

        async getUserByEmail(email: string) {
            const repo = getCtx().object('user');
            const [user] = await repo.find({ filters: [['email', '=', email]], limit: 1 });
            return user || null;
        },

        async updateUser(id: string, data: any) {
            const repo = getCtx().object('user');
            return await repo.update(id, data);
        },
        
        async deleteUser(id: string) {
            const repo = getCtx().object('user');
            await repo.delete(id);
        },

        async linkAccount(data: any) {
            const repo = getCtx().object('account');
            return await repo.create(data);
        },

        async getAccount(providerId: string, providerAccountId: string) {
             const repo = getCtx().object('account');
             const [account] = await repo.find({ 
                 filters: [['providerId', '=', providerId], 'and', ['providerAccountId', '=', providerAccountId]], 
                 limit: 1 
             });
             return account || null;
        },

        async createSession(data: any) {
            const repo = getCtx().object('session');
            return await repo.create(data);
        },

        async getSessionAndUser(sessionToken: string) {
            const sessionRepo = getCtx().object('session');
            const userRepo = getCtx().object('user');
            
            const [session] = await sessionRepo.find({ filters: [['token', '=', sessionToken]], limit: 1 });
            if (!session) return null;

            const user = await userRepo.findOne(session.userId);
            if (!user) return null;

            return { session, user };
        },

        async updateSession(sessionToken: string, data: any) {
            const repo = getCtx().object('session');
            // We need find it first to get ID, or updateMany if supported
            const [session] = await repo.find({ filters: [['token', '=', sessionToken]], limit: 1 });
            if (!session) return null;
            return await repo.update(session._id, data);
        },

        async deleteSession(sessionToken: string) {
            const repo = getCtx().object('session');
            const [session] = await repo.find({ filters: [['token', '=', sessionToken]], limit: 1 });
            if (session) {
                await repo.delete(session._id);
            }
        },

        async createVerificationToken(data: any) {
             const repo = getCtx().object('verification');
             return await repo.create(data);
        },

        async useVerificationToken(identifier: string, token: string) {
             const repo = getCtx().object('verification');
             const [verification] = await repo.find({ 
                 filters: [['identifier', '=', identifier], 'and', ['value', '=', token]], 
                 limit: 1 
             });
             if (!verification) return null;
             
             await repo.delete(verification._id);
             return verification;
        }
    };
}
