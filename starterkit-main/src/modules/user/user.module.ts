import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './application/user.service';
import { UserRepository } from './infrastructure/user.repository';
import { RoleRepository } from './infrastructure/role.repository';
import { RoleService } from './application/role.service';
import { PassportModule } from '@nestjs/passport';
import { RoleController } from './api/controllers/role.controller';
import { UserController } from './api/controllers/user.controller';
import { RoleEntity } from './domain/role.entity';
import { UserRoleEntity } from './domain/user-role.entity';
import { UserEntity } from './domain/user.entity';

@Module({
  controllers: [UserController, RoleController],
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity, UserRoleEntity]),
    PassportModule,
  ],
  providers: [UserRepository, UserService, RoleRepository, RoleService],
})
export class UserModule {}
