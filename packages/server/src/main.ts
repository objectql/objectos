import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
  });
  
  // Listen on PORT or default to 3000 to match client proxy
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
