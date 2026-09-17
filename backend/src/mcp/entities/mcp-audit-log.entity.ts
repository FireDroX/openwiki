import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('mcp_audit_logs')
@Index(['apiKeyId'])
export class McpAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'api_key_id', length: 64 })
  apiKeyId: string;

  @Column({ type: 'varchar', length: 255, name: 'tool_name' })
  toolName: string;

  @Column({ type: 'json' })
  input: unknown;

  @Column({ type: 'json', nullable: true })
  output: unknown;

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({
    type: 'varchar',
    length: 1000,
    name: 'error_message',
    nullable: true,
  })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
