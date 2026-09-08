import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user_activity_logs')
@Index(['userId'])
export class UserActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', length: 36 })
  userId: string;

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
