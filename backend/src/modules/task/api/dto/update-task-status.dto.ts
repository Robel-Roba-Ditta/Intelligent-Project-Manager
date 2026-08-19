import { IsEnum } from 'class-validator';
import { TaskStatus } from '../../domain/task.entity';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
