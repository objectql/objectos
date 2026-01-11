import { HookContext, ObjectQLContext } from '@objectql/types';

// Optional if filename matches object name, but good practice.
export const listenTo = 'projects';

export async function beforeFind(context: any) {
    // Safety check for context
    if (!context || !context.ctx) {
        // console.warn('[File Hook] Projects: Missing context or ctx');
        return;
    }

    if (!context.ctx.isSystem && context.ctx.userId) {
        console.log(`[File Hook] Projects: Restricting access for ${context.ctx.userId}`);
        context.utils.restrict(['owner', '=', context.ctx.userId]);
    }
}

export async function beforeCreate(context: any) {
    if (context.doc) {
        if (!context.doc.owner && context.ctx.userId) {
            console.log(`[File Hook] Projects: Auto-assigning owner ${context.ctx.userId}`);
            context.doc.owner = context.ctx.userId;
        }
    }
}

// Actions are now in projects.action.ts

