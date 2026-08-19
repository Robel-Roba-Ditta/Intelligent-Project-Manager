import { PostEntity } from '@blog/domain/post.entity';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { RoleEntity } from '@user/domain/role.entity';
import { UserRoleEntity } from '@user/domain/user-role.entity';
import { UserEntity } from '@user/domain/user.entity';
dotenv.config({ path: '.env' });
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || process.env.POSTGRES_CONTAINER_NAME,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  schema: process.env.DATABASE_SCHEMA,
  port: parseInt(`${process.env.POSTGRES_PORT}`) || 5432,

  entities: [PostEntity, UserEntity, RoleEntity, UserRoleEntity],
  migrations: ['src/database/migrations/*.ts'],

  synchronize: false, // NEVER change this to true! It can lead to data loss. Use migrations instead.
});
