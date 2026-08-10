import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateSprintDto {
  @IsString()
  @MinLength(2, { message: 'Sprint name must be at least 2 characters long' })
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  goal?: string;
}
