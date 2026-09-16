import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/strategies/jwt.strategy.js';
import {
  ACCESS_TOKEN_COOKIE,
  OAUTH_PKCE_CODE_CHALLENGE_METHOD,
} from '../common/variables.global.js';
import type { UserRole } from '../users/entities/user.entity.js';
import { OAuthAuthorizeDecisionDto } from './dto/in/oauth-authorize-decision.dto.js';
import { OAuthAuthorizeDecisionResponseDto } from './dto/out/oauth-authorize-decision-response.dto.js';
import { OAuthAccessDeniedException } from '../common/exceptions/mcp/oauth-access-denied.exception.js';
import { OAuthInvalidRequestException } from '../common/exceptions/mcp/oauth-invalid-request.exception.js';
import { McpExceptionFilter } from './filter/mcp.exception.filter.js';
import { OAuthExceptionFilter } from './filter/oauth.exception.filter.js';
import { OAuthClientsService } from './services/oauth-clients.service.js';
import { OAuthFlowService } from './services/oauth-flow.service.js';
import { AdminAuditLogService } from '../admin/services/admin-audit-log.service.js';

interface AuthorizeQuery {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  code_challenge: string;
  code_challenge_method: string;
  state?: string;
}

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthAuthorizeController {
  constructor(
    private readonly oauthClientsService: OAuthClientsService,
    private readonly oauthFlowService: OAuthFlowService,
    private readonly adminAuditLogService: AdminAuditLogService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('authorize')
  @ApiExcludeEndpoint()
  @UseFilters(OAuthExceptionFilter)
  async authorize(
    @Query() query: AuthorizeQuery,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const client = await this.oauthClientsService.getByClientId(
      query.client_id,
    );

    if (!client.redirectUris.includes(query.redirect_uri)) {
      throw new OAuthInvalidRequestException('Unregistered redirect_uri');
    }
    if (query.response_type !== 'code') {
      res.redirect(
        OAuthAuthorizeController.buildErrorRedirect(
          query.redirect_uri,
          'unsupported_response_type',
          query.state,
        ),
      );
      return;
    }
    if (query.code_challenge_method !== OAUTH_PKCE_CODE_CHALLENGE_METHOD) {
      res.redirect(
        OAuthAuthorizeController.buildErrorRedirect(
          query.redirect_uri,
          'invalid_request',
          query.state,
        ),
      );
      return;
    }
    if (!query.code_challenge) {
      res.redirect(
        OAuthAuthorizeController.buildErrorRedirect(
          query.redirect_uri,
          'invalid_request',
          query.state,
        ),
      );
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const consentParams = new URLSearchParams({
      client_id: query.client_id,
      client_name: client.name,
      redirect_uri: query.redirect_uri,
      code_challenge: query.code_challenge,
      code_challenge_method: query.code_challenge_method,
    });
    if (query.state) {
      consentParams.set('state', query.state);
    }
    const consentUrl = `${frontendUrl}/oauth/consent?${consentParams.toString()}`;

    const sessionUser = this.getSessionUser(req);
    if (!sessionUser) {
      const loginUrl = `${frontendUrl}/login?redirect=${encodeURIComponent(consentUrl)}`;
      res.redirect(loginUrl);
      return;
    }

    res.redirect(consentUrl);
  }

  @Post('authorize/decision')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseFilters(McpExceptionFilter)
  @ApiOperation({ summary: "Autoriser ou refuser une demande d'accès OAuth" })
  async decide(
    @Body() dto: OAuthAuthorizeDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OAuthAuthorizeDecisionResponseDto> {
    const client = await this.oauthClientsService.getByClientId(dto.clientId);
    if (!client.redirectUris.includes(dto.redirectUri)) {
      throw new OAuthInvalidRequestException('Unregistered redirect_uri');
    }

    if (dto.decision === 'deny') {
      await this.adminAuditLogService.record({
        adminId: user.id,
        action: 'mcp.oauth_denied',
        targetType: 'oauth_client',
        targetId: client.id,
      });
      return {
        redirectUrl: OAuthAuthorizeController.buildErrorRedirect(
          dto.redirectUri,
          'access_denied',
          dto.state,
        ),
      };
    }

    if (user.role !== 'admin') {
      await this.adminAuditLogService.record({
        adminId: user.id,
        action: 'mcp.oauth_denied',
        targetType: 'oauth_client',
        targetId: client.id,
        metadata: { reason: 'not_admin' },
      });
      throw new OAuthAccessDeniedException();
    }

    if (dto.codeChallengeMethod !== OAUTH_PKCE_CODE_CHALLENGE_METHOD) {
      throw new OAuthInvalidRequestException(
        `code_challenge_method must be ${OAUTH_PKCE_CODE_CHALLENGE_METHOD}`,
      );
    }

    const code = this.oauthFlowService.createAuthorizationCode({
      clientDbId: client.id,
      userId: user.id,
      redirectUri: dto.redirectUri,
      codeChallenge: dto.codeChallenge,
    });

    await this.adminAuditLogService.record({
      adminId: user.id,
      action: 'mcp.oauth_authorized',
      targetType: 'oauth_client',
      targetId: client.id,
    });

    const redirectParams = new URLSearchParams({ code });
    if (dto.state) {
      redirectParams.set('state', dto.state);
    }
    return {
      redirectUrl: `${dto.redirectUri}?${redirectParams.toString()}`,
    };
  }

  private getSessionUser(req: Request): AuthenticatedUser | null {
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
    if (!token) {
      return null;
    }
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        role: UserRole;
      }>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      return null;
    }
  }

  private static buildErrorRedirect(
    redirectUri: string,
    error: string,
    state?: string,
  ): string {
    const params = new URLSearchParams({ error });
    if (state) {
      params.set('state', state);
    }
    return `${redirectUri}?${params.toString()}`;
  }
}
