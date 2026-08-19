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
import { EpicService } from '../../application/epic.service';
import { CreateEpicDto } from '../dto/create-epic.dto';
import { UpdateEpicDto } from '../dto/update-epic.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class EpicController {
  constructor(private readonly epicService: EpicService) {}

  @Post('projects/:projectId/epics')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateEpicDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epicService.create(projectId, dto, user.sub);
  }

  @Get('projects/:projectId/epics')
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epicService.findAllByProject(projectId, user.sub);
  }

  @Get('epics/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.epicService.findOne(id);
  }

  @Patch('epics/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEpicDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epicService.update(id, dto, user.sub);
  }

  @Delete('epics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epicService.remove(id, user.sub);
  }
}
