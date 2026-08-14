import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskDependency } from './entities/task-dependency.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { DependenciesService } from './dependencies.service';
import { DependenciesController } from './dependencies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskDependency, Task, ProjectMember])],
  controllers: [DependenciesController],
  providers: [DependenciesService],
  exports: [DependenciesService],
})
export class DependenciesModule {}
