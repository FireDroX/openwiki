import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { ResponseDto } from '../common/dto/response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { StatsResponseDto } from './dto/out/stats-response.dto.js';
import { StatsExceptionFilter } from './filter/stats-exception.filter.js';
import { StatsMapper } from './mapper/stats.mapper.js';
import { StatsService } from './services/stats.service.js';

@ApiTags('Stats')
@ApiBearerAuth()
@Controller('stats')
@UseGuards(JwtAuthGuard)
@UseFilters(StatsExceptionFilter)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
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
}
