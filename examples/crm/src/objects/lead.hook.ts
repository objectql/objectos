import { HookContext, Hook } from '@objectstack/spec/data';

const leadHook: Hook = {
  name: 'lead_automation',
  object: 'lead',
  events: ['beforeInsert', 'afterUpdate'],
  handler: (async (ctx: HookContext) => {
    if (ctx.event === 'beforeInsert') {
      const { input } = ctx;
      // Auto-score logic (mock)
      let score = 0;
      if (
        input.email &&
        typeof input.email === 'string' &&
        input.email.endsWith('@enterprise.com')
      ) {
        score += 50;
      }
      if (input.phone) {
        score += 20;
      }
      (input as Record<string, unknown>).score = score;
    }

    if (ctx.event === 'afterUpdate') {
      const { input, previous } = ctx;
      // Detect status change to 'qualified'
      if (input.status === 'qualified' && previous && previous.status !== 'qualified') {
        console.log('Lead qualified! Ready for conversion.');
      }
    }
  }) as (...args: unknown[]) => unknown,
};

export default leadHook;
