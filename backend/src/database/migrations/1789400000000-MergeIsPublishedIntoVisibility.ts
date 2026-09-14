import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergeIsPublishedIntoVisibility1789400000000 implements MigrationInterface {
  name = 'MergeIsPublishedIntoVisibility1789400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `pages` SET `visibility` = 'private' WHERE `visibility` = 'public' AND `is_published` = 0",
    );
    await queryRunner.query(
      `ALTER TABLE \`pages\` DROP COLUMN \`is_published\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`pages\` ADD \`is_published\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      "UPDATE `pages` SET `is_published` = 1 WHERE `visibility` = 'public'",
    );
  }
}
