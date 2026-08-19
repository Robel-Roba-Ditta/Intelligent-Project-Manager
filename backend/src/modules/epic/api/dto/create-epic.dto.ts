import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { EpicStatus } from '../../domain/epic.entity';

export class CreateEpicDto {
  @IsString()
  @MinLength(2, { message: 'Epic name must be at least 2 characters long' })
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(EpicStatus)
  status?: EpicStatus;
}
