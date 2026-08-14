import {
  Body,
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
import { TimeLogsService } from './time-logs.service';
import { CreateTimeLogDto } from './dto/create-time-log.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TimeLogsController {
  constructor(private readonly timeLogsService: TimeLogsService) {}

  @Post('tasks/:taskId/time-logs')
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateTimeLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.timeLogsService.create(taskId, dto, user.sub);
  }

  @Get('tasks/:taskId/time-logs')
  findAllByTask(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.timeLogsService.findAllByTask(taskId);
  }

  @Delete('time-logs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.timeLogsService.remove(id, user.sub);
  }
}
