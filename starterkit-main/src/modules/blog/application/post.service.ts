import {
  ArchivePostCommand,
  CreatePostCommand,
  UpdatePostCommand,
} from '@blog/api/dto/post.command';
import { PostResponse } from '@blog/api/responses/post.response';
import { PostEntity } from '@blog/domain/post.entity';
import { PostRepository } from '@blog/infrastructure/post.repostitory';
import { CollectionQuery } from '@common/collection-query';
import { FilterOperators } from '@common/collection-query/filter-operators';
import { QueryConstructor } from '@common/collection-query/query-constructor';
import { CurrentUserDto } from '@common/current-user.dto';
import { DataResponseFormat } from '@common/response-format';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppLogger } from '@observability/logger.service';
import { Repository } from 'typeorm';
@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private postTypeormRepository: Repository<PostEntity>,
    private readonly postRepository: PostRepository,
    private readonly logger: AppLogger,
  ) { }
  async createPost(command: CreatePostCommand): Promise<PostResponse> {
    const postDomain = CreatePostCommand.toEntity(command);
    if (
      command.title &&
      (await this.postRepository.getOneBy('title', command.title, [], true))
    ) {
      throw new BadRequestException(`Post already exist with this title`);
    }
    const post = await this.postRepository.insert(postDomain);
    // it must be json data for better log management and querying in log management tools
    this.logger.log(
      'PostService',
      `Post created with id ${post.id}`,
      command?.correlationId || 'anonymous',
      {
        postId: post.id,
        title: post.title,
      },
    );
    return PostResponse.toResponse(post);
  }
  async updatePost(command: UpdatePostCommand): Promise<PostResponse> {
    const postDomain = await this.postRepository.getById(command.id);
    if (!postDomain) {
      throw new NotFoundException(`Post not found with id ${command.id}`);
    }
    if (postDomain?.title?.toLowerCase() !== command.title?.toLowerCase()) {
      const existingPost = await this.postRepository.getOneBy(
        'title',
        command.title,
        [],
        true,
      );
      if (existingPost) {
        throw new BadRequestException(`Post already exist with this title`);
      }
    }
    Object.assign(postDomain, command);
    postDomain.updatedById = command?.currentUser?.id;
    const post = await this.postRepository.save(postDomain);
    return PostResponse.toResponse(post);
  }
  async archivePost(command: ArchivePostCommand): Promise<PostResponse> {
    const postDomain = await this.postRepository.getById(command.id);
    if (!postDomain) {
      throw new NotFoundException(`Post not found with id ${command.id}`);
    }
    postDomain.deletedAt = new Date();
    postDomain.deletedById = command?.currentUser?.id;
    const result = await this.postRepository.save(postDomain);

    return PostResponse.toResponse(result);
  }
  async restorePost(
    id: string,
    currentUser: CurrentUserDto,
  ): Promise<PostResponse> {
    const postDomain = await this.postRepository.getById(id, [], true);
    if (!postDomain) {
      throw new NotFoundException(`Post not found with id ${id}`);
    }
    await this.postRepository.restore(id);
    postDomain.deletedAt = undefined;
    return PostResponse.toResponse(postDomain);
  }
  async deletePost(id: string): Promise<boolean> {
    const postDomain = await this.postRepository.getById(id, [], true);
    if (!postDomain) {
      throw new NotFoundException(`Post not found with id ${id}`);
    }
    return await this.postRepository.delete(id);
  }
  async getPost(
    id: string,
    relations: string[] = [],
    withDeleted = false,
  ): Promise<PostResponse> {
    const post = await this.postRepository.getById(id, relations, withDeleted);
    if (!post) {
      throw new NotFoundException(`Post not found with id ${id}`);
    }
    return PostResponse.toResponse(post);
  }
  async getPosts(
    query: CollectionQuery,
    currentUser: CurrentUserDto,
  ): Promise<DataResponseFormat<PostResponse>> {
    const dataQuery = QueryConstructor.constructQuery<PostEntity>(
      this.postTypeormRepository,
      query,
    );
    const response = new DataResponseFormat<PostResponse>();
    if (query.count) {
      response.count = await dataQuery.getCount();
    } else {
      const [result, total] = await dataQuery.getManyAndCount();
      response.data = result.map((entity: PostEntity) =>
        PostResponse.toResponse(entity),
      );
      response.count = total;
      response.pageNumber = query.pageNumber;
      response.pageSize = query.pageSize;
    }
    return response;
  }

  async getArchivedPosts(
    query: CollectionQuery,
    currentUser: CurrentUserDto,
  ): Promise<DataResponseFormat<PostResponse>> {
    if (!query.filter) {
      query.filter = [];
    }
    query.filter.push([
      {
        field: 'deleted_at',
        operator: FilterOperators.NotNull,
      },
    ]);
    const dataQuery = QueryConstructor.constructQuery<PostEntity>(
      this.postTypeormRepository,
      query,
    );
    dataQuery.withDeleted();
    const response = new DataResponseFormat<PostResponse>();
    if (query.count) {
      response.count = await dataQuery.getCount();
    } else {
      const [result, total] = await dataQuery.getManyAndCount();
      response.data = result.map((entity: PostEntity) =>
        PostResponse.toResponse(entity),
      );
      response.count = total;
      response.pageNumber = query.pageNumber;
      response.pageSize = query.pageSize;
    }
    return response;
  }
}
