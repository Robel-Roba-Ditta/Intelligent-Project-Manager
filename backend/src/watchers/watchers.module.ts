import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Watcher } from './entities/watcher.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { WatchersService } from './watchers.service';
import { WatchersController } from './watchers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Watcher, Task, ProjectMember])],
  controllers: [WatchersController],
  providers: [WatchersService],
  exports: [WatchersService],
})
export class WatchersModule {}
