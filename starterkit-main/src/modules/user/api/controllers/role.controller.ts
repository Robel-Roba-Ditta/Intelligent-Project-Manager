import { IncludeQuery, CollectionQuery } from '@common/collection-query';
import { CurrentUserDto } from '@common/current-user.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  DataResponseFormat,
  ApiPaginatedResponse,
} from '@common/response-format';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateRoleCommand,
  UpdateRoleCommand,
  ArchiveRoleCommand,
} from '../dto/role.command';
import { RoleResponse } from '../responses/role.response';
import { RoleService } from '@user/application/role.service';

@Controller('roles')
@ApiTags('roles')
@ApiResponse({ status: 500, description: 'Internal error' })
@ApiResponse({ status: 404, description: 'Item not found' })
@ApiExtraModels(DataResponseFormat)
export class RoleController {
  constructor(private roleService: RoleService) {}
  @Get(':id')
  @ApiOkResponse({ type: RoleResponse })
  async getRole(@Param('id') id: string, @Query() includeQuery: IncludeQuery) {
    return this.roleService.getRole(id, includeQuery.includes, true);
  }

  @Get()
  @ApiPaginatedResponse(RoleResponse)
  async getRoles(@Query() query: CollectionQuery) {
    return this.roleService.getRoles(query);
  }
  @Post()
  @ApiOkResponse({ type: RoleResponse })
  async createRole(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() createRoleCommand: CreateRoleCommand,
  ) {
    createRoleCommand.currentUser = currentUser;
    return this.roleService.createRole(createRoleCommand);
  }
  @Put()
  @ApiOkResponse({ type: RoleResponse })
  async updateRole(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() updateRoleCommand: UpdateRoleCommand,
  ) {
    updateRoleCommand.currentUser = currentUser;
    return this.roleService.updateRole(updateRoleCommand);
  }
  @Delete()
  @ApiOkResponse({ type: RoleResponse })
  async archiveRole(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() archiveCommand: ArchiveRoleCommand,
  ) {
    archiveCommand.currentUser = currentUser;
    return this.roleService.archiveRole(archiveCommand);
  }
  @Delete(':id')
  @ApiOkResponse({ type: Boolean })
  async deleteRole(
    @CurrentUser() currentUser: CurrentUserDto,
    @Param('id') id: string,
  ) {
    return this.roleService.deleteRole(id);
  }
  @Post('restore/:id')
  @ApiOkResponse({ type: RoleResponse })
  async restoreRole(
    @CurrentUser() currentUser: CurrentUserDto,
    @Param('id') id: string,
  ) {
    return this.roleService.restoreRole(id, currentUser);
  }
  @Get('get-archived')
  @ApiPaginatedResponse(RoleResponse)
  async getArchivedRoles(@Query() query: CollectionQuery) {
    return this.roleService.getArchivedRoles(query);
  }
  @Get('get-archived/:id')
  @ApiOkResponse({ type: RoleResponse })
  async getArchivedRole(
    @Param('id') id: string,
    @Query() includeQuery: IncludeQuery,
  ) {
    return this.roleService.getRole(id, includeQuery.includes, true);
  }
}
