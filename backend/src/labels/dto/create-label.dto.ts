import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @MinLength(1, { message: 'Label name must not be empty' })
  @MaxLength(50)
  name: string;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Color must be a valid hex color (e.g. #ff5733)' })
  color: string;
}
