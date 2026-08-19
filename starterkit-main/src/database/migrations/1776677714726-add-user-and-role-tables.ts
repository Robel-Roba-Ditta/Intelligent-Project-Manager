import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAndRoleTables1776677714726 implements MigrationInterface {
  name = 'AddUserAndRoleTables1776677714726';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_by" character varying, "updated_by" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" character varying, "first_name" character varying NOT NULL, "middle_name" character varying, "last_name" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "phone" character varying, "job_title" character varying, "gender" character varying, "profile_picture" jsonb, "is_active" boolean NOT NULL DEFAULT true, "date_of_birth" date, "address" jsonb, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3ffb1c0c8416b9fc6f907b743" ON "users" ("id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_by" character varying, "updated_by" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" character varying, "user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8acd5cf26ebd158416f477de79" ON "user_roles" ("id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_by" character varying, "updated_by" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" character varying, "name" character varying NOT NULL, "key" character varying NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "UQ_a87cf0659c3ac379b339acf36a2" UNIQUE ("key"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1433d71a4838793a49dcad46a" ON "roles" ("id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1433d71a4838793a49dcad46a"`,
    );
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8acd5cf26ebd158416f477de79"`,
    );
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3ffb1c0c8416b9fc6f907b743"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
