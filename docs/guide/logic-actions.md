# Custom Actions Guide

Actions are custom business logic endpoints that extend ObjectOS beyond standard CRUD operations. Use actions to encapsulate complex business processes, integrate with external systems, or provide specialized functionality.

## What Are Actions?

Actions are custom API endpoints that:

- Execute complex business logic
- Orchestrate multiple operations
- Integrate with external services
- Provide specialized functionality beyond CRUD

Unlike hooks (which intercept standard operations), actions are explicitly invoked endpoints.

## When to Use Actions

Use actions when you need to:

- **Batch Operations**: Update multiple records with custom logic
- **Complex Workflows**: Implement multi-step processes
- **External Integration**: Call third-party APIs
- **Calculations**: Perform complex computations
- **File Processing**: Handle uploads, conversions, etc.
- **Reports**: Generate custom reports or exports

## Defining Actions

### Method 1: Programmatic Registration

Register actions using the kernel:

```typescript
import { ObjectOS } from '@objectos/kernel';

const kernel = new ObjectOS();

kernel.registerAction('contacts.sendEmail', async (ctx) => {
  const { id, subject, body } = ctx.params;
  
  // Get contact
  const contact = await kernel.findOne('contacts', id);
  
  // Send email
  await sendEmail({
    to: contact.email,
    subject: subject,
    body: body
  });
  
  return {
    success: true,
    message: 'Email sent successfully'
  };
});
```

### Method 2: Action Files (YAML)

Define actions in `.action.yml` files:

```yaml
# actions/send-email.action.yml
name: contacts.sendEmail
label: Send Email
description: Send email to a contact
object: contacts

parameters:
  id:
    type: string
    required: true
    description: Contact ID
  
  subject:
    type: string
    required: true
    description: Email subject
  
  body:
    type: string
    required: true
    description: Email body

handler: ./handlers/send-email.ts
```

Handler file:

```typescript
// handlers/send-email.ts
export async function handler(ctx) {
  const { id, subject, body } = ctx.params;
  
  const contact = await ctx.kernel.findOne('contacts', id);
  
  await sendEmail({
    to: contact.email,
    subject,
    body
  });
  
  return {
    success: true,
    message: 'Email sent successfully'
  };
}
```

## Action Context

Actions receive a context object with:

```typescript
interface ActionContext {
  // Action parameters
  params: Record<string, any>;
  
  // Current user
  user: {
    id: string;
    email: string;
    roles: string[];
  };
  
  // Kernel instance for data operations
  kernel: ObjectOS;
  
  // Request metadata
  request?: {
    ip: string;
    userAgent: string;
  };
}
```

## Common Action Patterns

### 1. Batch Update

Update multiple records with custom logic:

```typescript
kernel.registerAction('opportunities.updateStage', async (ctx) => {
  const { ids, stage } = ctx.params;
  
  // Validate stage
  const validStages = ['prospecting', 'qualification', 'proposal', 'negotiation'];
  if (!validStages.includes(stage)) {
    throw new Error('Invalid stage');
  }
  
  // Update all opportunities
  const results = [];
  for (const id of ids) {
    const updated = await ctx.kernel.update('opportunities', id, { stage });
    results.push(updated);
  }
  
  return {
    updated: results.length,
    records: results
  };
});
```

**Usage:**
```bash
POST /api/actions/opportunities.updateStage
{
  "ids": ["opp_1", "opp_2", "opp_3"],
  "stage": "qualification"
}
```

### 2. Complex Workflow

Orchestrate multi-step processes:

