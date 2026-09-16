import { OAuthClient } from '../entities/oauth-client.entity.js';
import { OAuthRefreshToken } from '../entities/oauth-refresh-token.entity.js';
import {
  OAuthClientRegisteredResponseDto,
  OAuthClientSummaryDto,
} from '../dto/out/oauth-client-response.dto.js';

export class OAuthClientMapper {
  static toRegisteredResponse(
    entity: OAuthClient,
    plainSecret: string,
  ): OAuthClientRegisteredResponseDto {
    return {
      client_id: entity.clientId,
      client_secret: plainSecret,
      client_id_issued_at: Math.floor(entity.createdAt.getTime() / 1000),
      redirect_uris: entity.redirectUris,
      client_name: entity.name,
    };
  }

  static toAdminSummary(
    entity: OAuthClient,
    activeTokens: Array<{
      token: OAuthRefreshToken;
      user: { displayName: string; email: string };
    }>,
  ): OAuthClientSummaryDto {
    return {
      id: entity.id,
      clientId: entity.clientId,
      name: entity.name,
      createdAt: entity.createdAt,
      activeTokens: activeTokens.map(({ token, user }) => ({
        id: token.id,
        userId: token.userId,
        userDisplayName: user.displayName,
        userEmail: user.email,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
      })),
    };
  }
}
