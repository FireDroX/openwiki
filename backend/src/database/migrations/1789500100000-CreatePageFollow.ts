import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePageFollow1789500100000 implements MigrationInterface {
  name = 'CreatePageFollow1789500100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`page_follows\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`page_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_page_follows_user_id_page_id\` (\`user_id\`, \`page_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_page_follows_user_id_page_id\` ON \`page_follows\``,
    );
    await queryRunner.query(`DROP TABLE \`page_follows\``);
  }
}
