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
import { TaskPriority, TaskType } from '../../domain/task.entity';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

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
  epicId?: number | null;

  @IsOptional()
  @IsInt()
  sprintId?: number | null;

  @IsOptional()
  @IsInt()
  assigneeId?: number | null;

  @IsOptional()
  @IsInt()
  parentTaskId?: number | null;
}
