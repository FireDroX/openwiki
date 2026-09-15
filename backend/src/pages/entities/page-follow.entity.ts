import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('page_follows')
@Index(['userId', 'pageId'], { unique: true })
export class PageFollow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'uuid', name: 'page_id', length: 36 })
  pageId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
