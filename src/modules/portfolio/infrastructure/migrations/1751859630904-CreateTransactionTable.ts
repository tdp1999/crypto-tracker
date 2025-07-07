import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionTable1751859630904 implements MigrationInterface {
    name = 'CreateTransactionTable1751859630904';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create transaction type enum
        await queryRunner.query(`
            CREATE TYPE "public"."transactions_type_enum" AS ENUM(
                'BUY',
                'SELL',
                'DEPOSIT',
                'WITHDRAWAL',
                'SWAP'
            )
        `);

        // Create transactions table
        await queryRunner.query(`
            CREATE TABLE "transactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by_id" uuid NOT NULL,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_by_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP,
                "deleted_by_id" uuid,
                "portfolio_id" uuid NOT NULL,
                "ref_id" character varying(20) NOT NULL,
                "amount" numeric(36, 18) NOT NULL,
                "price" numeric(36, 18) NOT NULL,
                "type" "public"."transactions_type_enum" NOT NULL,
                "cash_flow" numeric(36, 18),
                "fees" numeric(36, 18) NOT NULL DEFAULT '0',
                "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
                "external_id" uuid,
                "notes" text,
                "token_symbol" character varying(20) NOT NULL,
                "token_name" character varying(100) NOT NULL,
                "token_decimals" integer NOT NULL DEFAULT '18',
                "token_logo_url" text,
                CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
            )
        `);

        // Create performance indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_portfolio_timestamp" ON "transactions" ("portfolio_id", "timestamp")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_portfolio_token" ON "transactions" ("portfolio_id", "token_symbol")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_deleted_at" ON "transactions" ("deleted_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_external_id" ON "transactions" ("external_id")
        `);

        // Update portfolio_holdings table to make token_name required
        await queryRunner.query(`
            ALTER TABLE "portfolio_holdings"
            ALTER COLUMN "token_name" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert portfolio_holdings table changes
        await queryRunner.query(`
            ALTER TABLE "portfolio_holdings"
            ALTER COLUMN "token_name" DROP NOT NULL
        `);

        // Drop indexes
        await queryRunner.query(`
            DROP INDEX "public"."IDX_transactions_external_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_transactions_deleted_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_transactions_portfolio_token"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_transactions_portfolio_timestamp"
        `);

        // Drop transactions table (foreign keys will be dropped automatically)
        await queryRunner.query(`
            DROP TABLE "transactions"
        `);

        // Drop enum type
        await queryRunner.query(`
            DROP TYPE "public"."transactions_type_enum"
        `);
    }
}
