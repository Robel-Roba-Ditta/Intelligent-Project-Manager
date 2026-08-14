import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Task } from '../tasks/entities/task.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { ActivityLog } from '../activity/entities/activity-log.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember, Task, Sprint, ActivityLog])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
