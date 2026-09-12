import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComment1789230019975 implements MigrationInterface {
  name = 'CreateComment1789230019975';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`comments\` (\`id\` varchar(36) NOT NULL, \`page_id\` varchar(36) NOT NULL, \`author_id\` varchar(36) NOT NULL, \`parent_id\` varchar(36) NULL, \`content\` text NOT NULL, \`edited_at\` datetime NULL, \`deleted_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_comments_page_id\` (\`page_id\`), INDEX \`IDX_comments_parent_id\` (\`parent_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_comments_parent_id\` ON \`comments\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_comments_page_id\` ON \`comments\``,
    );
    await queryRunner.query(`DROP TABLE \`comments\``);
  }
}
