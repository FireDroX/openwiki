import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { ResponseDto } from '../common/dto/response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AuditLogQueryDto } from './dto/in/audit-log-query.dto.js';
import { AuditLogListDto } from './dto/out/audit-log-response.dto.js';
import { McpExceptionFilter } from './filter/mcp.exception.filter.js';
import { AuditLogMapper } from './mapper/audit-log.mapper.js';
import { McpAuditService } from './services/mcp-audit.service.js';

@ApiTags('Admin — MCP')
@ApiBearerAuth()
@Controller('admin/mcp/audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UseFilters(McpExceptionFilter)
export class McpAuditLogController {
  constructor(private readonly auditService: McpAuditService) {}

  @Get()
  @ApiOperation({ summary: "Journal d'audit des actions MCP" })
  @ApiQuery({ name: 'apiKeyId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ description: "Journal paginé des appels d'outils MCP." })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Rôle admin requis.',
    type: ErrorResponseDto,
  })
  async list(
    @Query() query: AuditLogQueryDto,
  ): Promise<ResponseDto<AuditLogListDto>> {
    const { items, total } = await this.auditService.list(query);
    return AuditLogMapper.toListResponse(items, total);
  }
}
