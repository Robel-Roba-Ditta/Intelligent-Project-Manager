import { IsString, MinLength, MaxLength, IsUrl } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName: string;

  @IsUrl()
  fileUrl: string;
}
