import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { PostController } from './api/controllers/post.controller';
import { PostEntity } from './domain/post.entity';
import { PostService } from './application/post.service';
import { PostRepository } from './infrastructure/post.repostitory';
import { ObservabilityModule } from '@observability/observability.module';

@Module({
  controllers: [PostController],
  imports: [TypeOrmModule.forFeature([PostEntity]), ObservabilityModule],
  providers: [PostRepository, PostService],
})
export class BlogModule {}
