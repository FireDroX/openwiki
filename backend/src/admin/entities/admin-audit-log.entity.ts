import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('admin_audit_logs')
@Index(['adminId'])
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'admin_id', length: 36 })
  adminId: string;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Column({ type: 'varchar', length: 255, name: 'target_type' })
  targetType: string;

  @Column({ type: 'varchar', length: 255, name: 'target_id', nullable: true })
  targetId: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: unknown;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
