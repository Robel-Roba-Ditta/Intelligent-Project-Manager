import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from './domain/label.entity';
import { Task } from '../task/domain/task.entity';
import { LabelService } from './application/label.service';
import { LabelController } from './api/controllers/label.controller';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Label, Task]), ProjectModule, UserModule],
  controllers: [LabelController],
  providers: [LabelService],
  exports: [LabelService],
})
export class LabelModule {}

