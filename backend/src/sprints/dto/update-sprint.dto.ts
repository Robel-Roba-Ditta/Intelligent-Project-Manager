import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateSprintDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  goal?: string;
}
