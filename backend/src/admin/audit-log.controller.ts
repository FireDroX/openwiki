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
import { AdminAuditLogQueryDto } from './dto/in/admin-audit-log-query.dto.js';
import { AdminAuditLogListDto } from './dto/out/admin-audit-log-response.dto.js';
import { AdminExceptionFilter } from './filter/admin.exception.filter.js';
import { AdminAuditLogMapper } from './mapper/admin-audit-log.mapper.js';
import { AdminAuditLogService } from './services/admin-audit-log.service.js';

@ApiTags('Admin — Audit log')
@ApiBearerAuth()
@Controller('admin/audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UseFilters(AdminExceptionFilter)
export class AdminAuditLogController {
  constructor(private readonly auditLogService: AdminAuditLogService) {}

  @Get()
  @ApiOperation({ summary: "Journal d'audit des actions admin sensibles" })
  @ApiQuery({ name: 'adminId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ description: 'Journal paginé des actions admin.' })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Rôle admin requis.',
    type: ErrorResponseDto,
  })
  async list(
    @Query() query: AdminAuditLogQueryDto,
  ): Promise<ResponseDto<AdminAuditLogListDto>> {
    const { items, total } = await this.auditLogService.list(query);
    return AdminAuditLogMapper.toListResponse(items, total);
  }
}
