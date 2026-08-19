import { IncludeQuery, CollectionQuery } from '@common/collection-query';
import { CurrentUserDto } from '@common/current-user.dto';
import { AllowAnonymous } from '@common/decorators/allow-anonymous.decorator';
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
  CreateUserCommand,
  UpdateUserCommand,
  ArchiveUserCommand,
} from '../dto/user.command';
import { UserResponse } from '../responses/user.response';
import { UserService } from '@user/application/user.service';
import {
  CreateUserRoleCommand,
  CreateBulkUserRoleCommand,
  UpdateUserRoleCommand,
  RemoveUserRoleCommand,
} from '../dto/user-role.command';
@Controller('users')
@ApiTags('users')
@ApiResponse({ status: 500, description: 'Internal error' })
@ApiResponse({ status: 404, description: 'Item not found' })
@ApiExtraModels(DataResponseFormat)
export class UserController {
  constructor(private userService: UserService) {}
  @Get('get-user/:id')
  @ApiOkResponse({ type: UserResponse })
  async getUser(@Param('id') id: string, @Query() includeQuery: IncludeQuery) {
    return await this.userService.getUser(id, includeQuery.includes, true);
  }
  @Get()
  @ApiPaginatedResponse(UserResponse)
  async getUsers(@Query() query: CollectionQuery) {
    return await this.userService.getUsers(query);
  }
  @Post()
  @ApiOkResponse({ type: UserResponse })
  @AllowAnonymous()
  async createUser(@Body() createUserCommand: CreateUserCommand) {
    return await this.userService.createUser(createUserCommand);
  }
  @Put()
  @ApiOkResponse({ type: UserResponse })
  async updateUser(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() updateUserCommand: UpdateUserCommand,
  ) {
    updateUserCommand.currentUser = currentUser;
    return await this.userService.updateUser(updateUserCommand);
  }
  @Delete('archive')
  @ApiOkResponse({ type: UserResponse })
  async archiveUser(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() archiveCommand: ArchiveUserCommand,
  ) {
    archiveCommand.currentUser = currentUser;
    return await this.userService.archiveUser(archiveCommand);
  }
  @Delete(':id')
  @ApiOkResponse({ type: Boolean })
  async deleteUser(
    @CurrentUser() currentUser: CurrentUserDto,
    @Param('id') id: string,
  ) {
    return await this.userService.deleteUser(id);
  }
  @Post('restore/:id')
  @ApiOkResponse({ type: UserResponse })
  async restoreUser(@Param('id') id: string) {
    return await this.userService.restoreUser(id);
  }
  @Get('get-archived')
  @ApiPaginatedResponse(UserResponse)
  async getArchivedUsers(@Query() query: CollectionQuery) {
    return await this.userService.getArchivedUsers(query);
  }
  @Get('get-archived/:id')
  @ApiOkResponse({ type: UserResponse })
  async getArchivedUser(
    @Param('id') id: string,
    @Query() includeQuery: IncludeQuery,
  ) {
    return await this.userService.getUser(id, includeQuery.includes, true);
  }
  // user role
  @Post('add-user-role')
  @ApiOkResponse({ type: UserResponse })
  async addUserRole(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() command: CreateUserRoleCommand,
  ) {
    command.currentUser = currentUser;
    return await this.userService.addUserRole(command);
  }
  @Post('add-bulk-user-role')
  @ApiOkResponse({ type: UserResponse })
  async addBulkUserRole(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() command: CreateBulkUserRoleCommand,
  ) {
    command.currentUser = currentUser;
    return await this.userService.addBulkUserRole(command);
  }
  @Put('update-user-role')
  @ApiOkResponse({ type: UserResponse })
  async updateUserRole(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() command: UpdateUserRoleCommand,
  ) {
    command.currentUser = currentUser;
    return await this.userService.updateUserRole(command);
  }
  @Post('remove-user-role')
  @ApiOkResponse({ type: UserResponse })
  async archiveUserRole(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() command: RemoveUserRoleCommand,
  ) {
    command.currentUser = currentUser;
    return await this.userService.removeUserRole(command);
  }
  @Get('get-users-by-role/:roleId')
  @ApiPaginatedResponse(UserResponse)
  async getUsersByRole(
    @Param('roleId') roleId: string,
    @Query() query: CollectionQuery,
  ) {
    return await this.userService.getUsersByRole(roleId, query);
  }
}
