import { ApiProperty } from '@nestjs/swagger';
import { RoleEntity } from '@user/domain/role.entity';

export class RoleResponse {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  key!: string;
  @ApiProperty()
  description?: string;
  @ApiProperty()
  isActive!: boolean;
  @ApiProperty()
  createdById?: string;
  @ApiProperty()
  updatedById?: string;
  @ApiProperty()
  createdAt?: Date;
  @ApiProperty()
  updatedAt?: Date;
  @ApiProperty()
  deletedAt?: Date;
  @ApiProperty()
  deletedById?: string;
  static toResponse(entity: RoleEntity): RoleResponse {
    const response = new RoleResponse();
    response.id = entity.id;
    response.name = entity.name;
    response.key = entity.key;
    response.description = entity.description;
    response.isActive = entity.isActive;
    response.createdById = entity.createdById;
    response.updatedById = entity.updatedById;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    response.deletedAt = entity.deletedAt;
    response.deletedById = entity.deletedById;
    return response;
  }
}
