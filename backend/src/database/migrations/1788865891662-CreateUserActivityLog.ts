import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserActivityLog1788865891662 implements MigrationInterface {
  name = 'CreateUserActivityLog1788865891662';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user_activity_logs\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`action\` varchar(255) NOT NULL, \`target_type\` varchar(255) NOT NULL, \`target_id\` varchar(255) NULL, \`metadata\` json NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_user_activity_logs_user_id\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_user_activity_logs_user_id\` ON \`user_activity_logs\``,
    );
    await queryRunner.query(`DROP TABLE \`user_activity_logs\``);
  }
}
