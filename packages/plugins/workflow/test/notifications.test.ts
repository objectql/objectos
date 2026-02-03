/**
 * Notification Service Tests
 */

import {
    NotificationService,
    EmailNotificationHandler,
    SlackNotificationHandler,
    WebhookNotificationHandler,
} from '../src/notifications';
import type { WorkflowContext, NotificationConfig } from '../src/types';

describe('NotificationService', () => {
    let notificationService: NotificationService;
    let mockContext: WorkflowContext;

    beforeEach(() => {
        notificationService = new NotificationService();
        
        // Create a mock context
        mockContext = {
            instance: {
                id: 'wf_1',
                workflowId: 'test_workflow',
                version: '1.0.0',
                currentState: 'pending',
                status: 'running',
                data: { title: 'Test Workflow' },
                history: [],
                createdAt: new Date(),
            },
            definition: {
                id: 'test_workflow',
                name: 'Test Workflow',
                type: 'approval',
                version: '1.0.0',
                states: {},
                initialState: 'draft',
            },
            currentState: {
                name: 'pending',
            },
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
            },
            getData: jest.fn((key?: string) => key ? mockContext.instance.data[key] : mockContext.instance.data),
            setData: jest.fn(),
        } as any;
    });

    describe('registerHandler', () => {
        it('should register an email handler', () => {
            const emailHandler = new EmailNotificationHandler('test@example.com');
            notificationService.registerHandler('email', emailHandler);
            
            expect(notificationService.isSupported('email')).toBe(true);
        });

        it('should register a Slack handler', () => {
            const slackHandler = new SlackNotificationHandler();
            notificationService.registerHandler('slack', slackHandler);
            
            expect(notificationService.isSupported('slack')).toBe(true);
        });

        it('should register a webhook handler', () => {
            const webhookHandler = new WebhookNotificationHandler();
            notificationService.registerHandler('webhook', webhookHandler);
            
            expect(notificationService.isSupported('webhook')).toBe(true);
        });
    });

    describe('send', () => {
        it('should send email notification', async () => {
            const emailHandler = new EmailNotificationHandler('noreply@example.com');
            notificationService.registerHandler('email', emailHandler);

            const config: NotificationConfig = {
                channel: 'email',
                recipients: ['user@example.com'],
                subject: 'Test Email',
                message: 'This is a test message',
            };

            await notificationService.send(config, mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Notification sent via email')
            );
        });

        it('should send Slack notification', async () => {
            const slackHandler = new SlackNotificationHandler();
            notificationService.registerHandler('slack', slackHandler);

            const config: NotificationConfig = {
                channel: 'slack',
                recipients: ['#general'],
                message: 'This is a Slack message',
            };

            await notificationService.send(config, mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Notification sent via slack')
            );
        });

        it('should warn when handler is not registered', async () => {
            const config: NotificationConfig = {
                channel: 'email',
                recipients: ['user@example.com'],
                message: 'Test',
            };

            await notificationService.send(config, mockContext);

            expect(mockContext.logger.warn).toHaveBeenCalledWith(
                'No handler registered for channel: email'
            );
        });

        it('should handle errors from notification handlers', async () => {
            const failingHandler = {
                supports: () => true,
                send: async () => {
                    throw new Error('Notification failed');
                },
            };
            notificationService.registerHandler('email', failingHandler as any);

            const config: NotificationConfig = {
                channel: 'email',
                recipients: ['user@example.com'],
                message: 'Test',
            };

            await expect(
                notificationService.send(config, mockContext)
            ).rejects.toThrow('Notification failed');
        });
    });

    describe('isSupported', () => {
        it('should return true for registered channels', () => {
            const emailHandler = new EmailNotificationHandler('test@example.com');
            notificationService.registerHandler('email', emailHandler);
            
            expect(notificationService.isSupported('email')).toBe(true);
        });

        it('should return false for unregistered channels', () => {
            expect(notificationService.isSupported('email')).toBe(false);
            expect(notificationService.isSupported('slack')).toBe(false);
        });
    });
});

