import {
  DeepPartial,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { IBaseRepository } from './base.repository.interface';
import { CommonEntity } from './common.entity';

export abstract class BaseRepository<
  T extends CommonEntity,
> implements IBaseRepository<T> {
  protected readonly repository!: Repository<T>;
  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  public async getAll(
    relations: string[] = [],
    withDeleted = false,
  ): Promise<T[]> {
    const where = {} as FindOptionsWhere<T>;
    return this.repository.find({ where, withDeleted, relations });
  }

  public async getById(
    id: string,
    relations: string[] = [],
    withDeleted = false,
  ): Promise<T | null> {
    const findOptions: FindOneOptions<T> = {
      where: { id } as FindOptionsWhere<T>,
      relations,
      withDeleted,
    };

    const result = await this.repository.findOne(findOptions);
    return result ?? null;
  }

  public async insert(data: DeepPartial<T> & Partial<T>): Promise<T> {
    const entity = this.repository.create(data as DeepPartial<T>);
    return this.repository.save(entity);
  }
  async update(id: string, data: Partial<any>): Promise<T | null> {
    await this.repository.update(id, data);
    return this.getById(id);
  }

  public async save(itemData: DeepPartial<T>): Promise<T> {
    return this.repository.save(itemData);
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return Boolean(result.affected && result.affected > 0);
  }

  public async restore(id: string): Promise<boolean> {
    const result = await this.repository.restore(id);
    return Boolean(result.affected && result.affected > 0);
  }

  public async archive(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return Boolean(result.affected && result.affected > 0);
  }

  public async getOneByJsonField(
    field: string,
    jsonProperty: string,
    value: unknown,
    relations: string[] = [],
    withDeleted = false,
  ): Promise<T | null> {
    const builder = this.repository
      .createQueryBuilder('table')
      .where(`table.${field}->>'${jsonProperty}' = :property`, {
        property: String(value),
      });

    if (relations.length > 0) {
      for (const relation of relations) {
        builder.leftJoinAndSelect(`table.${relation}`, relation);
      }
    }

    if (withDeleted) {
      builder.withDeleted();
    }

    return builder.getOne();
  }

  public async getOneBy(
    field: string,
    value: unknown,
    relations: string[] = [],
    withDeleted = false,
  ): Promise<T | null> {
    const where = { [field]: value } as FindOptionsWhere<T>;

    const result = await this.repository.findOne({
      where,
      relations,
      withDeleted,
    });
    return result ?? null;
  }

  public async getAllBy(
    field: string,
    value: unknown,
    relations: string[] = [],
    withDeleted = false,
  ): Promise<T[]> {
    const where = { [field]: value } as FindOptionsWhere<T>;

    return this.repository.find({
      where,
      relations,
      withDeleted,
    });
  }
}
