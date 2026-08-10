import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

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
        entities: [User, Project, ProjectMember, Epic, Sprint, Task, Label],
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
  ],
})
export class AppModule { }
