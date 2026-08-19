import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './domain/attachment.entity';
import { Task } from '../task/domain/task.entity';
import { ProjectMember } from '../project/domain/project-member.entity';
import { AttachmentService } from './application/attachment.service';
import { AttachmentController } from './api/controllers/attachment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment, Task, ProjectMember])],
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
