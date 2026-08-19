import {
  CollectionQuery,
  QueryConstructor,
  FilterOperators,
} from '@common/collection-query';
import { CurrentUserDto } from '@common/current-user.dto';
import { DataResponseFormat } from '@common/response-format';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateRoleCommand,
  UpdateRoleCommand,
  ArchiveRoleCommand,
} from '@user/api/dto/role.command';
import { RoleResponse } from '@user/api/responses/role.response';
import { RoleEntity } from '@user/domain/role.entity';
import { RoleRepository } from '@user/infrastructure/role.repository';
import { Repository } from 'typeorm';
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private roleTypeormRepository: Repository<RoleEntity>,
    private readonly roleRepository: RoleRepository,
  ) {}
  async createRole(command: CreateRoleCommand): Promise<RoleResponse> {
    if (await this.roleRepository.getOneBy('name', command.name, [], true)) {
      throw new BadRequestException(`Role already exist with this name`);
    }
    if (await this.roleRepository.getOneBy('key', command.key, [], true)) {
      throw new BadRequestException(`Role already exist with this key`);
    }
    const roleDomain = CreateRoleCommand.toEntity(command);
    roleDomain.createdById = command?.currentUser?.id;
    roleDomain.updatedById = command?.currentUser?.id;
    const role = await this.roleRepository.insert(roleDomain);

    return RoleResponse.toResponse(role);
  }
  async updateRole(command: UpdateRoleCommand): Promise<RoleResponse> {
    const role = await this.roleRepository.getById(command.id);
    if (!role) {
      throw new NotFoundException(`Role not found with id ${command.id}`);
    }
    if (role.name !== command.name) {
      const user = await this.roleRepository.getOneBy(
        'name',
        command.name,
        [],
        true,
      );
      if (user) {
        throw new BadRequestException(`Role already exist with this name`);
      }
    }
    if (role.key !== command.key) {
      const user = await this.roleRepository.getOneBy(
        'key',
        command.key,
        [],
        true,
      );
      if (user) {
        throw new BadRequestException(`Role already exist with this key`);
      }
    }
    role.name = command.name ?? role.name;
    role.key = command.key ?? role.key;
    role.description = command.description ?? command.description;
    role.updatedById = command?.currentUser?.id;
    const result = await this.roleRepository.save(role);
    return RoleResponse.toResponse(result);
  }
  async archiveRole(command: ArchiveRoleCommand): Promise<RoleResponse> {
    const roleDomain = await this.roleRepository.getById(command.id);
    if (!roleDomain) {
      throw new NotFoundException(`Role not found with id ${command.id}`);
    }
    roleDomain.deletedAt = new Date();
    roleDomain.deletedById = command?.currentUser?.id;
    const result = await this.roleRepository.save(roleDomain);

    return RoleResponse.toResponse(result);
  }
  async restoreRole(
    id: string,
    currentUser: CurrentUserDto,
  ): Promise<RoleResponse> {
    const roleDomain = await this.roleRepository.getById(id, [], true);
    if (!roleDomain) {
      throw new NotFoundException(`Role not found with id ${id}`);
    }
    await this.roleRepository.restore(id);
    roleDomain.deletedAt = undefined;
    return RoleResponse.toResponse(roleDomain);
  }
  async deleteRole(id: string): Promise<boolean> {
    const roleDomain = await this.roleRepository.getById(id, [], true);
    if (!roleDomain) {
      throw new NotFoundException(`Role not found with id ${id}`);
    }
    return await this.roleRepository.delete(id);
  }
  async getRole(
    id: string,
    relations: string[] = [],
    withDeleted = false,
  ): Promise<RoleResponse> {
    const role = await this.roleRepository.getById(id, relations, withDeleted);
    if (!role) {
      throw new NotFoundException(`Role not found with id ${id}`);
    }
    return RoleResponse.toResponse(role);
  }
  async getRoles(
    query: CollectionQuery,
  ): Promise<DataResponseFormat<RoleResponse>> {
    const dataQuery = QueryConstructor.constructQuery<RoleEntity>(
      this.roleTypeormRepository,
      query,
    );
    const response = new DataResponseFormat<RoleResponse>();
    if (query.count) {
      response.count = await dataQuery.getCount();
    } else {
      const [result, total] = await dataQuery.getManyAndCount();
      response.data = result.map((entity) => RoleResponse.toResponse(entity));
      response.count = total;
      response.pageNumber = query.pageNumber;
      response.pageSize = query.pageSize;
    }
    return response;
  }
  async getArchivedRoles(
    query: CollectionQuery,
  ): Promise<DataResponseFormat<RoleResponse>> {
    if (!query.filter) {
      query.filter = [];
    }
    query.filter.push([
      {
        field: 'deleted_at',
        operator: FilterOperators.NotNull,
      },
    ]);
    const dataQuery = QueryConstructor.constructQuery<RoleEntity>(
      this.roleTypeormRepository,
      query,
    );
    dataQuery.withDeleted();
    const response = new DataResponseFormat<RoleResponse>();
    if (query.count) {
      response.count = await dataQuery.getCount();
    } else {
      const [result, total] = await dataQuery.getManyAndCount();
      response.data = result.map((entity) => RoleResponse.toResponse(entity));
      response.count = total;
      response.pageNumber = query.pageNumber;
      response.pageSize = query.pageSize;
    }
    return response;
  }
}
