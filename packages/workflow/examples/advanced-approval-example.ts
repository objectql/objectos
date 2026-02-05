/**
 * Advanced Approval Workflow Example
 * 
 * Demonstrates multi-level approval chains, delegation, escalation, and notifications
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    WorkflowAPI,
    InMemoryWorkflowStorage,
    parseWorkflowYAML,
    NotificationService,
    EmailNotificationHandler,
    SlackNotificationHandler,
    ApprovalService,
} from '../src.js';

async function main() {
    console.log('=== Advanced Approval Workflow Example ===\n');

    // 1. Setup storage and API
    const storage = new InMemoryWorkflowStorage();
    const api = new WorkflowAPI(storage);
    const approvalService = new ApprovalService(storage);
    const notificationService = new NotificationService();

    // 2. Register notification handlers
    const emailHandler = new EmailNotificationHandler('noreply@objectos.io');
    const slackHandler = new SlackNotificationHandler({ 
        webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL' 
    });
    
    notificationService.registerHandler('email', emailHandler);
    notificationService.registerHandler('slack', slackHandler);

    console.log('✓ Notification handlers registered\n');

    // 3. Register guards and actions
    const engine = api.getEngine();

    // Guards
    engine.registerGuard('has_required_fields', (ctx) => {
        const data = ctx.getData();
        return !!(data.title && data.amount && data.vendor);
    });

    engine.registerGuard('has_valid_amount', (ctx) => {
        const amount = ctx.getData('amount');
        return amount > 0 && amount < 1000000; // Max $1M
    });

    // Actions for approval tasks
    engine.registerAction('create_manager_approval_task', async (ctx) => {
        const task = await api.createTask({
            instanceId: ctx.instance.id,
            name: 'manager_approval',
            description: 'Manager approval required for purchase order',
            assignedTo: 'manager@company.com',
            status: 'pending',
            data: {
                approvalLevel: 1,
                required: true,
            },
            autoEscalate: true,
            escalationTarget: 'senior_manager@company.com',
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        });
        ctx.logger.info(`Created manager approval task: ${task.id}`);
    });

    engine.registerAction('create_director_approval_task', async (ctx) => {
        const task = await api.createTask({
            instanceId: ctx.instance.id,
            name: 'director_approval',
            description: 'Director approval required for purchase order',
            assignedTo: 'director@company.com',
            status: 'pending',
            data: {
                approvalLevel: 2,
                required: true,
            },
            autoEscalate: true,
            escalationTarget: 'vp_operations@company.com',
            dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        });
        ctx.logger.info(`Created director approval task: ${task.id}`);
    });

    engine.registerAction('create_cfo_approval_task', async (ctx) => {
        const task = await api.createTask({
            instanceId: ctx.instance.id,
            name: 'cfo_approval',
            description: 'CFO final approval required for purchase order',
            assignedTo: 'cfo@company.com',
            status: 'pending',
            data: {
                approvalLevel: 3,
                required: true,
            },
            autoEscalate: true,
            escalationTarget: 'ceo@company.com',
            dueDate: new Date(Date.now() + 96 * 60 * 60 * 1000), // 96 hours
        });
        ctx.logger.info(`Created CFO approval task: ${task.id}`);
    });

    // Notification actions
    engine.registerAction('notify_manager', async (ctx) => {
        await notificationService.send({
            channel: 'email',
            recipients: ['manager@company.com'],
            subject: 'Purchase Order Approval Required',
            message: `A new purchase order requires your approval: ${ctx.getData('title')}`,
            data: ctx.getData(),
        }, ctx);
    });

    engine.registerAction('notify_director', async (ctx) => {
        await notificationService.send({
            channel: 'email',
            recipients: ['director@company.com'],
            subject: 'Purchase Order Approval Required',
            message: `Purchase order approved by manager, awaiting your approval: ${ctx.getData('title')}`,
            data: ctx.getData(),
        }, ctx);
    });

    engine.registerAction('notify_cfo', async (ctx) => {
        await notificationService.send({
            channel: 'email',
            recipients: ['cfo@company.com'],
            subject: 'Purchase Order Final Approval Required',
            message: `Purchase order requires final CFO approval: ${ctx.getData('title')}`,
            data: ctx.getData(),
        }, ctx);
    });

    engine.registerAction('send_slack_notification', async (ctx) => {
        await notificationService.send({
            channel: 'slack',
            recipients: ['#procurement'],
            message: `✅ Purchase order approved: ${ctx.getData('title')} - Amount: $${ctx.getData('amount')}`,
            data: ctx.getData(),
        }, ctx);
    });

    engine.registerAction('notify_requester_approval', async (ctx) => {
        const requester = ctx.getData('requestedBy') || 'employee@company.com';
        await notificationService.send({
            channel: 'email',
            recipients: [requester],
            subject: 'Purchase Order Approved',
            message: `Your purchase order "${ctx.getData('title')}" has been approved!`,
            data: ctx.getData(),
        }, ctx);
    });

    engine.registerAction('notify_requester_rejection', async (ctx) => {
        const requester = ctx.getData('requestedBy') || 'employee@company.com';
        await notificationService.send({
            channel: 'email',
            recipients: [requester],
            subject: 'Purchase Order Rejected',
            message: `Your purchase order "${ctx.getData('title')}" has been rejected.`,
            data: ctx.getData(),
        }, ctx);
    });

    // Delegation handler
    engine.registerAction('handle_delegation', async (ctx) => {
        ctx.logger.info('Delegation action triggered');
        // Delegation is handled separately via API
    });

    // Record keeping actions
    engine.registerAction('record_manager_approval', (ctx) => {
        ctx.setData('managerApprovedAt', new Date().toISOString());
        ctx.setData('managerApprovedBy', 'manager@company.com');
    });

    engine.registerAction('record_director_approval', (ctx) => {
        ctx.setData('directorApprovedAt', new Date().toISOString());
        ctx.setData('directorApprovedBy', 'director@company.com');
    });

    engine.registerAction('record_cfo_approval', (ctx) => {
        ctx.setData('cfoApprovedAt', new Date().toISOString());
        ctx.setData('cfoApprovedBy', 'cfo@company.com');
    });

    engine.registerAction('validate_purchase_order', (ctx) => {
        ctx.logger.info('Validating purchase order');
    });

    engine.registerAction('set_manager_deadline', (ctx) => {
        ctx.setData('managerDeadline', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString());
    });

    engine.registerAction('set_director_deadline', (ctx) => {
        ctx.setData('directorDeadline', new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString());
    });

    engine.registerAction('set_cfo_deadline', (ctx) => {
        ctx.setData('cfoDeadline', new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString());
    });

    engine.registerAction('set_approved_date', (ctx) => {
        ctx.setData('approvedDate', new Date().toISOString());
    });

    engine.registerAction('set_rejected_date', (ctx) => {
        ctx.setData('rejectedDate', new Date().toISOString());
    });

    engine.registerAction('send_approval_notifications', (ctx) => {
        ctx.logger.info('Sending approval notifications to all stakeholders');
    });

    engine.registerAction('send_rejection_notifications', (ctx) => {
        ctx.logger.info('Sending rejection notifications');
    });

    engine.registerAction('trigger_procurement_process', (ctx) => {
        ctx.logger.info('Triggering procurement process');
    });

    engine.registerAction('archive_purchase_order', (ctx) => {
        ctx.logger.info('Archiving rejected purchase order');
    });

    engine.registerAction('record_manager_rejection', (ctx) => {
        ctx.setData('rejectedBy', 'manager@company.com');
        ctx.setData('rejectedAt', new Date().toISOString());
        ctx.setData('rejectionLevel', 'manager');
    });

    engine.registerAction('record_director_rejection', (ctx) => {
        ctx.setData('rejectedBy', 'director@company.com');
        ctx.setData('rejectedAt', new Date().toISOString());
        ctx.setData('rejectionLevel', 'director');
    });

    engine.registerAction('record_cfo_rejection', (ctx) => {
        ctx.setData('rejectedBy', 'cfo@company.com');
        ctx.setData('rejectedAt', new Date().toISOString());
        ctx.setData('rejectionLevel', 'cfo');
    });

    engine.registerAction('notify_procurement', (ctx) => {
        ctx.logger.info('Notifying procurement team');
    });

    console.log('✓ Guards and actions registered\n');

    // 4. Load workflow definition
    const yamlPath = path.join(__dirname, 'multi-level-approval-workflow.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    const workflowDef = parseWorkflowYAML(yamlContent, 'purchase_order_approval');

    await api.registerWorkflow(workflowDef);
    console.log('✓ Workflow registered\n');

    // 5. Start a workflow instance
    console.log('--- Starting Purchase Order Workflow ---\n');
    const instance = await api.startWorkflow(
        'purchase_order_approval',
        {
            title: 'Office Equipment Purchase',
            vendor: 'TechSupply Co.',
            amount: 15000,
            description: '10 laptops for new employees',
            requestedBy: 'employee@company.com',
        },
        'employee@company.com'
    );

    console.log(`Workflow started: ${instance.id}`);
    console.log(`Current state: ${instance.currentState}`);
    console.log(`Status: ${instance.status}\n`);

    // 6. Submit for approval
    console.log('--- Submitting for Manager Approval ---\n');
    const submitted = await api.executeTransition(
        instance.id,
        'submit',
        'employee@company.com'
    );
    console.log(`Transitioned to: ${submitted.currentState}\n`);

    // 7. Check tasks
    let tasks = await api.getInstanceTasks(instance.id);
    console.log(`Tasks created: ${tasks.length}`);
    tasks.forEach(task => {
        console.log(`  - ${task.name} (assigned to: ${task.assignedTo}, status: ${task.status})`);
    });
    console.log();

    // 8. Demonstrate delegation
    if (tasks.length > 0) {
        const managerTask = tasks[0];
        console.log('--- Delegating Manager Approval ---\n');
        
        const delegated = await api.delegateTask(
            managerTask.id,
            'assistant_manager@company.com',
            'manager@company.com',
            'I will be out of office this week'
        );
        
        console.log(`Task ${delegated.id} delegated from ${delegated.originalAssignee} to ${delegated.delegatedTo}`);
        console.log(`Delegation reason: ${delegated.delegationReason}\n`);

        // Complete the delegated task
        await api.completeTask(delegated.id, { 
            approved: true, 
            comment: 'Approved on behalf of manager' 
        });
        console.log('✓ Task completed by delegatee\n');
    }

    // 9. Approve at manager level
    console.log('--- Manager Approval ---\n');
    const managerApproved = await api.executeTransition(
        instance.id,
        'approve',
        'manager@company.com'
    );
    console.log(`Transitioned to: ${managerApproved.currentState}\n`);

    // 10. Demonstrate escalation
    tasks = await api.getInstanceTasks(instance.id);
    const directorTask = tasks.find(t => t.name === 'director_approval');
    
    if (directorTask) {
        console.log('--- Escalating Director Approval ---\n');
        
        const escalated = await api.escalateTask(
            directorTask.id,
            'vp_operations@company.com',
            'Director unavailable - escalating to VP',
            'system'
        );
        
        console.log(`Task ${escalated.id} escalated to ${escalated.escalatedTo}`);
        console.log(`Escalation reason: ${escalated.escalationReason}\n`);

        // Complete the escalated task
        await api.completeTask(escalated.id, { 
            approved: true, 
            comment: 'Approved by VP' 
        });
        console.log('✓ Task completed by escalation target\n');
    }

    // 11. Continue approval chain
    console.log('--- Director Approval (via escalation) ---\n');
    const directorApproved = await api.executeTransition(
        instance.id,
        'approve',
        'vp_operations@company.com'
    );
    console.log(`Transitioned to: ${directorApproved.currentState}\n`);

    // 12. CFO Approval
    tasks = await api.getInstanceTasks(instance.id);
    const cfoTask = tasks.find(t => t.name === 'cfo_approval');
    
    if (cfoTask) {
        await api.completeTask(cfoTask.id, { 
            approved: true, 
            comment: 'Final approval granted' 
        });
        console.log('✓ CFO approval task completed\n');
    }

    console.log('--- Final CFO Approval ---\n');
    const finalApproved = await api.executeTransition(
        instance.id,
        'approve',
        'cfo@company.com'
    );

    console.log(`Final state: ${finalApproved.currentState}`);
    console.log(`Workflow status: ${finalApproved.status}`);
    console.log(`Completed at: ${finalApproved.completedAt}\n`);

    // 13. Review history
    console.log('--- Approval History ---\n');
    console.log('State transitions:');
    finalApproved.history.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.fromState} → ${entry.toState} (${entry.transition})`);
        console.log(`     Triggered by: ${entry.triggeredBy || 'system'}`);
        console.log(`     Timestamp: ${entry.timestamp}\n`);
    });

    console.log('All tasks:');
    const allTasks = await api.getInstanceTasks(instance.id);
    allTasks.forEach(task => {
        console.log(`  - ${task.name}:`);
        console.log(`    Status: ${task.status}`);
        console.log(`    Assigned to: ${task.assignedTo}`);
        if (task.delegatedTo) {
            console.log(`    Delegated to: ${task.delegatedTo} (from: ${task.originalAssignee})`);
        }
        if (task.escalatedTo) {
            console.log(`    Escalated to: ${task.escalatedTo}`);
        }
        console.log();
    });

    console.log('=== Example Complete ===');
}

// Run the example
main().catch(console.error);
