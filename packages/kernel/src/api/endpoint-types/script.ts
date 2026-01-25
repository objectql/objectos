/**
 * Script Endpoint
 * 
 * Executes custom JavaScript/TypeScript scripts
 */

import { EndpointHandler } from '../endpoint-registry';
import { createSuccessResponse, createErrorResponse } from '../response';

/**
 * Script endpoint configuration
 */
export interface ScriptEndpointConfig {
    /** Script code to execute */
    script: string;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Allowed globals */
    allowedGlobals?: string[];
}

/**
 * Script context
 */
export interface ScriptContext {
    req: any;
    params: any;
    query: any;
    body: any;
    headers: any;
}

/**
 * Script endpoint handler
 */
export class ScriptEndpoint implements EndpointHandler {
    async execute(req: any, res: any, config: ScriptEndpointConfig): Promise<void> {
        try {
            // Create script context
            const context: ScriptContext = {
                req,
                params: req.params || {},
                query: req.query || {},
                body: req.body || {},
                headers: req.headers || {},
            };

            // Execute script with timeout
            const result = await this.executeScript(config.script, context, config.timeout);

            // Send response
            const response = createSuccessResponse(result);
            this.sendResponse(res, 200, response);
        } catch (error) {
            const response = createErrorResponse(
                'SCRIPT_EXECUTION_ERROR',
                error instanceof Error ? error.message : 'Script execution failed'
            );
            this.sendResponse(res, 500, response);
        }
    }

    private async executeScript(
        script: string,
        context: ScriptContext,
        timeout: number = 5000
    ): Promise<any> {
        // Create isolated function
        const scriptFunction = new Function(
            'context',
            `
            'use strict';
            const { req, params, query, body, headers } = context;
            return (async () => {
                ${script}
            })();
            `
        );

        // Execute with timeout
        return await this.withTimeout(
            scriptFunction(context),
            timeout,
            'Script execution timeout'
        );
    }

    private withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number,
        message: string
    ): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(message)), timeoutMs)
            ),
        ]);
    }

    private sendResponse(res: any, status: number, body: any): void {
        if (res.status && res.json) {
            res.status(status).json(body);
        }
    }
}

/**
 * Create script endpoint handler
 */
export function createScriptEndpoint(): ScriptEndpoint {
    return new ScriptEndpoint();
}
