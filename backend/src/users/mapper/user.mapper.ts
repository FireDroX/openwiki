import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { ResponseDto } from '../../common/dto/response.dto.js';
import { User } from '../entities/user.entity.js';
import { UserResponseDto } from '../dto/out/user-response.dto.js';

export interface UserResponseStats {
  commentsCount?: number;
  pagesCreatedCount?: number;
  pageEditsCount?: number;
}

export class UserMapper {
  static toUserResponseDto(
    entity: User,
    stats: UserResponseStats = {},
  ): UserResponseDto {
    return {
      id: entity.id,
      email: entity.email,
      displayName: entity.displayName,
      role: entity.role,
      avatarUrl: entity.avatarUrl,
      createdAt: entity.createdAt,
      ...(stats.commentsCount !== undefined
        ? { commentsCount: stats.commentsCount }
        : {}),
      ...(stats.pagesCreatedCount !== undefined
        ? { pagesCreatedCount: stats.pagesCreatedCount }
        : {}),
      ...(stats.pageEditsCount !== undefined
        ? { pageEditsCount: stats.pageEditsCount }
        : {}),
    };
  }

  static toResponse(
    entity: User,
    stats: UserResponseStats = {},
  ): ResponseDto<UserResponseDto> {
    return new ResponseDto(UserMapper.toUserResponseDto(entity, stats));
  }

  static toPaginatedResponse(
    items: User[],
    total: number,
    page: number,
    limit: number,
  ): ResponseDto<PaginatedResponseDto<UserResponseDto>> {
    return new ResponseDto({
      items: items.map((item) => UserMapper.toUserResponseDto(item)),
      total,
      page,
      limit,
    });
  }
}
