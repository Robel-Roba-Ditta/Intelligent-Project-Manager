import { BaseRepository } from '@common/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '@user/domain/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleRepository extends BaseRepository<RoleEntity> {
  constructor(
    @InjectRepository(RoleEntity)
    roleRepository: Repository<RoleEntity>,
  ) {
    super(roleRepository);
  }
}
