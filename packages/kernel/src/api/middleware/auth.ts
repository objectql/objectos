/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and sets user context
 */

import { UnauthorizedError } from '../errors';

/**
 * JWT payload interface
 */
export interface JwtPayload {
    userId: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    iat?: number;
    exp?: number;
}

/**
 * Auth configuration
 */
export interface AuthConfig {
    /** Secret key for JWT verification */
    secret?: string;
    /** Public key for JWT verification (for asymmetric algorithms) */
    publicKey?: string;
    /** Algorithm to use */
    algorithm?: 'HS256' | 'RS256';
    /** Skip authentication for certain paths */
    skipPaths?: string[];
    /** Custom token extractor */
    tokenExtractor?: (req: any) => string | null;
}

/**
 * Default token extractor from Authorization header
 */
export function extractTokenFromHeader(req: any): string | null {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    
    if (!authHeader) {
        return null;
    }

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    return null;
}

/**
 * Simple JWT decoder (without verification for now)
 * In production, use a proper JWT library like jsonwebtoken
 */
function decodeJwt(token: string): JwtPayload {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
        );

        return payload;
    } catch (error) {
        throw new UnauthorizedError('Invalid token format');
    }
}

/**
 * Verify JWT token (basic implementation)
 * TODO: Add proper signature verification
 */
function verifyJwt(token: string, config: AuthConfig): JwtPayload {
    const payload = decodeJwt(token);

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new UnauthorizedError('Token expired');
    }

    // TODO: Verify signature with secret/publicKey
    // For now, we just decode and check expiration

    return payload;
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(config: AuthConfig = {}) {
    const {
        skipPaths = ['/health', '/api/discovery'],
        tokenExtractor = extractTokenFromHeader,
    } = config;

    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        // Skip authentication for certain paths
        if (skipPaths.some(path => req.path?.startsWith(path))) {
            return next();
        }

        try {
            // Extract token
            const token = tokenExtractor(req);
            
            if (!token) {
                throw new UnauthorizedError('No token provided');
            }

            // Verify token
            const payload = verifyJwt(token, config);

            // Attach user info to request
            req.user = {
                userId: payload.userId,
                email: payload.email,
                roles: payload.roles || [],
                permissions: payload.permissions || [],
            };

            // Continue to next middleware
            await next();
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            throw new UnauthorizedError('Authentication failed');
        }
    };
}

/**
 * Create authorization middleware to check permissions
 */
export function createAuthorizationMiddleware(requiredPermissions: string[]) {
    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        const user = req.user;

        if (!user) {
            throw new UnauthorizedError('User not authenticated');
        }

        // Check if user has required permissions
        const userPermissions = user.permissions || [];
        const hasPermission = requiredPermissions.every(
            permission => userPermissions.includes(permission)
        );

        if (!hasPermission) {
            throw new UnauthorizedError('Insufficient permissions');
        }

        await next();
    };
}

/**
 * Create role-based middleware
 */
export function createRoleMiddleware(requiredRoles: string[]) {
    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        const user = req.user;

        if (!user) {
            throw new UnauthorizedError('User not authenticated');
        }

        // Check if user has required role
        const userRoles = user.roles || [];
        const hasRole = requiredRoles.some(role => userRoles.includes(role));

        if (!hasRole) {
            throw new UnauthorizedError('Insufficient role');
        }

        await next();
    };
}