describe('EmailNotificationHandler', () => {
    let handler: EmailNotificationHandler;
    let mockContext: WorkflowContext;

    beforeEach(() => {
        handler = new EmailNotificationHandler('noreply@example.com');
        
        mockContext = {
            instance: {
                id: 'wf_1',
                data: { userName: 'John Doe', title: 'Test Workflow' },
            } as any,
            logger: {
                info: jest.fn(),
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
        } as any;
    });

    describe('supports', () => {
        it('should support email channel', () => {
            expect(handler.supports('email')).toBe(true);
        });

        it('should not support other channels', () => {
            expect(handler.supports('slack')).toBe(false);
            expect(handler.supports('webhook')).toBe(false);
        });
    });

    describe('send', () => {
        it('should send basic email', async () => {
            const config: NotificationConfig = {
                channel: 'email',
                recipients: ['user@example.com'],
                subject: 'Test Subject',
                message: 'Test message',
            };

            await handler.send(config, mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Sending to: user@example.com')
            );
            expect(mockContext.logger.debug).toHaveBeenCalledWith(
                expect.stringContaining('Subject: Test Subject')
            );
        });

        it('should render template with variables', async () => {
            const config: NotificationConfig = {
                channel: 'email',
                recipients: ['user@example.com'],
                subject: 'Hello {{userName}}',
                template: 'Workflow: {{title}}',
                data: mockContext.instance.data,
            };

            await handler.send(config, mockContext);

            // Check that template rendering was attempted
            expect(mockContext.logger.debug).toHaveBeenCalled();
        });

        it('should handle multiple recipients', async () => {
            const config: NotificationConfig = {
                channel: 'email',
                recipients: ['user1@example.com', 'user2@example.com'],
                subject: 'Test',
                message: 'Test message',
            };

            await handler.send(config, mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('user1@example.com, user2@example.com')
            );
        });
    });
});

describe('SlackNotificationHandler', () => {
    let handler: SlackNotificationHandler;
    let mockContext: WorkflowContext;

    beforeEach(() => {
        handler = new SlackNotificationHandler({
            webhookUrl: 'https://hooks.slack.com/test',
        });
        
        mockContext = {
            instance: {
                id: 'wf_1',
                data: { title: 'Test Workflow' },
            } as any,
            logger: {
                info: jest.fn(),
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
        } as any;
    });

    describe('supports', () => {
        it('should support slack channel', () => {
            expect(handler.supports('slack')).toBe(true);
        });

        it('should not support other channels', () => {
            expect(handler.supports('email')).toBe(false);
            expect(handler.supports('webhook')).toBe(false);
        });
    });

    describe('send', () => {
        it('should send Slack message', async () => {
            const config: NotificationConfig = {
                channel: 'slack',
                recipients: ['#general'],
                message: 'Test Slack message',
            };

            await handler.send(config, mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Sending to channels: #general')
            );
        });

        it('should render template with variables', async () => {
            const config: NotificationConfig = {
                channel: 'slack',
                recipients: ['#workflows'],
                template: 'Workflow: {{title}}',
                data: mockContext.instance.data,
            };

            await handler.send(config, mockContext);

            expect(mockContext.logger.debug).toHaveBeenCalled();
        });

        it('should handle multiple channels', async () => {
            const config: NotificationConfig = {
                channel: 'slack',
                recipients: ['#general', '#workflows'],
                message: 'Test message',
            };

            await handler.send(config, mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('#general, #workflows')
            );
        });
    });
});

describe('WebhookNotificationHandler', () => {
    let handler: WebhookNotificationHandler;
    let mockContext: WorkflowContext;

    beforeEach(() => {
        handler = new WebhookNotificationHandler();
        
        mockContext = {
            instance: {
                id: 'wf_1',
                data: { title: 'Test Workflow' },
            } as any,
            logger: {
                info: jest.fn(),
                debug: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
        } as any;
    });

    describe('supports', () => {
        it('should support webhook channel', () => {
            expect(handler.supports('webhook')).toBe(true);
        });

        it('should not support other channels', () => {
            expect(handler.supports('email')).toBe(false);
            expect(handler.supports('slack')).toBe(false);
        });
    });

    describe('send', () => {
        it('should send webhook notification', async () => {
            const config: NotificationConfig = {
                channel: 'webhook',
                recipients: ['https://example.com/webhook'],
                data: { event: 'workflow.completed' },
            };

            await handler.send(config, mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('https://example.com/webhook')
            );
        });

        it('should handle multiple webhook URLs', async () => {
            const config: NotificationConfig = {
                channel: 'webhook',
                recipients: [
                    'https://example.com/webhook1',
                    'https://example.com/webhook2',
                ],
                data: { event: 'workflow.completed' },
            };

            await handler.send(config, mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledTimes(2);
        });
    });
});
