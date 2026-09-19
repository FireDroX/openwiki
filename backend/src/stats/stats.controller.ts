import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { ResponseDto } from '../common/dto/response.dto.js';
import {
  POPULAR_PAGES_DEFAULT_LIMIT,
  POPULAR_PAGES_MAX_LIMIT,
} from '../common/variables.global.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/strategies/jwt.strategy.js';
import { FollowedPageDto } from './dto/out/followed-page.dto.js';
import { PopularPageDto } from './dto/out/popular-page.dto.js';
import { PublicStatsResponseDto } from './dto/out/public-stats-response.dto.js';
import { StatsResponseDto } from './dto/out/stats-response.dto.js';
import { StatsExceptionFilter } from './filter/stats-exception.filter.js';
import { StatsMapper } from './mapper/stats.mapper.js';
import { StatsService } from './services/stats.service.js';

@ApiTags('Stats')
@Controller('stats')
@UseFilters(StatsExceptionFilter)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('public')
  @ApiOperation({
    summary:
      'KPI publics du wiki pour un visiteur non connecté (pages, commentaires)',
  })
  @ApiOkResponse({ description: 'Compteurs publics.' })
  async getPublicStats(): Promise<ResponseDto<PublicStatsResponseDto>> {
    const stats = await this.statsService.getPublicStats();
    return StatsMapper.toPublicResponse(stats);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'KPI globaux du wiki (pages, commentaires, utilisateurs, médias)',
  })
  @ApiOkResponse({ description: 'Compteurs globaux.' })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  async getStats(): Promise<ResponseDto<StatsResponseDto>> {
    const stats = await this.statsService.getStats();
    return StatsMapper.toResponse(stats);
  }

  @Get('popular-pages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Pages les plus consultées' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: `Nombre de pages à renvoyer, défaut ${POPULAR_PAGES_DEFAULT_LIMIT}, max ${POPULAR_PAGES_MAX_LIMIT}.`,
  })
  @ApiOkResponse({
    description: 'Pages triées par nombre de vues décroissant.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  async getPopularPages(
    @Query('limit') limit?: string,
  ): Promise<ResponseDto<PopularPageDto[]>> {
    const pages = await this.statsService.getPopularPages(
      StatsController.parseLimit(limit),
    );
    return StatsMapper.toPopularPagesResponse(pages);
  }

  @Get('followed-pages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Pages suivies par l'utilisateur courant" })
  @ApiOkResponse({
    description: 'Pages suivies, triées par activité la plus récente.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  async getFollowedPages(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResponseDto<FollowedPageDto[]>> {
    const pages = await this.statsService.getFollowedPages(user);
    return StatsMapper.toFollowedPagesResponse(pages);
  }

  private static parseLimit(raw?: string): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return POPULAR_PAGES_DEFAULT_LIMIT;
    }
    return Math.min(parsed, POPULAR_PAGES_MAX_LIMIT);
  }
}
