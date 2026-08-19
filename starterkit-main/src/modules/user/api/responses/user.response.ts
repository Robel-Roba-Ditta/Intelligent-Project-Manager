import { FileDto } from '@common/dto/file-dto';
import { UserAddress } from '@common/dto/user-address';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '@user/domain/user.entity';

export class UserResponse {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  firstName!: string;
  @ApiProperty()
  middleName?: string;
  @ApiProperty()
  lastName?: string;
  @ApiProperty()
  email?: string;
  @ApiProperty()
  phone?: string;
  @ApiProperty()
  jobTitle?: string;
  @ApiProperty()
  gender?: string;
  @ApiProperty()
  profilePicture?: FileDto;
  @ApiProperty()
  isActive!: boolean;
  @ApiProperty()
  dateOfBirth?: Date;
  @ApiProperty()
  address?: UserAddress;
  @ApiProperty()
  createdById?: string;
  @ApiProperty()
  updatedById?: string;
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty()
  updatedAt!: Date;
  @ApiProperty()
  deletedAt?: Date;
  @ApiProperty()
  deletedById?: string;
  static toResponse(entity: UserEntity): UserResponse {
    const response = new UserResponse();
    response.id = entity.id;
    response.firstName = entity.firstName;
    response.middleName = entity.middleName;
    response.lastName = entity.lastName;
    response.email = entity.email;
    response.phone = entity.phone;
    response.jobTitle = entity.jobTitle;
    response.gender = entity.gender;
    response.profilePicture = entity.profilePicture;
    response.isActive = entity.isActive;
    response.dateOfBirth = entity.dateOfBirth;
    response.address = entity.address;
    response.createdById = entity.createdById;
    response.updatedById = entity.updatedById;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    response.deletedAt = entity.deletedAt;
    response.deletedById = entity.deletedById;
    return response;
  }
}
