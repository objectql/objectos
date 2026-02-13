/**
 * Action Tests
 *
 * Tests for ActionExecutor
 */

import { ActionExecutor } from '../src/actions.js';
import type {
  UpdateFieldActionConfig,
  CreateRecordActionConfig,
  SendEmailActionConfig,
  HttpRequestActionConfig,
  ExecuteScriptActionConfig,
  AutomationContext,
  AutomationRule,
} from '../src/types.js';

describe('ActionExecutor', () => {
  let executor: ActionExecutor;
  let mockLogger: any;
  let mockContext: AutomationContext;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    executor = new ActionExecutor({
      logger: mockLogger,
      enableEmail: true,
      enableHttp: true,
      enableScriptExecution: true,
    });

    mockContext = {
      rule: {
        id: 'rule-1',
        name: 'Test Rule',
        status: 'active',
        trigger: { type: 'object.create', objectName: 'Contact' },
        actions: [],
        createdAt: new Date(),
      } as AutomationRule,
      triggerData: {
        objectName: 'Contact',
        record: { id: '123', name: 'John Doe', email: 'john@example.com' },
      },
      logger: mockLogger,
    };
  });

  describe('Update Field Action', () => {
    it('should execute update field action', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined);
      executor.setUpdateFieldHandler(mockHandler);

      const action: UpdateFieldActionConfig = {
        type: 'update_field',
        objectName: 'Contact',
        recordId: '123',
        fields: { status: 'active' },
      };

      await executor.executeAction(action, mockContext);

      expect(mockHandler).toHaveBeenCalledWith('Contact', '123', { status: 'active' });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Updated Contact record 123'),
      );
    });

    it('should throw error if handler not configured', async () => {
      const action: UpdateFieldActionConfig = {
        type: 'update_field',
        objectName: 'Contact',
        recordId: '123',
        fields: { status: 'active' },
      };

      await expect(executor.executeAction(action, mockContext)).rejects.toThrow(
        'Update field handler not configured',
      );
    });
  });

  describe('Create Record Action', () => {
    it('should execute create record action', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ id: 'new-123' });
      executor.setCreateRecordHandler(mockHandler);

      const action: CreateRecordActionConfig = {
        type: 'create_record',
        objectName: 'Task',
        fields: {
          subject: 'Follow up',
          contactId: '123',
        },
      };

      const result = await executor.executeAction(action, mockContext);

      expect(mockHandler).toHaveBeenCalledWith('Task', {
        subject: 'Follow up',
        contactId: '123',
      });
      expect(result).toEqual({ id: 'new-123' });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Created Task record with ID: new-123'),
      );
    });

    it('should throw error if handler not configured', async () => {
      const action: CreateRecordActionConfig = {
        type: 'create_record',
        objectName: 'Task',
        fields: { subject: 'Test' },
      };

      await expect(executor.executeAction(action, mockContext)).rejects.toThrow(
        'Create record handler not configured',
      );
    });
  });

  describe('Send Email Action', () => {
    it('should execute send email action', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined);
      executor.setSendEmailHandler(mockHandler);

      const action: SendEmailActionConfig = {
        type: 'send_email',
        to: 'john@example.com',
        subject: 'Welcome',
        body: 'Welcome to our platform',
      };

      await executor.executeAction(action, mockContext);

      expect(mockHandler).toHaveBeenCalledWith(action);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Email sent to: john@example.com'),
      );
    });

    it('should handle multiple recipients', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined);
      executor.setSendEmailHandler(mockHandler);

      const action: SendEmailActionConfig = {
        type: 'send_email',
        to: ['john@example.com', 'jane@example.com'],
        subject: 'Welcome',
        body: 'Welcome to our platform',
      };

      await executor.executeAction(action, mockContext);

      expect(mockHandler).toHaveBeenCalledWith(action);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('john@example.com, jane@example.com'),
      );
    });

    it('should throw error when email is disabled', async () => {
      const disabledExecutor = new ActionExecutor({ enableEmail: false });

      const action: SendEmailActionConfig = {
        type: 'send_email',
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
      };

      await expect(disabledExecutor.executeAction(action, mockContext)).rejects.toThrow(
        'Email actions are disabled',
      );
    });
  });

  describe('HTTP Request Action', () => {
    it('should execute HTTP POST request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({ success: true }),
      }) as any;

      const action: HttpRequestActionConfig = {
        type: 'http_request',
        url: 'https://api.example.com/webhooks',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { event: 'contact.created' },
      };

      const result = await executor.executeAction(action, mockContext);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/webhooks',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('should execute HTTP GET request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockRejectedValue(new Error('Not JSON')),
        text: vi.fn().mockResolvedValue('Success'),
      }) as any;

      const action: HttpRequestActionConfig = {
        type: 'http_request',
        url: 'https://api.example.com/data',
        method: 'GET',
      };

      await executor.executeAction(action, mockContext);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should throw error on HTTP failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }) as any;

      const action: HttpRequestActionConfig = {
        type: 'http_request',
        url: 'https://api.example.com/webhooks',
        method: 'POST',
      };

      await expect(executor.executeAction(action, mockContext)).rejects.toThrow(
        'HTTP 500: Internal Server Error',
      );
    });

    it('should throw error when HTTP is disabled', async () => {
      const disabledExecutor = new ActionExecutor({ enableHttp: false });

      const action: HttpRequestActionConfig = {
        type: 'http_request',
        url: 'https://api.example.com/test',
        method: 'GET',
      };

      await expect(disabledExecutor.executeAction(action, mockContext)).rejects.toThrow(
        'HTTP actions are disabled',
      );
    });
  });

  describe('Execute Script Action', () => {
    it('should execute JavaScript code', async () => {
      const action: ExecuteScriptActionConfig = {
        type: 'execute_script',
        script: 'return ctx.context.record.name.toUpperCase();',
        language: 'javascript',
      };

      const result = await executor.executeAction(action, mockContext);

      expect(result).toBe('JOHN DOE');
      expect(mockLogger.info).toHaveBeenCalledWith('Script executed successfully');
    });

    it('should provide access to context data', async () => {
      const action: ExecuteScriptActionConfig = {
        type: 'execute_script',
        script: 'return ctx.context.record.id;',
      };

      const result = await executor.executeAction(action, mockContext);

      expect(result).toBe('123');
    });

    it('should throw error when script execution is disabled', async () => {
      const disabledExecutor = new ActionExecutor({ enableScriptExecution: false });

      const action: ExecuteScriptActionConfig = {
        type: 'execute_script',
        script: 'return "test";',
      };

      await expect(disabledExecutor.executeAction(action, mockContext)).rejects.toThrow(
        'Script execution is disabled',
      );
    });

    it('should handle script errors', async () => {
      const action: ExecuteScriptActionConfig = {
        type: 'execute_script',
        script: 'throw new Error("Script error");',
      };

      await expect(executor.executeAction(action, mockContext)).rejects.toThrow('Script error');
    });
  });

  describe('Template Interpolation', () => {
    it('should interpolate template values in update action', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined);
      executor.setUpdateFieldHandler(mockHandler);

      const action: UpdateFieldActionConfig = {
        type: 'update_field',
        objectName: 'Contact',
        recordId: '{{record.id}}',
        fields: {
          fullName: '{{record.name}}',
          emailDomain: '{{record.email}}',
        },
      };

      await executor.executeAction(action, mockContext);

      expect(mockHandler).toHaveBeenCalledWith('Contact', '123', {
        fullName: 'John Doe',
        emailDomain: 'john@example.com',
      });
    });

    it('should interpolate nested values', async () => {
      const contextWithNested: AutomationContext = {
        ...mockContext,
        triggerData: {
          record: {
            id: '123',
            contact: {
              name: 'John Doe',
              address: {
                city: 'New York',
              },
            },
          },
        },
      };

      const mockHandler = vi.fn().mockResolvedValue(undefined);
      executor.setUpdateFieldHandler(mockHandler);

      const action: UpdateFieldActionConfig = {
        type: 'update_field',
        objectName: 'Contact',
        recordId: '{{record.id}}',
        fields: {
          name: '{{record.contact.name}}',
          city: '{{record.contact.address.city}}',
        },
      };

      await executor.executeAction(action, contextWithNested);

      expect(mockHandler).toHaveBeenCalledWith('Contact', '123', {
        name: 'John Doe',
        city: 'New York',
      });
    });

    it('should keep template if value not found', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined);
      executor.setUpdateFieldHandler(mockHandler);

      const action: UpdateFieldActionConfig = {
        type: 'update_field',
        objectName: 'Contact',
        recordId: '123',
        fields: {
          value: '{{record.nonExistent}}',
        },
      };

      await executor.executeAction(action, mockContext);

      expect(mockHandler).toHaveBeenCalledWith('Contact', '123', {
        value: '{{record.nonExistent}}',
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown action type', async () => {
      const action = {
        type: 'unknown_action',
      } as any;

      await expect(executor.executeAction(action, mockContext)).rejects.toThrow(
        'Unknown action type: unknown_action',
      );
    });

    it('should log action execution errors', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Update failed'));
      executor.setUpdateFieldHandler(mockHandler);

      const action: UpdateFieldActionConfig = {
        type: 'update_field',
        objectName: 'Contact',
        recordId: '123',
        fields: { status: 'active' },
      };

      await expect(executor.executeAction(action, mockContext)).rejects.toThrow('Update failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error executing action update_field'),
        'Update failed',
      );
    });
  });
});
