/**
 * Object Operation Endpoint
 * 
 * Performs CRUD operations on objects
 */

import { EndpointHandler } from '../endpoint-registry';
import { createSuccessResponse, createErrorResponse } from '../response';

/**
 * Object operation type
 */
export enum ObjectOperation {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
}

/**
 * Object operation endpoint configuration
 */
export interface ObjectOperationConfig {
    /** Object name */
    objectName: string;
    /** Operation type */
    operation: ObjectOperation;
    /** Fields to return */
    fields?: string[];
    /** Default filters */
    filters?: any;
}

/**
 * Object service interface (to be implemented by ObjectQL)
 */
export interface ObjectService {
    create(objectName: string, data: any): Promise<any>;
    findOne(objectName: string, id: string, fields?: string[]): Promise<any>;
    find(objectName: string, filters?: any, fields?: string[]): Promise<any[]>;
    update(objectName: string, id: string, data: any): Promise<any>;
    delete(objectName: string, id: string): Promise<void>;
}

/**
 * Object operation endpoint handler
 */
export class ObjectOperationEndpoint implements EndpointHandler {
    private objectService: ObjectService;

    constructor(objectService: ObjectService) {
        this.objectService = objectService;
    }

    async execute(req: any, res: any, config: ObjectOperationConfig): Promise<void> {
        try {
            let result: any;

            switch (config.operation) {
                case ObjectOperation.CREATE:
                    result = await this.handleCreate(req, config);
                    break;
                case ObjectOperation.READ:
                    result = await this.handleRead(req, config);
                    break;
                case ObjectOperation.UPDATE:
                    result = await this.handleUpdate(req, config);
                    break;
                case ObjectOperation.DELETE:
                    await this.handleDelete(req, config);
                    result = { success: true };
                    break;
                case ObjectOperation.LIST:
                    result = await this.handleList(req, config);
                    break;
                default:
                    throw new Error(`Unsupported operation: ${config.operation}`);
            }

            const response = createSuccessResponse(result);
            this.sendResponse(res, 200, response);
        } catch (error) {
            const response = createErrorResponse(
                'OBJECT_OPERATION_ERROR',
                error instanceof Error ? error.message : 'Object operation failed'
            );
            this.sendResponse(res, 500, response);
        }
    }

    private async handleCreate(req: any, config: ObjectOperationConfig): Promise<any> {
        const data = req.body;
        return await this.objectService.create(config.objectName, data);
    }

    private async handleRead(req: any, config: ObjectOperationConfig): Promise<any> {
        const id = req.params.id;
        return await this.objectService.findOne(config.objectName, id, config.fields);
    }

    private async handleUpdate(req: any, config: ObjectOperationConfig): Promise<any> {
        const id = req.params.id;
        const data = req.body;
        return await this.objectService.update(config.objectName, id, data);
    }

    private async handleDelete(req: any, config: ObjectOperationConfig): Promise<void> {
        const id = req.params.id;
        await this.objectService.delete(config.objectName, id);
    }

    private async handleList(req: any, config: ObjectOperationConfig): Promise<any[]> {
        // Merge default filters with query filters
        const filters = {
            ...config.filters,
            ...this.parseFilters(req.query),
        };

        return await this.objectService.find(config.objectName, filters, config.fields);
    }

    private parseFilters(query: any): any {
        // Basic filter parsing from query parameters
        const filters: any = {};

        for (const [key, value] of Object.entries(query)) {
            if (key.startsWith('filter_')) {
                const fieldName = key.substring(7); // Remove 'filter_' prefix
                filters[fieldName] = value;
            }
        }

        return filters;
    }

    private sendResponse(res: any, status: number, body: any): void {
        if (res.status && res.json) {
            res.status(status).json(body);
        }
    }
}

/**
 * Create object operation endpoint handler
 */
export function createObjectOperationEndpoint(objectService: ObjectService): ObjectOperationEndpoint {
    return new ObjectOperationEndpoint(objectService);
}
