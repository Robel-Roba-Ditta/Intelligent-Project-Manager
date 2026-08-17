import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { ProjectsModule } from './projects/projects.module';
import { Project } from './projects/entities/project.entity';
import { ProjectMember } from './projects/entities/project-member.entity';
import { EpicsModule } from './epics/epics.module';
import { Epic } from './epics/entities/epic.entity';
import { SprintsModule } from './sprints/sprints.module';
import { Sprint } from './sprints/entities/sprint.entity';
import { TasksModule } from './tasks/tasks.module';
import { Task } from './tasks/entities/task.entity';
import { LabelsModule } from './labels/labels.module';
import { Label } from './labels/entities/label.entity';
import { CommentsModule } from './comments/comments.module';
import { Comment } from './comments/entities/comment.entity';
import { AttachmentsModule } from './attachments/attachments.module';
import { Attachment } from './attachments/entities/attachment.entity';
import { WatchersModule } from './watchers/watchers.module';
import { Watcher } from './watchers/entities/watcher.entity';
import { ActivityModule } from './activity/activity.module';
import { ActivityLog } from './activity/entities/activity-log.entity';
import { TimeLogsModule } from './time-logs/time-logs.module';
import { TimeLog } from './time-logs/entities/time-log.entity';
import { DependenciesModule } from './dependencies/dependencies.module';
import { TaskDependency } from './dependencies/entities/task-dependency.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';
import { SearchModule } from './search/search.module';

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
        synchronize: true,
      }),
    }),

    UsersModule,
    AuthModule,
    ProjectsModule,
    EpicsModule,
    SprintsModule,
    TasksModule,
    LabelsModule,
    CommentsModule,
    AttachmentsModule,
    WatchersModule,
    ActivityModule,
    TimeLogsModule,
    DependenciesModule,
    DashboardModule,
    NotificationsModule,
    SearchModule,
  ],
})
export class AppModule { }
