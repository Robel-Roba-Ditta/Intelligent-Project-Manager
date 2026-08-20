import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { User } from './modules/user/domain/user.entity';
import { ProjectModule } from './modules/project/project.module';
import { Project } from './modules/project/domain/project.entity';
import { ProjectMember } from './modules/project/domain/project-member.entity';
import { EpicModule } from './modules/epic/epic.module';
import { Epic } from './modules/epic/domain/epic.entity';
import { SprintModule } from './modules/sprint/sprint.module';
import { Sprint } from './modules/sprint/domain/sprint.entity';
import { TaskModule } from './modules/task/task.module';
import { Task } from './modules/task/domain/task.entity';
import { LabelModule } from './modules/label/label.module';
import { Label } from './modules/label/domain/label.entity';
import { CommentModule } from './modules/comment/comment.module';
import { Comment } from './modules/comment/domain/comment.entity';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { Attachment } from './modules/attachment/domain/attachment.entity';
import { WatcherModule } from './modules/watcher/watcher.module';
import { Watcher } from './modules/watcher/domain/watcher.entity';
import { ActivityModule } from './modules/activity/activity.module';
import { ActivityLog } from './modules/activity/domain/activity-log.entity';
import { TimeLogModule } from './modules/time-log/time-log.module';
import { TimeLog } from './modules/time-log/domain/time-log.entity';
import { DependencyModule } from './modules/dependency/dependency.module';
import { TaskDependency } from './modules/dependency/domain/task-dependency.entity';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationModule } from './modules/notification/notification.module';
import { Notification } from './modules/notification/domain/notification.entity';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [
          User, Project, ProjectMember, Epic, Sprint, Task, Label,
          Comment, Attachment, Watcher,
          ActivityLog, TimeLog, TaskDependency, Notification,
        ],
        
        
        
        
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),

    UserModule,
    AuthModule,
    ProjectModule,
    EpicModule,
    SprintModule,
    TaskModule,
    LabelModule,
    CommentModule,
    AttachmentModule,
    WatcherModule,
    ActivityModule,
    TimeLogModule,
    DependencyModule,
    DashboardModule,
    NotificationModule,
    SearchModule,
  ],
})
export class AppModule { }
