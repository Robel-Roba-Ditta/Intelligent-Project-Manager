import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskStatus, TaskPriority, TaskType } from '../../domain/task.entity';

export class CreateTaskDto {
  @IsString()
  @MinLength(2, { message: 'Task title must be at least 2 characters long' })
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  epicId?: number;

  @IsOptional()
  @IsInt()
  sprintId?: number;

  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsInt()
  parentTaskId?: number;
}
