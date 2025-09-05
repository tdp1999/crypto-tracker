import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetTables1754040000000 implements MigrationInterface {
    name = 'CreateAssetTables1754040000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "assets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "created_by_id" uuid NOT NULL,
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_by_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP,
                "deleted_by_id" uuid,
                "user_id" uuid NOT NULL,
                "name" varchar(255) NOT NULL,
                "current_value" numeric NOT NULL DEFAULT 0,
                "type" varchar(100) NOT NULL,
                "location" varchar(255),
                "description" text,
                CONSTRAINT "PK_assets_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_assets_user_id" ON "assets" ("user_id")
        `);

        await queryRunner.query(`
            CREATE TABLE "asset_targets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "created_by_id" uuid NOT NULL,
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_by_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP,
                "deleted_by_id" uuid,
                "asset_id" uuid NOT NULL,
                "target_value" numeric NOT NULL,
                CONSTRAINT "PK_asset_targets_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_asset_targets_asset_id" ON "asset_targets" ("asset_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_asset_targets_asset_id"
        `);
        await queryRunner.query(`
            DROP TABLE "asset_targets"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_assets_user_id"
        `);
        await queryRunner.query(`
            DROP TABLE "assets"
        `);
    }
}
