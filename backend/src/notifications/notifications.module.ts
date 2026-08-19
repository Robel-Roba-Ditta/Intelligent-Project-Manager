import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Task } from '../tasks/entities/task.entity';
import { Watcher } from '../watchers/entities/watcher.entity';
import { User } from '../users/entities/user.entity';
import { NotificationListener } from './notification.listener';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Task, Watcher, User])],
  controllers: [NotificationsController],
  providers: [NotificationListener, NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
