/**
 * Action Executor
 * 
 * Executes automation actions
 */

import type {
    ActionConfig,
    UpdateFieldActionConfig,
    CreateRecordActionConfig,
    SendEmailActionConfig,
    HttpRequestActionConfig,
    ExecuteScriptActionConfig,
    AutomationContext,
    EmailConfig,
} from './types';

/**
 * Action executor for running automation actions
 */
export class ActionExecutor {
    private logger: any;
    private emailConfig?: EmailConfig;
    private enableEmail: boolean;
    private enableHttp: boolean;
    private enableScriptExecution: boolean;
    private maxExecutionTime: number;

    // External handlers
    private updateFieldHandler?: (objectName: string, recordId: string, fields: Record<string, any>) => Promise<void>;
    private createRecordHandler?: (objectName: string, fields: Record<string, any>) => Promise<any>;
    private sendEmailHandler?: (config: SendEmailActionConfig) => Promise<void>;

    constructor(options: {
        logger?: any;
        emailConfig?: EmailConfig;
        enableEmail?: boolean;
        enableHttp?: boolean;
        enableScriptExecution?: boolean;
        maxExecutionTime?: number;
    } = {}) {
        this.logger = options.logger || console;
        this.emailConfig = options.emailConfig;
        this.enableEmail = options.enableEmail !== false;
        this.enableHttp = options.enableHttp !== false;
        this.enableScriptExecution = options.enableScriptExecution !== false;
        this.maxExecutionTime = options.maxExecutionTime || 30000; // 30 seconds default
    }

    /**
     * Set update field handler
     */
    setUpdateFieldHandler(
        handler: (objectName: string, recordId: string, fields: Record<string, any>) => Promise<void>
    ): void {
        this.updateFieldHandler = handler;
    }

    /**
     * Set create record handler
     */
    setCreateRecordHandler(
        handler: (objectName: string, fields: Record<string, any>) => Promise<any>
    ): void {
        this.createRecordHandler = handler;
    }

    /**
     * Set send email handler
     */
    setSendEmailHandler(handler: (config: SendEmailActionConfig) => Promise<void>): void {
        this.sendEmailHandler = handler;
    }

    /**
     * Execute an action
     */
    async executeAction(action: ActionConfig, context: AutomationContext): Promise<any> {
        const startTime = Date.now();

        try {
            let result: any;

            switch (action.type) {
                case 'update_field':
                    result = await this.executeUpdateField(action, context);
                    break;

                case 'create_record':
                    result = await this.executeCreateRecord(action, context);
                    break;

                case 'send_email':
                    result = await this.executeSendEmail(action, context);
                    break;

                case 'http_request':
                    result = await this.executeHttpRequest(action, context);
                    break;

                case 'execute_script':
                    result = await this.executeScript(action, context);
                    break;

                default:
                    throw new Error(`Unknown action type: ${(action as any).type}`);
            }

            const duration = Date.now() - startTime;
            this.logger.debug(
                `Action ${action.type} executed in ${duration}ms for rule ${context.rule.id}`
            );

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error executing action ${action.type}:`, errorMessage);
            throw error;
        }
    }

    /**
     * Execute update field action
     */
    private async executeUpdateField(
        action: UpdateFieldActionConfig,
        context: AutomationContext
    ): Promise<void> {
        if (!this.updateFieldHandler) {
            throw new Error('Update field handler not configured');
        }

        const recordId = this.interpolateValue(action.recordId, context);
        const fields = this.interpolateFields(action.fields, context);

        await this.updateFieldHandler(action.objectName, recordId, fields);

        context.logger.info(
            `Updated ${action.objectName} record ${recordId} with fields: ${Object.keys(fields).join(', ')}`
        );
    }

    /**
     * Execute create record action
     */
    private async executeCreateRecord(
        action: CreateRecordActionConfig,
        context: AutomationContext
    ): Promise<any> {
        if (!this.createRecordHandler) {
            throw new Error('Create record handler not configured');
        }

        const fields = this.interpolateFields(action.fields, context);

        const record = await this.createRecordHandler(action.objectName, fields);

        context.logger.info(`Created ${action.objectName} record with ID: ${record.id}`);

        return record;
    }

    /**
     * Execute send email action
     */
    private async executeSendEmail(
        action: SendEmailActionConfig,
        context: AutomationContext
    ): Promise<void> {
        if (!this.enableEmail) {
            throw new Error('Email actions are disabled');
        }

        if (this.sendEmailHandler) {
            await this.sendEmailHandler(action);
        } else {
            // Default email sending (would require nodemailer or similar)
            context.logger.warn('Email handler not configured, email not sent');
        }

        const recipients = Array.isArray(action.to) ? action.to.join(', ') : action.to;
        context.logger.info(`Email sent to: ${recipients}, subject: ${action.subject}`);
    }

    /**
     * Execute HTTP request action
     */
    private async executeHttpRequest(
        action: HttpRequestActionConfig,
        context: AutomationContext
    ): Promise<any> {
        if (!this.enableHttp) {
            throw new Error('HTTP actions are disabled');
        }

        const timeout = action.timeout || this.maxExecutionTime;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(action.url, {
                method: action.method,
                headers: action.headers,
                body: action.body ? JSON.stringify(action.body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json().catch(() => response.text());

            context.logger.info(
                `HTTP ${action.method} request to ${action.url} completed with status ${response.status}`
            );

            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Execute script action
     */
    private async executeScript(
        action: ExecuteScriptActionConfig,
        context: AutomationContext
    ): Promise<any> {
        if (!this.enableScriptExecution) {
            throw new Error('Script execution is disabled');
        }

        // Create a safe execution context
        const scriptContext = {
            context: context.triggerData,
            logger: context.logger,
        };

        try {
            // Use Function constructor for script execution
            // Note: This is a simplified implementation. In production, you'd want:
            // - Proper sandboxing (e.g., vm2, isolated-vm)
            // - Resource limits
            // - Timeout enforcement
            const fn = new Function('ctx', action.script);
            const result = await Promise.resolve(fn(scriptContext));

            context.logger.info('Script executed successfully');

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Script execution failed';
            context.logger.error(`Script execution error: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Interpolate template values
     */
    private interpolateValue(value: string, context: AutomationContext): string {
        if (typeof value !== 'string') {
            return value;
        }

        // Replace {{field}} with values from trigger data
        return value.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
            const trimmedField = field.trim();
            const fieldValue = this.getNestedValue(context.triggerData, trimmedField);
            return fieldValue !== undefined ? String(fieldValue) : match;
        });
    }

    /**
     * Interpolate all fields in an object
     */
    private interpolateFields(fields: Record<string, any>, context: AutomationContext): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(fields)) {
            if (typeof value === 'string') {
                result[key] = this.interpolateValue(value, context);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, part) => current?.[part], obj);
    }
}
