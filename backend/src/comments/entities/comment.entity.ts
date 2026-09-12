import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('comments')
@Index(['pageId'])
@Index(['parentId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'page_id', length: 36 })
  pageId: string;

  @Column({ type: 'uuid', name: 'author_id', length: 36 })
  authorId: string;

  @Column({ type: 'uuid', name: 'parent_id', length: 36, nullable: true })
  parentId: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'datetime', name: 'edited_at', nullable: true })
  editedAt: Date | null;

  @Column({ type: 'datetime', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
