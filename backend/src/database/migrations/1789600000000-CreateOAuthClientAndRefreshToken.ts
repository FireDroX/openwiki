import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOAuthClientAndRefreshToken1789600000000 implements MigrationInterface {
  name = 'CreateOAuthClientAndRefreshToken1789600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`oauth_clients\` (\`id\` varchar(36) NOT NULL, \`client_id\` varchar(255) NOT NULL, \`client_secret_hash\` varchar(255) NOT NULL, \`redirect_uris\` json NOT NULL, \`name\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_oauth_clients_client_id\` (\`client_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`oauth_refresh_tokens\` (\`id\` varchar(36) NOT NULL, \`token_hash\` varchar(255) NOT NULL, \`client_id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`scopes\` json NOT NULL, \`expires_at\` datetime NOT NULL, \`revoked_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_oauth_refresh_tokens_token_hash\` (\`token_hash\`), INDEX \`IDX_oauth_refresh_tokens_client_id\` (\`client_id\`), INDEX \`IDX_oauth_refresh_tokens_user_id\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`oauth_refresh_tokens\` ADD CONSTRAINT \`FK_oauth_refresh_tokens_client_id\` FOREIGN KEY (\`client_id\`) REFERENCES \`oauth_clients\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`oauth_refresh_tokens\` ADD CONSTRAINT \`FK_oauth_refresh_tokens_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`oauth_refresh_tokens\` DROP FOREIGN KEY \`FK_oauth_refresh_tokens_user_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`oauth_refresh_tokens\` DROP FOREIGN KEY \`FK_oauth_refresh_tokens_client_id\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_oauth_refresh_tokens_user_id\` ON \`oauth_refresh_tokens\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_oauth_refresh_tokens_client_id\` ON \`oauth_refresh_tokens\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_oauth_refresh_tokens_token_hash\` ON \`oauth_refresh_tokens\``,
    );
    await queryRunner.query(`DROP TABLE \`oauth_refresh_tokens\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_oauth_clients_client_id\` ON \`oauth_clients\``,
    );
    await queryRunner.query(`DROP TABLE \`oauth_clients\``);
  }
}
