import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { EpicStatus } from '../../domain/epic.entity';

export class UpdateEpicDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(EpicStatus)
  status?: EpicStatus;
}
