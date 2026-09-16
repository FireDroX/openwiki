import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('oauth_clients')
export class OAuthClient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'client_id', unique: true })
  clientId: string;

  @Column({ type: 'varchar', length: 255, name: 'client_secret_hash' })
  clientSecretHash: string;

  @Column({ type: 'json', name: 'redirect_uris' })
  redirectUris: string[];

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
