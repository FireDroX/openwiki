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
import { UserActivityLogQueryDto } from './dto/in/user-activity-log-query.dto.js';
import { UserActivityLogListDto } from './dto/out/user-activity-log-response.dto.js';
import { ActivityExceptionFilter } from './filter/activity.exception.filter.js';
import { UserActivityLogMapper } from './mapper/user-activity-log.mapper.js';
import { UserActivityLogService } from './services/user-activity-log.service.js';

@ApiTags('Admin — Activity log')
@ApiBearerAuth()
@Controller('admin/activity-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UseFilters(ActivityExceptionFilter)
export class ActivityLogController {
  constructor(private readonly activityLogService: UserActivityLogService) {}

  @Get()
  @ApiOperation({ summary: "Journal d'activité des utilisateurs" })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ description: "Journal paginé de l'activité utilisateur." })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Rôle admin requis.',
    type: ErrorResponseDto,
  })
  async list(
    @Query() query: UserActivityLogQueryDto,
  ): Promise<ResponseDto<UserActivityLogListDto>> {
    const { items, total } = await this.activityLogService.list(query);
    return UserActivityLogMapper.toListResponse(items, total);
  }
}
