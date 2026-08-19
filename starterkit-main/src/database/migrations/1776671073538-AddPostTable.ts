import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostTable1776671073538 implements MigrationInterface {
  name = 'AddPostTable1776671073538';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_by" character varying, "updated_by" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" character varying, "title" character varying NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2829ac61eff60fcec60d7274b9" ON "posts" ("id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2829ac61eff60fcec60d7274b9"`,
    );
    await queryRunner.query(`DROP TABLE "posts"`);
  }
}
