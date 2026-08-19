import { CurrentUserDto } from '@common/current-user.dto';
import { UserAddress } from '@common/dto/user-address';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserEntity } from '@user/domain/user.entity';
import { IsEmail, IsNotEmpty } from 'class-validator';
export class CreateUserCommand {
  @ApiProperty()
  @IsNotEmpty()
  firstName!: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email!: string;
  @ApiProperty()
  @IsNotEmpty()
  middleName?: string;
  @ApiProperty()
  @IsNotEmpty()
  password!: string;
  @ApiProperty()
  @IsNotEmpty()
  gender!: string;
  @ApiProperty()
  dateOfBirth!: Date;
  @ApiProperty()
  address?: UserAddress;
  @ApiProperty()
  phone?: string;
  @ApiProperty()
  lastName!: string;

  static toEntity(command: CreateUserCommand): UserEntity {
    const entity = new UserEntity();
    entity.firstName = command.firstName;
    entity.lastName = command.lastName;
    entity.isActive = true;
    entity.email = command.email;
    entity.middleName = command.middleName;
    entity.password = command.password;
    entity.gender = command.gender;
    entity.dateOfBirth = command.dateOfBirth;
    entity.address = command.address;
    entity.phone = command.phone;
    return entity;
  }
}
export class UpdateUserCommand extends PartialType(CreateUserCommand) {
  @ApiProperty({
    example: 'd02dd06f-2a30-4ed8-a2a0-75c683e3092e',
  })
  @IsNotEmpty()
  id!: string;
  @ApiProperty()
  isActive!: boolean;
  currentUser?: CurrentUserDto;
}
export class ArchiveUserCommand {
  @ApiProperty({
    example: 'd02dd06f-2a30-4ed8-a2a0-75c683e3092e',
  })
  @IsNotEmpty()
  id!: string;
  @ApiProperty()
  @IsNotEmpty()
  reason!: string;
  currentUser?: CurrentUserDto;
}
