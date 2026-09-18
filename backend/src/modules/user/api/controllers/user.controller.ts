import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { UserService } from '../../application/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from '../../../notification/domain/device-token.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
  ) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post('me/push-token')
  async registerPushToken(@Request() req: any, @Body() body: { token: string }) {
    const userId = req.user.sub ?? req.user.id;
    const token = body.token;

    // Upsert: if this token already exists for this user, just return
    const existing = await this.deviceTokenRepo.findOne({
      where: { userId, expoPushToken: token },
    });

    if (existing) {
      return { id: existing.id, registered: true };
    }

    const saved = await this.deviceTokenRepo.save(
      this.deviceTokenRepo.create({ userId, expoPushToken: token }),
    );

    return { id: saved.id, registered: true };
  }
}

