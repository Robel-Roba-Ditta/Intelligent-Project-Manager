import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './domain/notification.entity';
import { Task } from '../task/domain/task.entity';
import { Watcher } from '../watcher/domain/watcher.entity';
import { User } from '../user/domain/user.entity';
import { NotificationListener } from './application/notification.listener';
import { NotificationService } from './application/notification.service';
import { NotificationController } from './api/controllers/notification.controller';
import { NotificationGateway } from './api/gateways/notification.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Task, Watcher, User])],
  controllers: [NotificationController],
  providers: [NotificationListener, NotificationService, NotificationGateway],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
