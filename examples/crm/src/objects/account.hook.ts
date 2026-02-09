
import { HookContext, Hook } from '@objectstack/spec/data';

const accountHook: Hook = {
    name: 'account_protection',
    object: 'account',
    events: ['beforeInsert', 'beforeUpdate', 'beforeDelete'],
    handler: (async (ctx: HookContext) => {
        const { input } = ctx;

        if (ctx.event === 'beforeInsert' || ctx.event === 'beforeUpdate') {
            // Validation: Ensure website is valid format if provided
            if (input.website && typeof input.website === 'string' && !input.website.startsWith('http')) {
                throw new Error('Website must start with http or https');
            }
        }

        if (ctx.event === 'beforeDelete') {
             // Prevent deletion of 'Strategic' accounts
             if (ctx.previous && ctx.previous.type === 'Strategic') {
                 throw new Error('Cannot delete Strategic accounts');
             }
        }
    }) as (...args: unknown[]) => unknown
};

export default accountHook;
