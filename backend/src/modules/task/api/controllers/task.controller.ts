import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/application/jwt.strategy';
import { TaskService } from '../../application/task.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

import { UpdateTaskStatusDto } from '../dto/update-task-status.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('projects/:projectId/tasks')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taskService.create(projectId, dto, user.sub);
  }

  @Get('tasks/me')
  findAllForUser(@CurrentUser() user: JwtPayload) {
    return this.taskService.findAllForUser(user.sub);
  }

  @Get('projects/:projectId/tasks')
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: JwtPayload,
    @Query('assigneeId') assigneeId?: string,
    @Query('sprintId') sprintId?: string,
    @Query('epicId') epicId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.taskService.findAllByProject(projectId, user.sub, {
      assigneeId: assigneeId ? Number(assigneeId) : undefined,
      sprintId: sprintId ? Number(sprintId) : undefined,
      epicId: epicId ? Number(epicId) : undefined,
      status,
      priority,
      search,
    });
  }

  @Get('tasks/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Patch('tasks/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taskService.update(id, dto, user.sub);
  }

  @Patch('tasks/:id/status')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taskService.changeStatus(id, dto.status, user.sub);
  }

  @Delete('tasks/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taskService.remove(id, user.sub);
  }
}

