import { CurrentUserDto } from '@common/current-user.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserRoleEntity } from '@user/domain/user-role.entity';
import { IsNotEmpty } from 'class-validator';

export class CreateUserRoleCommand {
  @ApiProperty()
  @IsNotEmpty()
  userId!: string;
  @ApiProperty()
  @IsNotEmpty()
  roleId!: string;

  currentUser?: CurrentUserDto;

  static toEntity(command: CreateUserRoleCommand): UserRoleEntity {
    const entity = new UserRoleEntity();
    entity.userId = command.userId;
    entity.roleId = command.roleId;
    entity.createdById = command?.currentUser?.id;
    entity.updatedById = command?.currentUser?.id;
    return entity;
  }
}

export class CreateBulkUserRoleCommand {
  @ApiProperty()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty()
  roleIds!: string[];

  currentUser?: CurrentUserDto;
}
export class UpdateUserRoleCommand extends PartialType(CreateUserRoleCommand) {
  @ApiProperty({
    example: 'd02dd06f-2a30-4ed8-a2a0-75c683e3092e',
  })
  @IsNotEmpty()
  id!: string;
}

export class RemoveUserRoleCommand {
  @ApiProperty({
    example: 'd02dd06f-2a30-4ed8-a2a0-75c683e3092e',
  })
  @IsNotEmpty()
  id!: string;

  @ApiProperty()
  @IsNotEmpty()
  userId!: string;

  currentUser?: CurrentUserDto;
}
