import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Mainstream Pattern: Load from ENV, fallback to dev defaults
  const allowedOrigins = process.env.OBJECTQL_CORS_ORIGINS
    ? process.env.OBJECTQL_CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  // Listen on PORT or default to 3000 to match client proxy
  const port = process.env.OBJECTQL_PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
