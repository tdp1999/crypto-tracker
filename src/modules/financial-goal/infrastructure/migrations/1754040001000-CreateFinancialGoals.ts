import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFinancialGoals1754040001000 implements MigrationInterface {
    name = 'CreateFinancialGoals1754040001000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "financial_goals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "created_by_id" uuid NOT NULL,
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_by_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP,
                "deleted_by_id" uuid,
                "user_id" uuid NOT NULL,
                "name" varchar(255) NOT NULL,
                "target_date" date NOT NULL,
                "is_active" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_financial_goals_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_financial_goals_user_id" ON "financial_goals" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_financial_goals_active" ON "financial_goals" ("user_id", "is_active")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_financial_goals_active"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_financial_goals_user_id"
        `);
        await queryRunner.query(`
            DROP TABLE "financial_goals"
        `);
    }
}
