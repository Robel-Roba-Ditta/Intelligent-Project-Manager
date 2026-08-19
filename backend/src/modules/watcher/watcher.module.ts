import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Watcher } from './domain/watcher.entity';
import { Task } from '../task/domain/task.entity';
import { ProjectMember } from '../project/domain/project-member.entity';
import { WatcherService } from './application/watcher.service';
import { WatcherController } from './api/controllers/watcher.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Watcher, Task, ProjectMember])],
  controllers: [WatcherController],
  providers: [WatcherService],
  exports: [WatcherService],
})
export class WatcherModule {}
