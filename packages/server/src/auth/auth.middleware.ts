import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getAuth } from './auth.client.js';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const auth = await getAuth();
    
    try {
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
                value.forEach(v => headers.append(key, v));
            } else if (value) {
                headers.append(key, value as string);
            }
        }

      const session = await auth.api.getSession({
          headers: headers
      });
      
      if (session) {
          const role = session.user.role || 'user';
          // Ensure we have an array of roles. better-auth usually provides a single role string on user object.
          const roles = [role];

          req['user'] = {
              userId: session.user.id,
              id: session.user.id,
              ...session.user,
              roles: roles,
              spaceId: session.session.activeOrganizationId,
              sessionId: session.session.id,
              // If user is super_admin, they are system admin (bypass ACL)
              isSystem: ['super_admin'].includes(role)
          };
      } else if (req.headers['x-user-id']) {
          // Fallback for dev/test: trust x-user-id header
          const userId = req.headers['x-user-id'] as string;
          const isAdmin = userId === 'admin';
          req['user'] = {
              userId: userId,
              id: userId,
              roles: isAdmin ? ['admin'] : ['user'],
              spaceId: req.headers['x-space-id'] as string,
              isSystem: isAdmin
          };
      }
    } catch (e) {
      // ignore auth error
      console.error("Auth Middleware Error:", e);
    }
    
    next();
  }
}
