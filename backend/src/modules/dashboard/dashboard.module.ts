import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../project/domain/project.entity';
import { ProjectMember } from '../project/domain/project-member.entity';
import { Task } from '../task/domain/task.entity';
import { Sprint } from '../sprint/domain/sprint.entity';
import { ActivityLog } from '../activity/domain/activity-log.entity';
import { DashboardService } from './application/dashboard.service';
import { DashboardController } from './api/controllers/dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember, Task, Sprint, ActivityLog])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
