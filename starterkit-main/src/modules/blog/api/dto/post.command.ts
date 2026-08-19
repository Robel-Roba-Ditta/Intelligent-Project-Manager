import { PostEntity } from '@blog/domain/post.entity';
import { CurrentUserDto } from '@common/current-user.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class CreatePostCommand {
  @ApiProperty()
  @IsNotEmpty()
  title!: string;
  @ApiProperty()
  @IsNotEmpty()
  description!: string;
  currentUser?: CurrentUserDto;
  correlationId?: string;

  static toEntity(command: CreatePostCommand): PostEntity {
    const entity = new PostEntity();
    entity.title = command.title;
    entity.description = command.description;
    entity.createdById = command?.currentUser?.id;
    entity.updatedById = command?.currentUser?.id;
    return entity;
  }
}
export class UpdatePostCommand extends PartialType(CreatePostCommand) {
  @ApiProperty({
    example: 'd02dd06f-2a30-4ed8-a2a0-75c683e3092e',
  })
  @IsNotEmpty()
  id!: string;
  correlationId?: string;
}
export class ArchivePostCommand {
  @ApiProperty({
    example: 'd02dd06f-2a30-4ed8-a2a0-75c683e3092e',
  })
  @IsNotEmpty()
  id!: string;
  @ApiProperty()
  @IsNotEmpty()
  reason?: string;
  currentUser?: CurrentUserDto;
  correlationId?: string;
}
