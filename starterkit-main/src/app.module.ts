import { Module } from '@nestjs/common';
import { BlogModule } from '@blog/blog.module';
// import { PostEntity } from '@blog/domain/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as dotenv from 'dotenv';
import { UserModule } from '@user/user.module';
import { ObservabilityModule } from '@observability/observability.module';
import { PrometheusMetricsController } from '@observability/prometheus-metrics.controller';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

dotenv.config({ path: '.env' });
console.log(
  'Database Host:',
  process.env.POSTGRES_HOST,
  process.env.POSTGRES_CONTAINER_NAME,
);
console.log('Database Port:', process.env.POSTGRES_PORT);
console.log('Database User:', process.env.POSTGRES_USER);
console.log('Database Password:', process.env.POSTGRES_PASSWORD);
console.log('Database Name:', process.env.POSTGRES_DB);
console.log('Database Schema:', process.env.DATABASE_SCHEMA);
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || process.env.POSTGRES_CONTAINER_NAME,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      schema: process.env.DATABASE_SCHEMA,
      port: parseInt(`${process.env.POSTGRES_PORT}`) || 5432,
      // entities: [PostEntity],
      logging: process.env.NODE_ENV === 'production' ? false : true,
      autoLoadEntities: true,
      synchronize: false, // NEVER change this to true! It can lead to data loss. Use migrations instead.
    }),
    BlogModule,
    UserModule,
    ObservabilityModule,
    PrometheusModule.register({
      controller: PrometheusMetricsController,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
