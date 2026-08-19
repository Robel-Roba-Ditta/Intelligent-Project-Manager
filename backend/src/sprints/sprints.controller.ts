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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post('projects/:projectId/sprints')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateSprintDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.create(projectId, dto, user.sub);
  }

  @Get('sprints/me/active')
  findActiveForUser(@CurrentUser() user: JwtPayload) {
    return this.sprintsService.findActiveForUser(user.sub);
  }

  @Get('projects/:projectId/sprints')
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.findAllByProject(projectId, user.sub);
  }

  @Get('sprints/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sprintsService.findOne(id);
  }

  @Patch('sprints/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSprintDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.update(id, dto, user.sub);
  }

  @Delete('sprints/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.remove(id, user.sub);
  }

  @Post('sprints/:id/start')
  start(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.start(id, user.sub);
  }

  @Post('sprints/:id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.complete(id, user.sub);
  }

  @Get('sprints/:id/burndown')
  burndown(@Param('id', ParseIntPipe) id: number) {
    return this.sprintsService.getBurndown(id);
  }
}
