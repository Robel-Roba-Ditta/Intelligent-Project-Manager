import { Controller, Get, Patch, Post, Param, Body, UseGuards, Request, ForbiddenException, ParseIntPipe } from '@nestjs/common';
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

  @Patch(':id/active')
  async setActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isActive: boolean },
    @Request() req: any,
  ) {
    // Only site admins can deactivate/reactivate users
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only site admins can manage user accounts');
    }
    return this.userService.setActive(id, body.isActive);
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

