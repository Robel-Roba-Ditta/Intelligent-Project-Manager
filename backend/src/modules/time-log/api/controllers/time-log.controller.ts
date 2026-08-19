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
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/application/jwt.strategy';
import { TimeLogService } from '../../application/time-log.service';
import { CreateTimeLogDto } from '../dto/create-time-log.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TimeLogController {
  constructor(private readonly timeLogService: TimeLogService) {}

  @Post('tasks/:taskId/time-logs')
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateTimeLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.timeLogService.create(taskId, dto, user.sub);
  }

  @Get('tasks/:taskId/time-logs')
  findAllByTask(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.timeLogService.findAllByTask(taskId);
  }

  @Delete('time-logs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.timeLogService.remove(id, user.sub);
  }
}
