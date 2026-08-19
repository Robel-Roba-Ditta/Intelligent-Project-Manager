import { PostEntity } from '@blog/domain/post.entity';
import { BaseRepository } from '@common/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PostRepository extends BaseRepository<PostEntity> {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {
    super(postRepository);
  }
}
