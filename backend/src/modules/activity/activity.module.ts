import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './domain/activity-log.entity';
import { ActivityListener } from './application/activity.listener';
import { ActivityService } from './application/activity.service';
import { ActivityController } from './api/controllers/activity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])],
  controllers: [ActivityController],
  providers: [ActivityListener, ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
