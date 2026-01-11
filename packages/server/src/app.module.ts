import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ObjectQLModule } from './objectql/objectql.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, resolve } from 'path';
import { DataController } from './controllers/data.controller.js';
import { MetadataController } from './controllers/metadata.controller.js';
import { AuthMiddleware } from './auth/auth.middleware.js';

const clientDistPath = resolve(process.cwd(), process.cwd().endsWith('api') ? '../client/dist' : 'packages/client/dist');

@Module({
  imports: [
    ObjectQLModule, 
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: clientDistPath,
      exclude: ['/api/(.*)', '/docs/(.*)'],
    }),
  ],
  controllers: [AppController, DataController, MetadataController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'api/*', method: RequestMethod.ALL });
  }
}
