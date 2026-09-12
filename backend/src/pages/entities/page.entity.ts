import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const PAGE_VISIBILITIES = ['public', 'private'] as const;
export type PageVisibility = (typeof PAGE_VISIBILITIES)[number];

@Entity('pages')
@Index(['parentId', 'slug'], { unique: true })
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'uuid', name: 'parent_id', length: 36, nullable: true })
  parentId: string | null;

  @Column({
    type: 'uuid',
    name: 'current_version_id',
    length: 36,
    nullable: true,
  })
  currentVersionId: string | null;

  @Column({ type: 'boolean', name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ type: 'boolean', name: 'comments_enabled', default: true })
  commentsEnabled: boolean;

  @Column({ type: 'enum', enum: PAGE_VISIBILITIES, default: 'private' })
  visibility: PageVisibility;

  @Column({ type: 'uuid', name: 'created_by_id', length: 36 })
  createdById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
