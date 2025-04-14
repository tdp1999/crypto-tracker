import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewField1744618839265 implements MigrationInterface {
    name = 'AddNewField1744618839265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "isManualRegistration" boolean NOT NULL DEFAULT false
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "isManualRegistration"
        `);
    }

}
