import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthMiddleware } from './auth.middleware.js';

/**
 * Auth Module - Provides authentication via Better-Auth Plugin
 * 
 * This module no longer manages authentication directly.
 * Instead, it integrates with the @objectos/plugin-better-auth plugin.
 * 
 * The Better-Auth plugin instance should be provided by the parent module
 * through dependency injection using the 'BETTER_AUTH_PLUGIN' token.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthMiddleware],
  exports: [AuthMiddleware],
})
export class AuthModule {}
