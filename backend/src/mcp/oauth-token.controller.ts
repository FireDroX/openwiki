import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AdminAuditLogService } from '../admin/services/admin-audit-log.service.js';
import { OAuthInvalidRequestException } from '../common/exceptions/mcp/oauth-invalid-request.exception.js';
import { OAuthUnsupportedGrantTypeException } from '../common/exceptions/mcp/oauth-unsupported-grant-type.exception.js';
import {
  OAuthRevokeRequestDto,
  OAuthTokenRequestDto,
} from './dto/in/oauth-token-request.dto.js';
import { OAuthTokenResponseDto } from './dto/out/oauth-token-response.dto.js';
import { OAuthExceptionFilter } from './filter/oauth.exception.filter.js';
import { OAuthClientsService } from './services/oauth-clients.service.js';
import {
  OAuthFlowService,
  OAuthTokenPair,
} from './services/oauth-flow.service.js';

@ApiExcludeController()
@Controller('oauth')
@UseFilters(OAuthExceptionFilter)
export class OAuthTokenController {
  constructor(
    private readonly oauthClientsService: OAuthClientsService,
    private readonly oauthFlowService: OAuthFlowService,
    private readonly adminAuditLogService: AdminAuditLogService,
  ) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async token(
    @Body() dto: OAuthTokenRequestDto,
  ): Promise<OAuthTokenResponseDto> {
    const client = await this.oauthClientsService.getByClientId(dto.client_id);
    this.oauthClientsService.verifySecret(client, dto.client_secret);

    let pair: OAuthTokenPair;
    switch (dto.grant_type) {
      case 'authorization_code': {
        if (!dto.code || !dto.redirect_uri || !dto.code_verifier) {
          throw new OAuthInvalidRequestException(
            'code, redirect_uri and code_verifier are required',
          );
        }
        pair = await this.oauthFlowService.exchangeAuthorizationCode({
          code: dto.code,
          codeVerifier: dto.code_verifier,
          client,
          redirectUri: dto.redirect_uri,
        });
        break;
      }
      case 'refresh_token': {
        if (!dto.refresh_token) {
          throw new OAuthInvalidRequestException('refresh_token is required');
        }
        pair = await this.oauthFlowService.refresh({
          client,
          refreshToken: dto.refresh_token,
        });
        break;
      }
      default:
        throw new OAuthUnsupportedGrantTypeException();
    }

    return {
      access_token: pair.accessToken,
      token_type: 'Bearer',
      expires_in: pair.expiresIn,
      refresh_token: pair.refreshToken,
      scope: pair.scopes.join(' '),
    };
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Body() dto: OAuthRevokeRequestDto,
  ): Promise<Record<string, never>> {
    const client = await this.oauthClientsService.getByClientId(dto.client_id);
    this.oauthClientsService.verifySecret(client, dto.client_secret);

    const revoked = await this.oauthFlowService.revoke(dto.token);
    if (revoked) {
      await this.adminAuditLogService.record({
        adminId: revoked.userId,
        action: 'mcp.oauth_revoked',
        targetType: 'oauth_client',
        targetId: client.id,
      });
    }

    return {};
  }
}
