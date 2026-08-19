import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './domain/task.entity';
import { Epic } from '../epic/domain/epic.entity';
import { Sprint } from '../sprint/domain/sprint.entity';
import { ProjectMember } from '../project/domain/project-member.entity';
import { TaskService } from './application/task.service';
import { TaskController } from './api/controllers/task.controller';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Epic, Sprint, ProjectMember]),
    ProjectModule,
    UserModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}

