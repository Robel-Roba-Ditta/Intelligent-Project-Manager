import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeLog } from './domain/time-log.entity';
import { Task } from '../task/domain/task.entity';
import { ProjectMember } from '../project/domain/project-member.entity';
import { TimeLogService } from './application/time-log.service';
import { TimeLogController } from './api/controllers/time-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TimeLog, Task, ProjectMember])],
  controllers: [TimeLogController],
  providers: [TimeLogService],
  exports: [TimeLogService],
})
export class TimeLogModule {}
