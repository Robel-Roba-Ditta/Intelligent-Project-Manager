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
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/application/jwt.strategy';
import { WatcherService } from '../../application/watcher.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class WatcherController {
  constructor(private readonly watcherService: WatcherService) {}

  @Post('tasks/:id/watch')
  watch(
    @Param('id', ParseIntPipe) taskId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.watcherService.watch(taskId, user.sub);
  }

  @Delete('tasks/:id/watch')
  @HttpCode(HttpStatus.OK)
  unwatch(
    @Param('id', ParseIntPipe) taskId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.watcherService.unwatch(taskId, user.sub);
  }

  @Get('tasks/:id/watch')
  getWatchStatus(
    @Param('id', ParseIntPipe) taskId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.watcherService.isWatching(taskId, user.sub);
  }
}
