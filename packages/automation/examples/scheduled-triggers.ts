/**
 * Scheduled Trigger Examples
 *
 * Demonstrates how to use scheduled triggers with cron expressions
 */

import type { AutomationRule } from '@objectos/plugin-automation';

// Example 1: Daily report generation
export const dailyReportRule: AutomationRule = {
  id: 'daily_sales_report',
  name: 'Daily Sales Report',
  description: 'Generate and email daily sales report at 8 AM',
  status: 'active',
  trigger: {
    type: 'scheduled',
    cronExpression: '0 8 * * *', // Every day at 8:00 AM
    timezone: 'America/New_York',
  },
  actions: [
    {
      type: 'execute_script',
      script: `
                // Calculate yesterday's sales
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                const sales = await ctx.context.opportunities.filter({
                    closedDate: yesterday,
                    stage: 'closed_won'
                });
                
                const totalRevenue = sales.reduce((sum, opp) => sum + opp.amount, 0);
                const dealCount = sales.length;
                
                ctx.context.reportData = {
                    date: yesterday.toISOString().split('T')[0],
                    totalRevenue,
                    dealCount,
                    averageDealSize: dealCount > 0 ? totalRevenue / dealCount : 0
                };
            `,
      language: 'javascript',
    },
    {
      type: 'send_email',
      to: ['sales@company.com', 'management@company.com'],
      subject: 'Daily Sales Report - {{#now}}{{#format}}"YYYY-MM-DD"{{/format}}{{/now}}',
      body: `Daily Sales Report

Date: {{reportData.date}}
Total Revenue: \${{reportData.totalRevenue}}
Deals Closed: {{reportData.dealCount}}
Average Deal Size: \${{reportData.averageDealSize}}

Have a great day!`,
    },
  ],
  priority: 100,
  createdAt: new Date(),
};

// Example 2: Weekly backup
export const weeklyBackupRule: AutomationRule = {
  id: 'weekly_backup',
  name: 'Weekly Data Backup',
  description: 'Backup critical data every Sunday at midnight',
  status: 'active',
  trigger: {
    type: 'scheduled',
    cronExpression: '0 0 * * 0', // Every Sunday at midnight
    timezone: 'UTC',
  },
  actions: [
    {
      type: 'http_request',
      url: 'https://api.backup-service.com/trigger',
      method: 'POST',
      headers: {
        Authorization: 'Bearer {{backup_api_key}}',
        'Content-Type': 'application/json',
      },
      body: {
        type: 'full_backup',
        timestamp: '{{#now}}{{/now}}',
        databases: ['objectstack_main', 'objectstack_audit'],
      },
    },
  ],
  priority: 100,
  createdAt: new Date(),
};

// Example 3: Monthly subscription renewal reminders
export const monthlyRenewalRemindersRule: AutomationRule = {
  id: 'monthly_renewal_reminders',
  name: 'Monthly Subscription Renewal Reminders',
  description: 'Send renewal reminders on the 1st of every month',
  status: 'active',
  trigger: {
    type: 'scheduled',
    cronExpression: '0 9 1 * *', // 9 AM on the 1st of every month
    timezone: 'America/Los_Angeles',
  },
  actions: [
    {
      type: 'execute_script',
      script: `
                // Find subscriptions expiring in the next 30 days
                const today = new Date();
                const thirtyDaysFromNow = new Date(today);
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                
                const expiringSubscriptions = await ctx.context.subscriptions.filter({
                    endDate: { 
                        $gte: today,
                        $lte: thirtyDaysFromNow
                    },
                    status: 'active'
                });
                
                for (const subscription of expiringSubscriptions) {
                    const customer = await ctx.context.customers.get(subscription.customerId);
                    
                    await ctx.context.sendEmail({
                        to: customer.email,
                        subject: 'Subscription Renewal Reminder',
                        body: \`Dear \${customer.name},
                        
Your subscription (\${subscription.planName}) will expire on \${subscription.endDate}.

Please renew to continue enjoying our services.

Best regards,
ObjectStack Team\`
                    });
                }
                
                ctx.logger.info(\`Sent \${expiringSubscriptions.length} renewal reminders\`);
            `,
      language: 'javascript',
      timeout: 30000,
    },
  ],
  priority: 90,
  createdAt: new Date(),
};

