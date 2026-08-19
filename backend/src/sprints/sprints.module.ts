import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from './entities/sprint.entity';
import { Task } from '../tasks/entities/task.entity';
import { ActivityLog } from '../activity/entities/activity-log.entity';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Task, ActivityLog]), ProjectsModule],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