```typescript
kernel.registerAction('opportunities.convertToOrder', async (ctx) => {
  const { opportunityId } = ctx.params;
  
  // 1. Get opportunity
  const opportunity = await ctx.kernel.findOne('opportunities', opportunityId);
  
  if (opportunity.stage !== 'closed_won') {
    throw new Error('Can only convert closed-won opportunities');
  }
  
  // 2. Create sales order
  const order = await ctx.kernel.insert('sales_orders', {
    account: opportunity.account,
    amount: opportunity.amount,
    status: 'pending',
    opportunity: opportunityId
  });
  
  // 3. Update opportunity
  await ctx.kernel.update('opportunities', opportunityId, {
    converted_to_order: true,
    sales_order: order.id
  });
  
  // 4. Send notification
  await sendEmail({
    to: opportunity.owner.email,
    subject: 'Opportunity Converted',
    body: `Opportunity ${opportunity.name} has been converted to order ${order.number}`
  });
  
  return {
    success: true,
    order: order,
    message: 'Opportunity converted to order'
  };
});
```

### 3. External Integration

Integrate with third-party services:

```typescript
kernel.registerAction('accounts.enrichFromClearbit', async (ctx) => {
  const { accountId } = ctx.params;
  
  // Get account
  const account = await ctx.kernel.findOne('accounts', accountId);
  
  // Call Clearbit API
  const response = await fetch(
    `https://company.clearbit.com/v2/companies/find?domain=${account.website}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLEARBIT_API_KEY}`
      }
    }
  );
  
  const data = await response.json();
  
  // Update account with enriched data
  const updated = await ctx.kernel.update('accounts', accountId, {
    industry: data.category.industry,
    employee_count: data.metrics.employees,
    annual_revenue: data.metrics.estimatedAnnualRevenue,
    description: data.description
  });
  
  return {
    success: true,
    enriched_fields: ['industry', 'employee_count', 'annual_revenue', 'description'],
    account: updated
  };
});
```

### 4. Data Export

Generate custom exports:

```typescript
kernel.registerAction('contacts.exportToCSV', async (ctx) => {
  const { filters } = ctx.params;
  
  // Query contacts
  const contacts = await ctx.kernel.find('contacts', {
    filters: filters || {},
    fields: ['first_name', 'last_name', 'email', 'phone', 'account.name'],
    limit: 10000
  });
  
  // Generate CSV
  const csv = [
    ['First Name', 'Last Name', 'Email', 'Phone', 'Account'],
    ...contacts.map(c => [
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.account?.name || ''
    ])
  ].map(row => row.join(',')).join('\n');
  
  return {
    success: true,
    filename: `contacts-${Date.now()}.csv`,
    content: csv,
    count: contacts.length
  };
});
```

### 5. Calculations

Perform complex calculations:

```typescript
kernel.registerAction('accounts.calculateHealthScore', async (ctx) => {
  const { accountId } = ctx.params;
  
  const account = await ctx.kernel.findOne('accounts', accountId);
  
  // Get opportunities
  const opportunities = await ctx.kernel.find('opportunities', {
    filters: { account: accountId }
  });
  
  // Get contacts
  const contacts = await ctx.kernel.find('contacts', {
    filters: { account: accountId }
  });
  
  // Calculate health score
  let score = 0;
  
  // Revenue factor
  if (account.annual_revenue > 1000000) score += 30;
  else if (account.annual_revenue > 100000) score += 20;
  else score += 10;
  
  // Opportunity factor
  score += Math.min(opportunities.length * 5, 30);
  
  // Contact factor
  score += Math.min(contacts.length * 3, 20);
  
  // Activity factor (last 90 days)
  const recentOpps = opportunities.filter(o => {
    const created = new Date(o.created_at);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    return created > ninetyDaysAgo;
  });
  score += Math.min(recentOpps.length * 10, 20);
  
  // Update account
  await ctx.kernel.update('accounts', accountId, {
    health_score: score
  });
  
  return {
    success: true,
    score: score,
    factors: {
      revenue: account.annual_revenue > 1000000 ? 30 : account.annual_revenue > 100000 ? 20 : 10,
      opportunities: Math.min(opportunities.length * 5, 30),
      contacts: Math.min(contacts.length * 3, 20),
      recent_activity: Math.min(recentOpps.length * 10, 20)
    }
  };
});
```

### 6. Bulk Import

Handle bulk data imports:

```typescript
kernel.registerAction('contacts.importFromCSV', async (ctx) => {
  const { csvData } = ctx.params;
  
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim();
    });
    
    try {
      // Check if contact exists
      const existing = await ctx.kernel.find('contacts', {
        filters: { email: row.email },
        limit: 1
      });
      
      if (existing.length > 0) {
        // Update
        await ctx.kernel.update('contacts', existing[0].id, row);
        results.updated++;
      } else {
        // Create
        await ctx.kernel.insert('contacts', row);
        results.created++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: i,
        email: row.email,
        error: error.message
      });
    }
  }
  
  return {
    success: true,
    results: results
  };
});
```

## Action Permissions

Control who can execute actions:

```yaml
# actions/send-email.action.yml
name: contacts.sendEmail
permissions:
  allow: ['sales', 'admin']
