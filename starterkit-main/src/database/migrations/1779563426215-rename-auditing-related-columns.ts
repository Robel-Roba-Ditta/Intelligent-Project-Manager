import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAuditingRelatedColumns1779563426215 implements MigrationInterface {
  name = 'RenameAuditingRelatedColumns1779563426215';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "updated_by"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_by"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_by"`);
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP COLUMN "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP COLUMN "updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updated_by"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_by"`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "created_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "updated_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "deleted_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deleted_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD "created_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD "updated_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD "deleted_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "created_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "updated_by_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "deleted_by_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_by_id"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "created_by_id"`);
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP COLUMN "deleted_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP COLUMN "updated_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP COLUMN "created_by_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_by_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by_id"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "deleted_by_id"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "created_by_id"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "deleted_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "updated_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "created_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD "deleted_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD "updated_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD "created_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deleted_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "deleted_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "updated_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "created_by" character varying`,
    );
  }
}
