import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentsToTransfers1766086902295 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`transfers\`
                ADD COLUMN \`notes\` varchar(255) NOT NULL DEFAULT '';
        `);

        await queryRunner.query(`
            ALTER TABLE \`expense_resources\`
                ADD COLUMN \`notes\` varchar(255) NOT NULL DEFAULT '';
        `);

        await queryRunner.query(`
            ALTER TABLE \`expense_resources\`
                ADD COLUMN \`date\` datetime DEFAULT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
