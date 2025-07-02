import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPortfolioHoldingTable1750844918615 implements MigrationInterface {
    name = 'AddPortfolioHoldingTable1750844918615';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "portfolio_holdings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by_id" uuid NOT NULL,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_by_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP,
                "deleted_by_id" uuid,
                "portfolio_id" uuid NOT NULL,
                "ref_id" character varying(20) NOT NULL,
                "token_symbol" character varying(20) NOT NULL,
                "token_name" character varying(100),
                "token_decimals" integer NOT NULL DEFAULT '18',
                "token_logo_url" text,
                "is_stablecoin" boolean NOT NULL DEFAULT false,
                "stablecoin_peg" character varying(10),
                CONSTRAINT "UQ_portfolio_holdings_portfolio_token" UNIQUE ("portfolio_id", "token_symbol"),
                CONSTRAINT "PK_791e8293470395842404d51142f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_portfolio_holdings_deleted_at" ON "portfolio_holdings" ("deleted_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_portfolio_holdings_token_symbol" ON "portfolio_holdings" ("token_symbol")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_portfolio_holdings_portfolio_id" ON "portfolio_holdings" ("portfolio_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_portfolio_holdings_portfolio_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_portfolio_holdings_token_symbol"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_portfolio_holdings_deleted_at"
        `);
        await queryRunner.query(`
            DROP TABLE "portfolio_holdings"
        `);
    }
}
