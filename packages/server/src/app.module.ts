import { Module, MiddlewareConsumer, RequestMethod, NestModule, Inject } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ObjectQLModule } from './objectql/objectql.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, resolve } from 'path';
import { AuthMiddleware } from './auth/auth.middleware.js';
import { ObjectOS } from '@objectos/kernel';
import { createRESTHandler, createMetadataHandler, createNodeHandler, createStudioHandler } from '@objectql/server';

const clientDistPath = resolve(process.cwd(), process.cwd().endsWith('api') ? '../client/dist' : 'packages/client/dist');

@Module({
  imports: [
    ObjectQLModule, 
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: clientDistPath,
      exclude: ['/api/(.*)', '/docs/(.*)', '/studio/(.*)'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor(@Inject(ObjectOS) private objectos: ObjectOS) {}

  configure(consumer: MiddlewareConsumer) {
    const restHandler = createRESTHandler(this.objectos);
    const metadataHandler = createMetadataHandler(this.objectos);
    const objectQLHandler = createNodeHandler(this.objectos);
    const studioHandler = createStudioHandler();

    consumer
      .apply(restHandler)
      .forRoutes({ path: 'api/data', method: RequestMethod.ALL });

    consumer
        .apply(metadataHandler)
        .forRoutes({ path: 'api/metadata', method: RequestMethod.ALL });

    consumer
        .apply(objectQLHandler)
        .forRoutes({ path: 'api/objectql', method: RequestMethod.ALL });
 
        
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'api/*', method: RequestMethod.ALL });

  }
}
