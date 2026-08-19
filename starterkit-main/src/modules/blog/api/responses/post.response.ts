import { PostEntity } from '@blog/domain/post.entity';
import { ApiProperty } from '@nestjs/swagger';
export class PostResponse {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  title!: string;
  @ApiProperty()
  description!: string;
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
  static toResponse(entity: PostEntity): PostResponse {
    const response = new PostResponse();
    response.id = entity.id;
    response.title = entity.title;
    response.description = entity.description;
    response.createdById = entity.createdById;
    response.updatedById = entity.updatedById;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    response.deletedAt = entity.deletedAt;
    response.deletedById = entity.deletedById;
    return response;
  }
}
