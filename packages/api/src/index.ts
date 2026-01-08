import { Router, Request, Response, NextFunction } from 'express';
import { IObjectQL, ObjectQLContext, UnifiedQuery } from '@objectql/core';
import * as path from 'path';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiSpec } from './swagger/generator';

export interface ObjectQLServerOptions {
    objectql: IObjectQL;
    getContext?: (req: Request, res: Response) => Promise<ObjectQLContext> | ObjectQLContext;
    swagger?: {
        enabled: boolean;
        path?: string; // default: /docs
    }
}

export function createObjectQLRouter(options: ObjectQLServerOptions): Router {
    const router = Router();
    const { objectql, getContext, swagger } = options;

    if (swagger && swagger.enabled) {
        const docPath = swagger.path || '/docs';
        const spec = generateOpenApiSpec(objectql);
        router.use(docPath, swaggerUi.serve, swaggerUi.setup(spec));
        console.log(`Swagger UI available at ${docPath}`);
    }

    const getCtx = async (req: Request, res: Response): Promise<ObjectQLContext> => {
        if (getContext) {
            return await getContext(req, res);
        }
        return {
            roles: [],
            object: (name: string) => { throw new Error("Not implemented in default context stub"); },
            transaction: async (cb: any) => cb({} as any),
            sudo: () => ({} as any)
        } as unknown as ObjectQLContext;
    };

    const getRepo = async (req: Request, res: Response, objectName: string) => {
        const ctx = await getCtx(req, res);
        return ctx.object(objectName);
    };

    // Helper: Parse UnifiedQuery from Request
    const parseQuery = (req: Request): UnifiedQuery => {
        const query: UnifiedQuery = {};
        const q = req.query;

        // 1. Fields
        if (q.fields) {
            if (typeof q.fields === 'string') {
                query.fields = q.fields.split(',');
            }
        }

        // 2. Filters
        if (q.filters) {
            try {
                if (typeof q.filters === 'string') {
                    query.filters = JSON.parse(q.filters);
                }
            } catch (e) {
                throw new Error("Invalid filters JSON");
            }
        }

        // 3. Sort
        // Format: ?sort=item1:asc,item2:desc  OR  ?sort=[["item1","asc"]]
        if (q.sort) {
            if (typeof q.sort === 'string') {
                // Check if JSON
                if (q.sort.startsWith('[')) {
                    try {
                        query.sort = JSON.parse(q.sort);
                    } catch {}
                } else {
                    // split by comma
                    query.sort = q.sort.split(',').map(part => {
                        const [field, order] = part.split(':');
                        return [field, (order || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc'];
                    });
                }
            }
        }

        // 4. Pagination
        if (q.top || q.limit) {
            query.limit = parseInt((q.top || q.limit) as string);
        }
        if (q.skip || q.offset) {
            query.skip = parseInt((q.skip || q.offset) as string);
        }

        // 5. Expand
        // ?expand=items,details  OR ?expand={"items":{"fields":["name"]}}
        if (q.expand) {
            if (typeof q.expand === 'string') {
                if (q.expand.startsWith('{')) {
                    try {
                        query.expand = JSON.parse(q.expand);
                    } catch {}
                } else {
                    query.expand = {};
                    q.expand.split(',').forEach(field => {
                        // Simple expand implies selecting all or default fields
                        // UnifiedQuery expects sub-query
                        query.expand![field] = {}; 
                    });
                }
            }
        }

        return query;
    };

    // === Special Endpoints (Must come before /:objectName) ===

    router.get('/_schema', async (req: Request, res: Response) => {
        try {
            const configs = objectql.getConfigs();
            res.json(configs);
        } catch (e: any) {
             res.status(500).json({ error: e.message });
        }
    });

    router.get('/_schema/:type', async (req: Request, res: Response) => {
        try {
            const { type } = req.params;
            const list = objectql.metadata.list(type);
            // Convert list to map for consistency
            const result: Record<string, any> = {};
            for (const item of list) {
                // assume item has id or name
                const key = item.id || item.name || item.code;
                if (key) {
                    result[key] = item;
                }
            }
            res.json(result);
        } catch (e: any) {
             res.status(500).json({ error: e.message });
        }
    });

    // NONE for now, as :objectName is the root.
    // However, we might want /:objectName/count or /:objectName/aggregate.


    // === Collection Routes ===

    // count
    router.get('/:objectName/count', async (req: Request, res: Response) => {
        try {
            const { objectName } = req.params;
            const repo = await getRepo(req, res, objectName);
            let filters = undefined;
            if (req.query.filters) {
                try {
                    filters = JSON.parse(req.query.filters as string);
                } catch {
                    return res.status(400).json({ error: "Invalid filters JSON" });
                }
            }
            const count = await repo.count(filters);
            res.json({ count });
        } catch (e: any) {
             res.status(500).json({ error: e.message });
        }
    });

    // aggregate
    router.post('/:objectName/aggregate', async (req: Request, res: Response) => {
        try {
            const { objectName } = req.params;
            const repo = await getRepo(req, res, objectName);
            const pipeline = req.body;
            if (!Array.isArray(pipeline)) {
                return res.status(400).json({ error: "Pipeline must be an array" });
            }
            const result = await repo.aggregate(pipeline);
            res.json(result);
        } catch (e: any) {
             res.status(500).json({ error: e.message });
        }
    });

    // delete many
    router.delete('/:objectName', async (req: Request, res: Response) => {
        try {
            const { objectName } = req.params;
            if (!req.query.filters) {
                return res.status(400).json({ error: "filters parameter is required for bulk delete" });
            }
            const repo = await getRepo(req, res, objectName);
            let filters;
             try {
                filters = JSON.parse(req.query.filters as string);
            } catch {
                return res.status(400).json({ error: "Invalid filters JSON" });
            }
            const result = await repo.deleteMany(filters);
            res.json(result);
        } catch (e: any) {
             res.status(500).json({ error: e.message });
        }
    });

    // list
    router.get('/:objectName', async (req: Request, res: Response) => {
        try {
            const { objectName } = req.params;
            const repo = await getRepo(req, res, objectName);
            const query = parseQuery(req);
            const results = await repo.find(query);
            res.json(results);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    // create (one or many)
    router.post('/:objectName', async (req: Request, res: Response) => {
        try {
            const { objectName } = req.params;
            const repo = await getRepo(req, res, objectName);
            if (Array.isArray(req.body)) {
                const results = await repo.createMany(req.body);
                res.status(201).json(results);
            } else {
                const result = await repo.create(req.body);
                res.status(201).json(result);
            }
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    // === Item Routes ===

    // run action
    router.post('/:objectName/:id/:actionName', async (req: Request, res: Response) => {
         try {
            const { objectName, id, actionName } = req.params;
            const repo = await getRepo(req, res, objectName);
            // Params merging body and id? Usually action needs specific params.
            // Let's pass body as params.
            const params = {
                id,
                ...req.body
            };
            const result = await repo.call(actionName, params);
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    router.get('/:objectName/:id', async (req: Request, res: Response) => {
        try {
            const { objectName, id } = req.params;
            const repo = await getRepo(req, res, objectName);
            
            // Allow expand here too?
            // findOne takes id or query.
            // If expand is needed, we should construct a query with filters: {_id: id}
            
            if (req.query.expand || req.query.fields) {
                const query = parseQuery(req);
                // Force filter by ID
                // Note: normalized ID vs string ID.
                query.filters = [['_id', '=', id]]; // or 'id' depending on driver
                const results = await repo.find(query);
                if (!results.length) {
                    return res.status(404).json({ error: "Not found" });
                }
                return res.json(results[0]);
            }

            const result = await repo.findOne(id);
            if (!result) {
                return res.status(404).json({ error: "Not found" });
            }
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    router.put('/:objectName/:id', async (req: Request, res: Response) => {
        try {
            const { objectName, id } = req.params;
            const repo = await getRepo(req, res, objectName);
            const result = await repo.update(id, req.body);
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    router.delete('/:objectName/:id', async (req: Request, res: Response) => {
        try {
            const { objectName, id } = req.params;
            const repo = await getRepo(req, res, objectName);
            await repo.delete(id);
            res.status(204).send();
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    return router;
}
