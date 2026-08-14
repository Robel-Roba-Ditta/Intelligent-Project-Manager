import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { WatchersService } from './watchers.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class WatchersController {
  constructor(private readonly watchersService: WatchersService) {}

  @Post('tasks/:id/watch')
  watch(
    @Param('id', ParseIntPipe) taskId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.watchersService.watch(taskId, user.sub);
  }

  @Delete('tasks/:id/watch')
  @HttpCode(HttpStatus.OK)
  unwatch(
    @Param('id', ParseIntPipe) taskId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.watchersService.unwatch(taskId, user.sub);
  }

  @Get('tasks/:id/watch')
  getWatchStatus(
    @Param('id', ParseIntPipe) taskId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.watchersService.isWatching(taskId, user.sub);
  }
}
