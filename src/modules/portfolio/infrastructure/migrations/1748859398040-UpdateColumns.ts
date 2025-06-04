import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateColumns1748859398040 implements MigrationInterface {
    name = 'UpdateColumns1748859398040';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_portfolios_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_portfolios_is_default"
        `);
        await queryRunner.query(`
            ALTER TABLE "portfolios" DROP CONSTRAINT "UQ_portfolios_user_name"
        `);

        // Rename columns to preserve data
        await queryRunner.query(`
            ALTER TABLE "portfolios" RENAME COLUMN "userId" TO "user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "portfolios" RENAME COLUMN "isDefault" TO "is_default"
        `);

        // Add named unique constraint (matches entity @Unique decorator)
        await queryRunner.query(`
            ALTER TABLE "portfolios"
            ADD CONSTRAINT "UQ_portfolios_name" UNIQUE ("name")
        `);

        // Recreate indexes with new column names
        await queryRunner.query(`
            CREATE INDEX "IDX_portfolios_is_default" ON "portfolios" ("is_default")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_portfolios_user_id" ON "portfolios" ("user_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_portfolios_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_portfolios_is_default"
        `);
        await queryRunner.query(`
            ALTER TABLE "portfolios" DROP CONSTRAINT "UQ_portfolios_name"
        `);

        // Rename columns back
        await queryRunner.query(`
            ALTER TABLE "portfolios" RENAME COLUMN "user_id" TO "userId"
        `);
        await queryRunner.query(`
            ALTER TABLE "portfolios" RENAME COLUMN "is_default" TO "isDefault"
        `);

        // Restore original composite unique constraint
        await queryRunner.query(`
            ALTER TABLE "portfolios"
            ADD CONSTRAINT "UQ_portfolios_user_name" UNIQUE ("name", "userId")
        `);

        // Recreate original indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_portfolios_is_default" ON "portfolios" ("userId", "isDefault")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_portfolios_user_id" ON "portfolios" ("userId")
        `);
    }
}
