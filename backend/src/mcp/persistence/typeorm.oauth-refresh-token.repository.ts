import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { OAuthRefreshToken } from '../entities/oauth-refresh-token.entity.js';
import {
  CreateOAuthRefreshTokenInput,
  OAuthRefreshTokenRepository,
} from './oauth-refresh-token.repository.js';

@Injectable()
export class TypeormOAuthRefreshTokenRepository implements OAuthRefreshTokenRepository {
  constructor(
    @InjectRepository(OAuthRefreshToken)
    private readonly repository: Repository<OAuthRefreshToken>,
  ) {}

  async create(data: CreateOAuthRefreshTokenInput): Promise<OAuthRefreshToken> {
    return this.repository.save(this.repository.create(data));
  }

  findByTokenHash(tokenHash: string): Promise<OAuthRefreshToken | null> {
    return this.repository.findOneBy({ tokenHash });
  }

  findById(id: string): Promise<OAuthRefreshToken | null> {
    return this.repository.findOneBy({ id });
  }

  findActiveByClientId(clientId: string): Promise<OAuthRefreshToken[]> {
    return this.repository.find({
      where: { clientId, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { revokedAt: new Date() });
  }
}
