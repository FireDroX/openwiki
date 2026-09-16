import { OAuthRefreshToken } from '../entities/oauth-refresh-token.entity.js';

export interface CreateOAuthRefreshTokenInput {
  tokenHash: string;
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: Date;
}

export interface OAuthRefreshTokenRepository {
  create(data: CreateOAuthRefreshTokenInput): Promise<OAuthRefreshToken>;
  findByTokenHash(tokenHash: string): Promise<OAuthRefreshToken | null>;
  findById(id: string): Promise<OAuthRefreshToken | null>;
  findActiveByClientId(clientId: string): Promise<OAuthRefreshToken[]>;
  revoke(id: string): Promise<void>;
}
