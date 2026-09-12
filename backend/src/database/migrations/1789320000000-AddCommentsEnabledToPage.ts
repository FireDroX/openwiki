import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentsEnabledToPage1789320000000 implements MigrationInterface {
  name = 'AddCommentsEnabledToPage1789320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`pages\` ADD \`comments_enabled\` tinyint NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`pages\` DROP COLUMN \`comments_enabled\``,
    );
  }
}
