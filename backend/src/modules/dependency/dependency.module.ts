import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskDependency } from './domain/task-dependency.entity';
import { Task } from '../task/domain/task.entity';
import { ProjectMember } from '../project/domain/project-member.entity';
import { DependencyService } from './application/dependency.service';
import { DependencyController } from './api/controllers/dependency.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskDependency, Task, ProjectMember])],
  controllers: [DependencyController],
  providers: [DependencyService],
  exports: [DependencyService],
})
export class DependencyModule {}
