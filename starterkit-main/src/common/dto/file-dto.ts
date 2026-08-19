import { ApiProperty } from '@nestjs/swagger';

export class FileDto {
  @ApiProperty()
  name!: string;
  @ApiProperty()
  originalName?: string;
  @ApiProperty()
  type?: string;
  @ApiProperty()
  size?: number;
  @ApiProperty()
  bucketName?: string;
}

export interface FileUploadDto {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}
