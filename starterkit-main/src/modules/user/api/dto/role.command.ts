import { CurrentUserDto } from '@common/current-user.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { RoleEntity } from '@user/domain/role.entity';
import { IsNotEmpty } from 'class-validator';

export class CreateRoleCommand {
  @ApiProperty()
  @IsNotEmpty()
  name!: string;
  @ApiProperty()
  @IsNotEmpty()
  key!: string;
  @ApiProperty()
  description?: string;
  currentUser?: CurrentUserDto;
  static toEntity(command: CreateRoleCommand) {
    const entity = new RoleEntity();
    entity.name = command.name;
    entity.description = command.description;
    entity.key = command.key;
    entity.isActive = true;
    entity.createdById = command?.currentUser?.id;
    entity.updatedById = command?.currentUser?.id;
    return entity;
  }
}
export class UpdateRoleCommand extends PartialType(CreateRoleCommand) {
  @ApiProperty({
    example: 'd02dd06f-2a30-4ed8-a2a0-75c683e3092e',
  })
  @IsNotEmpty()
  id!: string;
  @ApiProperty()
  isActive!: boolean;
}
export class ArchiveRoleCommand {
  @ApiProperty({
    example: 'd02dd06f-2a30-4ed8-a2a0-75c683e3092e',
  })
  @IsNotEmpty()
  id!: string;
  @ApiProperty()
  @IsNotEmpty()
  reason?: string;
  currentUser?: CurrentUserDto;
}
