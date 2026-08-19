import { BaseRepository } from '@common/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@user/domain/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    userRepository: Repository<UserEntity>,
  ) {
    super(userRepository);
  }
}
