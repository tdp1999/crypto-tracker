import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTestTable1741703756577 implements MigrationInterface {
    name = 'AddTestTable1741703756577';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "test_entity" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_cc0413536e3afc0e586996bea40" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "test_entity"
        `);
    }
}
