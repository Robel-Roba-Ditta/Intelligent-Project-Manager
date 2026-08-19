import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './domain/comment.entity';
import { Task } from '../task/domain/task.entity';
import { ProjectMember } from '../project/domain/project-member.entity';
import { CommentService } from './application/comment.service';
import { CommentController } from './api/controllers/comment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Task, ProjectMember])],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
