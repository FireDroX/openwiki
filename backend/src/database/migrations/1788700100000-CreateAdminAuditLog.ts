import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminAuditLog1788700100000 implements MigrationInterface {
  name = 'CreateAdminAuditLog1788700100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`admin_audit_logs\` (\`id\` varchar(36) NOT NULL, \`admin_id\` varchar(36) NOT NULL, \`action\` varchar(255) NOT NULL, \`target_type\` varchar(255) NOT NULL, \`target_id\` varchar(255) NULL, \`metadata\` json NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_admin_audit_logs_admin_id\` (\`admin_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_admin_audit_logs_admin_id\` ON \`admin_audit_logs\``,
    );
    await queryRunner.query(`DROP TABLE \`admin_audit_logs\``);
  }
}
