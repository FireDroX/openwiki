import { ResponseDto } from '../../common/dto/response.dto.js';
import {
  UserActivityLogItemDto,
  UserActivityLogListDto,
} from '../dto/out/user-activity-log-response.dto.js';
import { UserActivityLogRow } from '../persistence/user-activity-log.repository.js';

export class UserActivityLogMapper {
  static toListResponse(
    items: UserActivityLogRow[],
    total: number,
  ): ResponseDto<UserActivityLogListDto> {
    return new ResponseDto({
      items: items.map((item) => UserActivityLogMapper.toItem(item)),
      total,
    });
  }

  private static toItem(row: UserActivityLogRow): UserActivityLogItemDto {
    return {
      id: row.id,
      userId: row.userId,
      userDisplayName: row.userDisplayName,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: row.metadata,
      createdAt: row.createdAt,
    };
  }
}
