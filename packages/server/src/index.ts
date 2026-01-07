import { Router, Request, Response, NextFunction } from 'express';
import { IObjectQL, ObjectQLContext } from '@objectql/core';

export interface ObjectQLServerOptions {
    objectql: IObjectQL;
    // Function to extract context from request (e.g. auth user)
    getContext?: (req: Request, res: Response) => Promise<ObjectQLContext> | ObjectQLContext;
}

export function createObjectQLRouter(options: ObjectQLServerOptions): Router {
    const router = Router();
    const { objectql, getContext } = options;

    const getCtx = async (req: Request, res: Response): Promise<ObjectQLContext> => {
        if (getContext) {
            return await getContext(req, res);
        }
        // Default context if none provided (e.g. anonymous/system or just empty)
        // Ideally the user should provide valid context.
        return {
            roles: [],
            object: (name: string) => { throw new Error("Not implemented in default context stub"); },
            transaction: async (cb: any) => cb({} as any),
            sudo: () => ({} as any)
        } as unknown as ObjectQLContext;
    };

    // Helper to get object repo with context
    const getRepo = async (req: Request, res: Response, objectName: string) => {
        const ctx = await getCtx(req, res);
        // We need to use the context to get an object repository instance.
        // However, IObjectQL interface currently has `getObject` (metadata) but not a method to get a repo with external context?
        // Wait, ObjectQL.createContext returns a context which has `.object(name)`.
        // So we need the `objectql` instance to CREATE the context, or we expect the user to pass a context creator?
        
        // Revised approach:
        // The `IGenerateContext` logic usually resides in the ObjectQL core or app.
        // If the user passes `getContext`, it returns an `ObjectQLContext` which HAS `.object(name)`.
        
        return ctx.object(objectName);
    };

    // List Handlers
    router.get('/:objectName', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { objectName } = req.params;
            const repo = await getRepo(req, res, objectName);
            
            // Simple query parsing
            // ?fields=name,status&filters=[["status","=","open"]]
            const fields = req.query.fields ? (req.query.fields as string).split(',') : undefined;
            let filters = undefined;
            if (req.query.filters) {
                try {
                    filters = JSON.parse(req.query.filters as string);
                } catch (e) {
                   return res.status(400).json({ error: "Invalid filters JSON" });
                }
            }

            const results = await repo.find({
                fields,
                filters
            });
            res.json(results);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    router.get('/:objectName/:id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { objectName, id } = req.params;
            const repo = await getRepo(req, res, objectName);
            const result = await repo.findOne(id);
            if (!result) {
                return res.status(404).json({ error: "Not found" });
            }
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    router.post('/:objectName', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { objectName } = req.params;
            const repo = await getRepo(req, res, objectName);
            const result = await repo.create(req.body);
            res.status(201).json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    router.put('/:objectName/:id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { objectName, id } = req.params;
            const repo = await getRepo(req, res, objectName);
            const result = await repo.update(id, req.body);
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    router.delete('/:objectName/:id', async (req: Request, res: Response, next: NextFunction) => {
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
