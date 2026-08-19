import { PostService } from '@blog/application/post.service';
import { IncludeQuery, CollectionQuery } from '@common/collection-query';
import { CurrentUserDto } from '@common/current-user.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  ApiPaginatedResponse,
  DataResponseFormat,
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
  Req,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreatePostCommand,
  UpdatePostCommand,
  ArchivePostCommand,
} from '../dto/post.command';
import { PostResponse } from '../responses/post.response';
@Controller('posts')
@ApiTags('posts')
@ApiResponse({ status: 500, description: 'Internal error' })
@ApiResponse({ status: 404, description: 'Item not found' })
@ApiExtraModels(DataResponseFormat)
export class PostController {
  constructor(private postService: PostService) {}
  @Get(':id')
  @ApiOkResponse({ type: PostResponse })
  async getPost(@Param('id') id: string, @Query() includeQuery: IncludeQuery) {
    return await this.postService.getPost(id, includeQuery.includes, true);
  }
  @Get('get-archived/:id')
  @ApiOkResponse({ type: PostResponse })
  async getArchivedPost(
    @Param('id') id: string,
    @Query() includeQuery: IncludeQuery,
  ) {
    return await this.postService.getPost(id, includeQuery.includes, true);
  }
  @Get()
  @ApiPaginatedResponse(PostResponse)
  async getPosts(
    @Query() query: CollectionQuery,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return await this.postService.getPosts(query, currentUser);
  }
  @Post()
  @ApiOkResponse({ type: PostResponse })
  async createPost(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() createPostCommand: CreatePostCommand,
    @Req() req: any,
  ) {
    createPostCommand.correlationId = req.correlationId;
    createPostCommand.currentUser = currentUser;
    return await this.postService.createPost(createPostCommand);
  }
  @Put()
  @ApiOkResponse({ type: PostResponse })
  async updatePost(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() updatePostCommand: UpdatePostCommand,
    @Req() req: any,
  ) {
    updatePostCommand.correlationId = req.correlationId;
    updatePostCommand.currentUser = currentUser;
    return await this.postService.updatePost(updatePostCommand);
  }
  @Delete('archive')
  @ApiOkResponse({ type: PostResponse })
  async archivePost(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() archiveCommand: ArchivePostCommand,
    @Req() req: any,
  ) {
    archiveCommand.correlationId = req.correlationId;
    archiveCommand.currentUser = currentUser;
    return await this.postService.archivePost(archiveCommand);
  }
  @Delete(':id')
  @ApiOkResponse({ type: Boolean })
  async deletePost(
    @CurrentUser() currentUser: CurrentUserDto,
    @Param('id') id: string,
  ) {
    return await this.postService.deletePost(id);
  }
  @Post('restore/:id')
  @ApiOkResponse({ type: PostResponse })
  async restorePost(
    @CurrentUser() currentUser: CurrentUserDto,
    @Param('id') id: string,
  ) {
    return await this.postService.restorePost(id, currentUser);
  }
  @Get('get-archived-posts')
  @ApiPaginatedResponse(PostResponse)
  async getArchivedPosts(
    @Query() query: CollectionQuery,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return await this.postService.getArchivedPosts(query, currentUser);
  }
}
