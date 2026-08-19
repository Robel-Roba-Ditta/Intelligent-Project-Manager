import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/application/jwt.strategy';
import { SprintService } from '../../application/sprint.service';
import { CreateSprintDto } from '../dto/create-sprint.dto';
import { UpdateSprintDto } from '../dto/update-sprint.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post('projects/:projectId/sprints')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateSprintDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintService.create(projectId, dto, user.sub);
  }

  @Get('sprints/me/active')
  findActiveForUser(@CurrentUser() user: JwtPayload) {
    return this.sprintService.findActiveForUser(user.sub);
  }

  @Get('projects/:projectId/sprints')
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintService.findAllByProject(projectId, user.sub);
  }

  @Get('sprints/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sprintService.findOne(id);
  }

  @Patch('sprints/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSprintDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintService.update(id, dto, user.sub);
  }

  @Delete('sprints/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintService.remove(id, user.sub);
  }

  @Post('sprints/:id/start')
  start(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintService.start(id, user.sub);
  }

  @Post('sprints/:id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintService.complete(id, user.sub);
  }

  @Get('sprints/:id/burndown')
  burndown(@Param('id', ParseIntPipe) id: number) {
    return this.sprintService.getBurndown(id);
  }
}
