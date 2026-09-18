import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/user.entity';
import { DeviceToken } from '../notification/domain/device-token.entity';
import { UserService } from './application/user.service';
import { UserController } from './api/controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, DeviceToken])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }

