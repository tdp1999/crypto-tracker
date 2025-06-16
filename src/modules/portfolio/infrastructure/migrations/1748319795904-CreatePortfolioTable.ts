import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePortfolioTable1748319795904 implements MigrationInterface {
    name = 'CreatePortfolioTable1748319795904';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "portfolios" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "created_by_id" uuid NOT NULL,
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_by_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP,
                "deleted_by_id" uuid,
                "name" character varying(255) NOT NULL,
                "description" text,
                "userId" uuid NOT NULL,
                "isDefault" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_portfolios_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_portfolios_user_name" UNIQUE ("userId", "name")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_portfolios_user_id" ON "portfolios" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_portfolios_is_default" ON "portfolios" ("userId", "isDefault")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_portfolios_is_default"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_portfolios_user_id"
        `);

        await queryRunner.query(`
            DROP TABLE "portfolios"
        `);
    }
}
