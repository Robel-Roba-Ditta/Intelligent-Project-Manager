import { ApiProperty } from '@nestjs/swagger';

export class UserAddress {
  @ApiProperty()
  country?: string;
  @ApiProperty()
  state?: string;
  @ApiProperty()
  city?: string;
}
