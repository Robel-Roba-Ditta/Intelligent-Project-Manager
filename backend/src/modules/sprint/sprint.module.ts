import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from './domain/sprint.entity';
import { Task } from '../../modules/task/domain/task.entity';
import { ActivityLog } from '../activity/domain/activity-log.entity';
import { SprintService } from './application/sprint.service';
import { SprintController } from './api/controllers/sprint.controller';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Task, ActivityLog]), ProjectModule],
  controllers: [SprintController],
  providers: [SprintService],
  exports: [SprintService],
})
export class SprintModule {}

