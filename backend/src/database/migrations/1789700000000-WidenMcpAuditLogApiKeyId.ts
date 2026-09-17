import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenMcpAuditLogApiKeyId1789700000000 implements MigrationInterface {
  name = 'WidenMcpAuditLogApiKeyId1789700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`mcp_audit_logs\` MODIFY COLUMN \`api_key_id\` varchar(64) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`mcp_audit_logs\` MODIFY COLUMN \`api_key_id\` varchar(36) NOT NULL`,
    );
  }
}
