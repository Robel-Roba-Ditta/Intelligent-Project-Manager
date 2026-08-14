import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityService } from './activity.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('tasks/:id/activity')
  findAllByTask(@Param('id', ParseIntPipe) taskId: number) {
    return this.activityService.findAllByTask(taskId);
  }
}
