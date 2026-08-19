import {
  CollectionQuery,
  FilterOperators,
  QueryConstructor,
} from '@common/collection-query';
import { DataResponseFormat } from '@common/response-format';
import { Util } from '@common/util';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateBulkUserRoleCommand,
  CreateUserRoleCommand,
  UpdateUserRoleCommand,
  RemoveUserRoleCommand,
} from '@user/api/dto/user-role.command';
import {
  CreateUserCommand,
  UpdateUserCommand,
  ArchiveUserCommand,
} from '@user/api/dto/user.command';
import { UserResponse } from '@user/api/responses/user.response';
import { UserEntity } from '@user/domain/user.entity';
import { UserRepository } from '@user/infrastructure/user.repository';
import { Repository } from 'typeorm';
@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private userTypeormRepository: Repository<UserEntity>,
    private readonly userRepository: UserRepository,
  ) {}
  async onModuleInit() {
    const existingAdmin = await this.userRepository.getOneBy(
      'email',
      'admin@gmail.com',
      [],
      true,
    );
    if (!existingAdmin) {
      const defaultAdmin = new UserEntity();
      defaultAdmin.firstName = 'Super';
      defaultAdmin.middleName = 'Admin';
      defaultAdmin.email = 'admin@gmail.com';
      defaultAdmin.lastName = 'Admin';
      defaultAdmin.dateOfBirth = new Date();
      defaultAdmin.address = {
        country: 'Ethiopia',
        state: 'Addis Ababa',
        city: 'Addis Ababa',
      };
      defaultAdmin.phone = '+251912345678';
      defaultAdmin.jobTitle = 'Administrator';
      defaultAdmin.password = Util.hashPassword('P@ssw0rd');
      defaultAdmin.isActive = true;
      defaultAdmin.gender = 'Male';
      const user = await this.userRepository.insert(defaultAdmin);
      console.log('Inserted User ', user);
    }
  }
  async createUser(command: CreateUserCommand): Promise<UserResponse> {
    const userDomain = CreateUserCommand.toEntity(command);
    if (
      command.email &&
      (await this.userRepository.getOneBy('email', command.email, [], true))
    ) {
      throw new BadRequestException(`User already exist with this email`);
    }
    userDomain.password = Util.hashPassword(command.password);
    const user = await this.userRepository.insert(userDomain);
    return UserResponse.toResponse(user);
  }
  async updateUser(command: UpdateUserCommand): Promise<UserResponse> {
    const userDomain = await this.userRepository.getById(command.id);
    if (!userDomain) {
      throw new NotFoundException(`User not found with id ${command.id}`);
    }
    if (userDomain.email.toLowerCase() !== command.email?.toLowerCase()) {
      const existingUser = await this.userRepository.getOneBy(
        'email',
        command.email,
        [],
        true,
      );
      if (existingUser) {
        throw new BadRequestException(`User already exist with this email`);
      }
    }
    Object.assign(userDomain, command);
    userDomain.updatedById = command?.currentUser?.id;
    const user = await this.userRepository.save(userDomain);
    return UserResponse.toResponse(user);
  }
  async archiveUser(command: ArchiveUserCommand): Promise<UserResponse> {
    const userDomain = await this.userRepository.getById(command.id);
    if (!userDomain) {
      throw new NotFoundException(`User not found with id ${command.id}`);
    }
    userDomain.deletedAt = new Date();
    userDomain.deletedById = command?.currentUser?.id;
    const result = await this.userRepository.save(userDomain);

    return UserResponse.toResponse(result);
  }
  async restoreUser(id: string): Promise<UserResponse> {
    const userDomain = await this.userRepository.getById(id, [], true);
    if (!userDomain) {
      throw new NotFoundException(`User not found with id ${id}`);
    }
    await this.userRepository.restore(id);
    userDomain.deletedAt = undefined;
    return UserResponse.toResponse(userDomain);
  }
  async deleteUser(id: string): Promise<boolean> {
    const userDomain = await this.userRepository.getById(id, [], true);
    if (!userDomain) {
      throw new NotFoundException(`User not found with id ${id}`);
    }
    return await this.userRepository.delete(id);
  }
  async getUser(
    id: string,
    relations: string[] = [],
    withDeleted = false,
  ): Promise<UserResponse> {
    const user = await this.userRepository.getById(id, relations, withDeleted);
    if (!user) {
      throw new NotFoundException(`User not found with id ${id}`);
    }
    return UserResponse.toResponse(user);
  }
  async getUsers(
    query: CollectionQuery,
  ): Promise<DataResponseFormat<UserResponse>> {
    const dataQuery = QueryConstructor.constructQuery<UserEntity>(
      this.userTypeormRepository,
      query,
    );
    const response = new DataResponseFormat<UserResponse>();
    if (query.count) {
      response.count = await dataQuery.getCount();
    } else {
      const [result, total] = await dataQuery.getManyAndCount();
      response.data = result.map((entity: UserEntity) =>
        UserResponse.toResponse(entity),
      );
      response.count = total;
      response.pageNumber = query.pageNumber;
      response.pageSize = query.pageSize;
    }
    return response;
  }

  async getArchivedUsers(
    query: CollectionQuery,
  ): Promise<DataResponseFormat<UserResponse>> {
    if (!query.filter) {
      query.filter = [];
    }
    query.filter.push([
      {
        field: 'deleted_at',
        operator: FilterOperators.NotNull,
      },
    ]);
    const dataQuery = QueryConstructor.constructQuery<UserEntity>(
      this.userTypeormRepository,
      query,
    );
    dataQuery.withDeleted();
    const response = new DataResponseFormat<UserResponse>();
    if (query.count) {
      response.count = await dataQuery.getCount();
    } else {
      const [result, total] = await dataQuery.getManyAndCount();
      response.data = result.map((entity: UserEntity) =>
        UserResponse.toResponse(entity),
      );
      response.count = total;
      response.pageNumber = query.pageNumber;
      response.pageSize = query.pageSize;
    }
    return response;
  }
  // userRoles
  async addBulkUserRole(payload: CreateBulkUserRoleCommand) {
    const user = await this.userRepository.getById(payload.userId, [], true);

    if (!user) throw new NotFoundException('User not found');

    const userRoleEntities = payload.roleIds.map((roleId) =>
      CreateUserRoleCommand.toEntity({ userId: payload.userId, roleId }),
    );

    user.userRoles = userRoleEntities;

    const updatedUser = await this.userRepository.save(user);
    return UserResponse.toResponse(updatedUser);
  }
  async addUserRole(payload: CreateUserRoleCommand) {
    const user = await this.userRepository.getById(
      payload.userId,
      ['userRoles'],
      true,
    );
    if (!user) throw new NotFoundException('User not found');
    const userRoleEntity = CreateUserRoleCommand.toEntity(payload);
    user.addUserRole(userRoleEntity);
    const updatedUser = await this.userRepository.save(user);
    return UserResponse.toResponse(updatedUser);
  }
  async updateUserRole(payload: UpdateUserRoleCommand) {
    const user = await this.userRepository.getById(
      payload.userId as string,
      ['userRoles'],
      true,
    );
    if (!user) throw new NotFoundException('User not found');
    let userRole = user.userRoles.find(
      (userRole) => userRole.id === payload.id,
    );
    if (!userRole) throw new NotFoundException('Role not found');
    userRole = { ...userRole, ...payload };
    userRole.updatedById = payload?.currentUser?.id;
    user.updateUserRole(userRole);
    const updatedUser = await this.userRepository.save(user);
    return UserResponse.toResponse(updatedUser);
  }
  async removeUserRole(payload: RemoveUserRoleCommand) {
    const user = await this.userRepository.getById(
      payload.userId,
      ['userRoles'],
      true,
    );
    if (!user) throw new NotFoundException('User not found');
    const userRole = user.userRoles.find(
      (userRole) => userRole.id === payload.id,
    );
    if (!userRole) throw new NotFoundException('Role not found');
    user.removeUserRole(userRole.id);
    const result = await this.userRepository.save(user);
    return UserResponse.toResponse(result);
  }
  async getUsersByRole(
    roleId: string,
    query: CollectionQuery,
  ): Promise<DataResponseFormat<UserResponse>> {
    const dataQuery = QueryConstructor.constructQuery<UserEntity>(
      this.userTypeormRepository,
      query,
    );
    dataQuery.innerJoin('users.userRoles', 'user_roles');
    dataQuery.andWhere('user_roles.role_id = :roleId', { roleId });

    const response = new DataResponseFormat<UserResponse>();
    if (query.count) {
      response.count = await dataQuery.getCount();
    } else {
      const [result, total] = await dataQuery.getManyAndCount();
      response.data = result.map((entity) => UserResponse.toResponse(entity));
      response.count = total;
      response.pageNumber = query.pageNumber;
      response.pageSize = query.pageSize;
    }
    return response;
  }
}
