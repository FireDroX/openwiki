import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { ResponseDto } from '../common/dto/response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { OAuthClientSummaryDto } from './dto/out/oauth-client-response.dto.js';
import { McpExceptionFilter } from './filter/mcp.exception.filter.js';
import { OAuthClientMapper } from './mapper/oauth-client.mapper.js';
import { OAuthClientsService } from './services/oauth-clients.service.js';

@ApiTags('Admin — OAuth')
@ApiBearerAuth()
@Controller('admin/mcp/oauth-clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UseFilters(McpExceptionFilter)
export class OAuthClientsController {
  constructor(private readonly oauthClientsService: OAuthClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les clients OAuth et leurs tokens actifs' })
  @ApiOkResponse({ description: 'Liste des clients OAuth.' })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Rôle admin requis.',
    type: ErrorResponseDto,
  })
  async list(): Promise<ResponseDto<OAuthClientSummaryDto[]>> {
    const clients = await this.oauthClientsService.listWithActiveTokens();
    return new ResponseDto(
      clients.map(({ client, tokens }) =>
        OAuthClientMapper.toAdminSummary(client, tokens),
      ),
    );
  }

  @Delete(':id/tokens/:tokenId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Révoquer un refresh token OAuth actif' })
  @ApiParam({ name: 'id', description: 'Identifiant du client OAuth' })
  @ApiParam({ name: 'tokenId', description: 'Identifiant du refresh token' })
  @ApiNoContentResponse({ description: 'Token révoqué.' })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Rôle admin requis.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Le token n'existe pas pour ce client.",
    type: ErrorResponseDto,
  })
  async revokeToken(
    @Param('id') id: string,
    @Param('tokenId') tokenId: string,
  ): Promise<void> {
    await this.oauthClientsService.revokeToken(id, tokenId);
  }
}
