import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewCountToPage1789500000000 implements MigrationInterface {
  name = 'AddViewCountToPage1789500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`pages\` ADD \`view_count\` int NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`pages\` DROP COLUMN \`view_count\``);
  }
}