// Example 4: Hourly data sync
export const hourlyDataSyncRule: AutomationRule = {
  id: 'hourly_data_sync',
  name: 'Hourly External System Sync',
  description: 'Sync data with external system every hour',
  status: 'active',
  trigger: {
    type: 'scheduled',
    cronExpression: '0 * * * *', // Every hour at minute 0
    timezone: 'UTC',
  },
  actions: [
    {
      type: 'http_request',
      url: 'https://external-api.com/sync',
      method: 'GET',
      headers: {
        Authorization: 'Bearer {{external_api_token}}',
      },
      timeout: 60000, // 1 minute timeout
    },
    {
      type: 'create_record',
      objectName: 'sync_log',
      fields: {
        syncType: 'hourly_external',
        syncedAt: '{{#now}}{{/now}}',
        status: 'completed',
      },
    },
  ],
  priority: 80,
  createdAt: new Date(),
};

// Example 5: Business hours reminder (every weekday at 9 AM)
export const businessHoursReminderRule: AutomationRule = {
  id: 'business_hours_reminder',
  name: 'Daily Task Reminder',
  description: 'Send task reminders every weekday morning',
  status: 'active',
  trigger: {
    type: 'scheduled',
    cronExpression: '0 9 * * 1-5', // Monday through Friday at 9:00 AM
    timezone: 'America/New_York',
  },
  actions: [
    {
      type: 'execute_script',
      script: `
                const users = await ctx.context.users.filter({ status: 'active' });
                
                for (const user of users) {
                    const tasks = await ctx.context.tasks.filter({
                        assignedTo: user.id,
                        status: 'open',
                        dueDate: { $lte: new Date() }
                    });
                    
                    if (tasks.length > 0) {
                        await ctx.context.sendEmail({
                            to: user.email,
                            subject: 'Daily Task Reminder',
                            body: \`Good morning \${user.name}!

You have \${tasks.length} overdue task(s):

\${tasks.map(t => \`- \${t.subject} (due: \${t.dueDate})\`).join('\\n')}

Have a productive day!\`
                        });
                    }
                }
            `,
      language: 'javascript',
    },
  ],
  priority: 75,
  createdAt: new Date(),
};

// Example 6: Quarterly review trigger
export const quarterlyReviewRule: AutomationRule = {
  id: 'quarterly_review',
  name: 'Quarterly Performance Review',
  description: 'Trigger quarterly review process on the first day of each quarter',
  status: 'active',
  trigger: {
    type: 'scheduled',
    cronExpression: '0 8 1 1,4,7,10 *', // Jan 1, Apr 1, Jul 1, Oct 1 at 8 AM
    timezone: 'America/Chicago',
  },
  actions: [
    {
      type: 'execute_script',
      script: `
                const quarter = Math.floor((new Date().getMonth() / 3)) + 1;
                const year = new Date().getFullYear();
                
                const managers = await ctx.context.users.filter({ role: 'manager' });
                
                for (const manager of managers) {
                    await ctx.context.tasks.create({
                        assignedTo: manager.id,
                        subject: \`Complete Q\${quarter} \${year} Performance Reviews\`,
                        description: 'Complete performance reviews for your team members',
                        priority: 'high',
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    });
                }
                
                ctx.logger.info(\`Created quarterly review tasks for \${managers.length} managers\`);
            `,
      language: 'javascript',
    },
  ],
  priority: 95,
  createdAt: new Date(),
};

// Example 7: Custom schedule - every 15 minutes during business hours
export const frequentMonitoringRule: AutomationRule = {
  id: 'frequent_monitoring',
  name: 'System Health Check',
  description: 'Check system health every 15 minutes during business hours',
  status: 'active',
  trigger: {
    type: 'scheduled',
    cronExpression: '*/15 9-17 * * 1-5', // Every 15 minutes, 9 AM to 5 PM, weekdays
    timezone: 'America/New_York',
  },
  actions: [
    {
      type: 'http_request',
      url: 'https://api.company.com/health',
      method: 'GET',
      timeout: 5000,
    },
    {
      type: 'update_field',
      objectName: 'system_status',
      recordId: 'main_system',
      fields: {
        lastChecked: '{{#now}}{{/now}}',
        status: 'healthy',
      },
    },
  ],
  priority: 50,
  createdAt: new Date(),
};
