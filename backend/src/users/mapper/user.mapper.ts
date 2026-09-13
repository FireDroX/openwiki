import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { ResponseDto } from '../../common/dto/response.dto.js';
import { User } from '../entities/user.entity.js';
import { UserResponseDto } from '../dto/out/user-response.dto.js';

export class UserMapper {
  static toUserResponseDto(
    entity: User,
    commentsCount?: number,
  ): UserResponseDto {
    return {
      id: entity.id,
      email: entity.email,
      displayName: entity.displayName,
      role: entity.role,
      avatarUrl: entity.avatarUrl,
      createdAt: entity.createdAt,
      ...(commentsCount !== undefined ? { commentsCount } : {}),
    };
  }

  static toResponse(
    entity: User,
    commentsCount?: number,
  ): ResponseDto<UserResponseDto> {
    return new ResponseDto(UserMapper.toUserResponseDto(entity, commentsCount));
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
