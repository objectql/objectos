import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Liquid } from 'liquidjs';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Try to find views directory in likely locations
  let viewsPath = join(__dirname, 'views');
  if (!existsSync(viewsPath)) {
      const upOne = join(__dirname, '..', 'views');
      if (existsSync(upOne)) {
          viewsPath = upOne;
      }
  }
  
  console.log('Views path resolved to:', viewsPath);
  
  const engine = new Liquid({
    root: viewsPath,
    extname: '.liquid'
  });
  app.engine('liquid', engine.express());
  app.setViewEngine('liquid');
  app.setBaseViewsDir(viewsPath);

  // NestJS by default listens on 3000
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
