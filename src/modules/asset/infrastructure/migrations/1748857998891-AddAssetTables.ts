import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetTables1748857998891 implements MigrationInterface {
    name = 'AddAssetTables1748857998891';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "token_prices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" bigint NOT NULL,
                "created_by_id" uuid NOT NULL,
                "updated_at" bigint NOT NULL,
                "updated_by_id" uuid NOT NULL,
                "deleted_at" bigint,
                "deleted_by_id" uuid,
                "token_id" uuid NOT NULL,
                "ref_id" character varying(100) NOT NULL,
                "price_usd" numeric(20, 8) NOT NULL,
                "market_cap" numeric(20, 2),
                "volume_24h" numeric(20, 2),
                "price_change_24h" numeric(10, 4),
                "data_source" character varying(50),
                CONSTRAINT "UQ_4d85a93ccc6da5cc48161e33066" UNIQUE ("ref_id"),
                CONSTRAINT "PK_2c13d30db50cc1d9ec69e21a5f9" PRIMARY KEY ("id", "token_id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_token_prices_token_id" ON "token_prices" ("token_id")`);

        await queryRunner.query(`
            CREATE TABLE "tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" bigint NOT NULL,
                "created_by_id" uuid NOT NULL,
                "updated_at" bigint NOT NULL,
                "updated_by_id" uuid NOT NULL,
                "deleted_at" bigint,
                "deleted_by_id" uuid,
                "symbol" character varying(20) NOT NULL,
                "name" character varying(100) NOT NULL,
                "ref_id" character varying(100) NOT NULL,
                "decimals" integer NOT NULL DEFAULT '18',
                "is_active" boolean NOT NULL DEFAULT true,
                "is_stablecoin" boolean NOT NULL DEFAULT false,
                "stablecoin_peg" character varying(10),
                "logo_url" text,
                CONSTRAINT "UQ_daaf610565c9d7d4474420fc34d" UNIQUE ("symbol"),
                CONSTRAINT "UQ_6b115e6aef2ae443f5657d299c8" UNIQUE ("ref_id"),
                CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_tokens_is_active" ON "tokens" ("is_active")`);
        await queryRunner.query(`CREATE INDEX "IDX_tokens_ref_id" ON "tokens" ("ref_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tokens_symbol" ON "tokens" ("symbol")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_tokens_symbol"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tokens_ref_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tokens_is_active"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_token_prices_token_id"`);
        await queryRunner.query(`DROP TABLE "token_prices"`);
    }
}
