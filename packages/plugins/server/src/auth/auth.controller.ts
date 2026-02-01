import { Controller, All, Req, Res } from '@nestjs/common';
import { getAuth } from './auth.client.js';

@Controller('api/auth')
export class AuthController {
    @All('*')
    async handleAuth(@Req() req, @Res() res) {
        try {
            const auth = await getAuth();
            const { toNodeHandler } = await import('better-auth/node');
            return toNodeHandler(auth)(req, res);
        } catch (error) {
            console.error('Auth Error:', error);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }
}
