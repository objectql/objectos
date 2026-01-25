/**
 * Flow Endpoint
 * 
 * Executes workflows or automation flows
 */

import { EndpointHandler } from '../endpoint-registry';
import { createSuccessResponse, createErrorResponse } from '../response';

/**
 * Flow endpoint configuration
 */
export interface FlowEndpointConfig {
    /** Flow ID to execute */
    flowId: string;
    /** Input parameter mapping */
    inputMapping?: Record<string, string>;
    /** Output parameter mapping */
    outputMapping?: Record<string, string>;
}

/**
 * Flow executor interface (to be implemented by workflow engine)
 */
export interface FlowExecutor {
    executeFlow(flowId: string, input: any): Promise<any>;
}

/**
 * Flow endpoint handler
 */
export class FlowEndpoint implements EndpointHandler {
    private flowExecutor: FlowExecutor;

    constructor(flowExecutor: FlowExecutor) {
        this.flowExecutor = flowExecutor;
    }

    async execute(req: any, res: any, config: FlowEndpointConfig): Promise<void> {
        try {
            // Extract input from request
            const input = this.extractInput(req, config);

            // Execute flow
            const output = await this.flowExecutor.executeFlow(config.flowId, input);

            // Map output if configured
            const mappedOutput = this.mapOutput(output, config);

            // Send response
            const response = createSuccessResponse(mappedOutput);
            this.sendResponse(res, 200, response);
        } catch (error) {
            const response = createErrorResponse(
                'FLOW_EXECUTION_ERROR',
                error instanceof Error ? error.message : 'Flow execution failed'
            );
            this.sendResponse(res, 500, response);
        }
    }

    private extractInput(req: any, config: FlowEndpointConfig): any {
        const input: any = {
            ...req.params,
            ...req.query,
            ...req.body,
        };

        // Apply input mapping if configured
        if (config.inputMapping) {
            const mapped: any = {};
            for (const [target, source] of Object.entries(config.inputMapping)) {
                if (source in input) {
                    mapped[target] = input[source];
                }
            }
            return mapped;
        }

        return input;
    }

    private mapOutput(output: any, config: FlowEndpointConfig): any {
        // Apply output mapping if configured
        if (config.outputMapping) {
            const mapped: any = {};
            for (const [target, source] of Object.entries(config.outputMapping)) {
                if (source in output) {
                    mapped[target] = output[source];
                }
            }
            return mapped;
        }

        return output;
    }

    private sendResponse(res: any, status: number, body: any): void {
        if (res.status && res.json) {
            res.status(status).json(body);
        }
    }
}

/**
 * Create flow endpoint handler
 */
export function createFlowEndpoint(flowExecutor: FlowExecutor): FlowEndpoint {
    return new FlowEndpoint(flowExecutor);
}
