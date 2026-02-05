import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] || req.headers['x-space-id'];
    
    if (tenantId) {
      (req as any).tenantId = Array.isArray(tenantId) ? tenantId[0] : tenantId;
    }

    // Usually we would also validate if the user has access to this tenant here,
    // but that depends on AuthMiddleware running before or after.
    // We assume AuthMiddleware runs, populates req.user, and then we might check matches.

    next();
  }
}
