import { ResponseDto } from '../../common/dto/response.dto.js';
import {
  AdminAuditLogItemDto,
  AdminAuditLogListDto,
} from '../dto/out/admin-audit-log-response.dto.js';
import { AdminAuditLogRow } from '../persistence/admin-audit-log.repository.js';

export class AdminAuditLogMapper {
  static toListResponse(
    items: AdminAuditLogRow[],
    total: number,
  ): ResponseDto<AdminAuditLogListDto> {
    return new ResponseDto({
      items: items.map((item) => AdminAuditLogMapper.toItem(item)),
      total,
    });
  }

  private static toItem(row: AdminAuditLogRow): AdminAuditLogItemDto {
    return {
      id: row.id,
      adminId: row.adminId,
      adminDisplayName: row.adminDisplayName,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: row.metadata,
      createdAt: row.createdAt,
    };
  }
}
