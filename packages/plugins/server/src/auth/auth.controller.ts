import { Controller, All, Req, Res, Inject } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Auth Controller - Delegates to Better-Auth Plugin
 * 
 * This controller no longer directly manages authentication.
 * Instead, it delegates to the @objectos/plugin-better-auth plugin
 * which is registered in the ObjectOS kernel.
 */
@Controller('api/auth')
export class AuthController {
    constructor(
        @Inject('BETTER_AUTH_PLUGIN') private betterAuthPlugin?: any
    ) {}

    @All('*')
    async handleAuth(@Req() req: Request, @Res() res: Response) {
        try {
            // Get the Better-Auth handler from the plugin
            if (!this.betterAuthPlugin) {
                throw new Error('Better-Auth plugin not available. Ensure @objectos/plugin-better-auth is loaded in the kernel.');
            }

            const handler = await this.betterAuthPlugin.getHandler();
            return handler(req, res);
        } catch (error) {
            console.error('[Auth Controller] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ 
                error: 'Authentication service unavailable', 
                details: errorMessage 
            });
        }
    }
}