```

Or in code:

```typescript
kernel.registerAction('contacts.sendEmail', async (ctx) => {
  // Check permissions
  if (!ctx.user.roles.includes('admin') && !ctx.user.roles.includes('sales')) {
    throw new Error('Permission denied');
  }
  
  // Action logic...
}, {
  permissions: ['sales', 'admin']
});
```

## Calling Actions

### From API

```bash
POST /api/actions/{actionName}
Content-Type: application/json
Authorization: Bearer <token>

{
  "param1": "value1",
  "param2": "value2"
}
```

### From Code

```typescript
const result = await kernel.executeAction('contacts.sendEmail', {
  id: 'contact_123',
  subject: 'Hello',
  body: 'Test email'
}, ctx);
```

### From UI

```typescript
import { useAction } from '@objectos/ui';

function ContactDetail({ contactId }) {
  const sendEmail = useAction('contacts.sendEmail');
  
  const handleSendEmail = async () => {
    const result = await sendEmail({
      id: contactId,
      subject: 'Follow up',
      body: 'Thank you for your interest'
    });
    
    alert(result.message);
  };
  
  return (
    <button onClick={handleSendEmail}>
      Send Email
    </button>
  );
}
```

## Error Handling

Handle errors gracefully:

```typescript
kernel.registerAction('opportunities.convert', async (ctx) => {
  try {
    // Action logic...
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});
```

## Testing Actions

Test actions like any other function:

```typescript
import { ObjectOS } from '@objectos/kernel';
import { createMockDriver } from '@objectos/test-utils';

describe('contacts.sendEmail', () => {
  let kernel: ObjectOS;
  
  beforeEach(() => {
    kernel = new ObjectOS();
    kernel.useDriver(createMockDriver());
    
    // Register action
    kernel.registerAction('contacts.sendEmail', async (ctx) => {
      // Action logic...
    });
  });
  
  it('should send email', async () => {
    const result = await kernel.executeAction('contacts.sendEmail', {
      id: 'contact_123',
      subject: 'Test',
      body: 'Test email'
    });
    
    expect(result.success).toBe(true);
  });
});
```

## Best Practices

1. **Validate Input**: Always validate parameters
2. **Handle Errors**: Catch and return meaningful errors
3. **Check Permissions**: Verify user has rights to execute action
4. **Use Transactions**: Wrap multiple operations in transactions
5. **Log Activity**: Log action execution for auditing
6. **Return Useful Data**: Return actionable results
7. **Document Actions**: Provide clear descriptions and examples

## Advanced: Action Plugins

Create reusable action libraries:

```typescript
// plugins/email-actions.ts
export function EmailActionsPlugin(kernel: ObjectOS) {
  kernel.registerAction('contacts.sendEmail', async (ctx) => {
    // Send email logic
  });
  
  kernel.registerAction('contacts.sendBulkEmail', async (ctx) => {
    // Bulk email logic
  });
  
  kernel.registerAction('contacts.scheduleEmail', async (ctx) => {
    // Schedule email logic
  });
}

// Usage
import { EmailActionsPlugin } from './plugins/email-actions';
EmailActionsPlugin(kernel);
```

## Related Documentation

- [Logic Hooks](./logic-hooks.md) - Intercept standard operations
- [Security Guide](./security-guide.md) - Configure permissions
- [SDK Reference](./sdk-reference.md) - Complete API reference
