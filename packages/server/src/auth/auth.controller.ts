import { Controller, All, Req, Res } from '@nestjs/common';
import { getAuth } from './auth.client';

@Controller('api/auth')
export class AuthController {
    @All('*')
    async handleAuth(@Req() req, @Res() res) {
        const auth = await getAuth();
        const { toNodeHandler } = await import('better-auth/node');
        return toNodeHandler(auth)(req, res);
    }
}
