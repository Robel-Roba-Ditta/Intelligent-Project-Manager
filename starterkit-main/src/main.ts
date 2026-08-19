import './observability/otel';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AuthGuard } from '@common/guards/auth.guard';
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = new DocumentBuilder()
    .setTitle('StarterKit API')
    .setDescription('The StarterKit API description')
    .setVersion('1.0')
    .addTag('StarterKit')
    .setContact(
      'Aemiro Mekete',
      'https://www.linkedin.com/in/aemiro/',
      'aemiromekete12@gmail.com',
    )
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, documentFactory);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors();
  app.set('query parser', 'extended');
  app.useGlobalFilters(new HttpExceptionFilter(app.get(EventEmitter2)));
  // const reflector = app.get(Reflector);
  // const jwtService = app.get(JwtService);

  // app.useGlobalGuards(new AuthGuard(jwtService, reflector));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  //api versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  await app.listen(process.env.PORT ?? 3000);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
