import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMigrationTable1743434225674 implements MigrationInterface {
    name = 'AddMigrationTable1743434225674';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "seeds" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "isCompleted" boolean NOT NULL DEFAULT false,
                "executed_at" bigint NOT NULL,
                CONSTRAINT "UQ_9978f4e4f60d7f1fc1af7c7ff9c" UNIQUE ("name"),
                CONSTRAINT "PK_3ac799e4ece18bc838823bb6a4b" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "seeds"
        `);
    }
}
