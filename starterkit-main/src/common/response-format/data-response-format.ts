import { ApiProperty } from '@nestjs/swagger';

export class DataResponseFormat<T> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean = true;
  @ApiProperty({ description: 'Total number of items', example: 1 })
  count!: number;
  @ApiProperty({ isArray: true })
  data!: T[];
  @ApiProperty({ description: 'Current page number', example: 1 })
  pageNumber?: number;

  @ApiProperty({ description: 'Number of records per page', example: 10 })
  pageSize?: number;
}
