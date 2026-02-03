import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import './express.d.ts';

/**
 * Auth Middleware - Integrates with Better-Auth Plugin
 * 
 * This middleware extracts the user session from Better-Auth
 * and attaches it to the request object for downstream use.
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        @Inject('BETTER_AUTH_PLUGIN') private betterAuthPlugin?: any
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            // Get the Better-Auth instance from the plugin
            if (!this.betterAuthPlugin) {
                console.warn('[Auth Middleware] Better-Auth plugin not available, using fallback auth');
                this.applyFallbackAuth(req);
                return next();
            }

            const authInstance = this.betterAuthPlugin.getAuthInstance();
            if (!authInstance) {
                console.warn('[Auth Middleware] Better-Auth instance not initialized, using fallback auth');
                this.applyFallbackAuth(req);
                return next();
            }

            // Convert request headers to Headers object for Better-Auth
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
                if (Array.isArray(value)) {
                    value.forEach(v => headers.append(key, v));
                } else if (value) {
                    headers.append(key, value as string);
                }
            }

            // Get session from Better-Auth
            const session = await authInstance.api.getSession({
                headers: headers
            });
            
            if (session) {
                const role = session.user.role || 'user';
                const roles = [role];

                req.user = {
                    userId: session.user.id,
                    id: session.user.id,
                    ...session.user,
                    roles: roles,
                    spaceId: session.session.activeOrganizationId,
                    sessionId: session.session.id,
                    // super_admin has system privileges (bypass ACL)
                    isSystem: ['super_admin'].includes(role)
                };
            } else {
                // No session found - apply fallback auth
                this.applyFallbackAuth(req);
            }
        } catch (error) {
            // Log error but don't block the request
            console.error('[Auth Middleware] Error processing authentication:', error);
            this.applyFallbackAuth(req);
        }
        
        next();
    }

    /**
     * Apply fallback authentication logic
     * Used for development/testing or when Better-Auth is unavailable
     */
    private applyFallbackAuth(req: Request): void {
        if (req.headers['x-user-id']) {
            // Development/Test mode: trust x-user-id header
            const userId = req.headers['x-user-id'] as string;
            const isAdmin = userId === 'admin';
            req.user = {
                userId: userId,
                id: userId,
                roles: isAdmin ? ['admin'] : ['user'],
                spaceId: req.headers['x-space-id'] as string,
                isSystem: isAdmin
            };
        } else {
            // Anonymous user
            req.user = {
                roles: ['guest'],
                isSystem: false
            };
        }
    }
}
