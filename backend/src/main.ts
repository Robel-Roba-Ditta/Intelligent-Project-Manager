import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Fail fast if JWT_SECRET is not configured — never sign tokens with undefined
  const jwtSecret = config.get<string>('JWT_SECRET');
  if (!jwtSecret) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Aborting startup.');
    process.exit(1);
  }

  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
