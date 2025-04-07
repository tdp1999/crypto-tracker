import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTable1744019198331 implements MigrationInterface {
    name = 'AddUserTable1744019198331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."users_status_enum" AS ENUM(
                'active',
                'pending',
                'inactive',
                'banned',
                'deleted'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" bigint NOT NULL,
                "created_by_id" uuid NOT NULL,
                "updated_at" bigint NOT NULL,
                "updated_by_id" uuid NOT NULL,
                "deleted_at" bigint,
                "deleted_by_id" uuid,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "salt" character varying NOT NULL,
                "isSystem" boolean NOT NULL DEFAULT false,
                "status" "public"."users_status_enum" NOT NULL DEFAULT 'active',
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_status_enum"
        `);
    }

}
