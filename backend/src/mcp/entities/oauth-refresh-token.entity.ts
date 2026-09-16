import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('oauth_refresh_tokens')
@Index(['clientId'])
@Index(['userId'])
export class OAuthRefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'token_hash', unique: true })
  tokenHash: string;

  @Column({ type: 'uuid', name: 'client_id', length: 36 })
  clientId: string;

  @Column({ type: 'uuid', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'json' })
  scopes: string[];

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'datetime', name: 'revoked_at', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
