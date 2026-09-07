import { Inject, Injectable } from '@nestjs/common';
import { AdminAuditLogService } from '../../admin/services/admin-audit-log.service.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { UserNotFoundException } from '../../common/exceptions/users/user-not-found.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  MAX_LIMIT,
} from '../../common/variables.global.js';
import { CreateUserDto } from '../dto/in/create-user.dto.js';
import { ListUsersQueryDto } from '../dto/in/list-users-query.dto.js';
import { UpdateProfileDto } from '../dto/in/update-profile.dto.js';
import { UpdateRoleDto } from '../dto/in/update-role.dto.js';
import { User, USER_ROLES } from '../entities/user.entity.js';
import type { UserRepository } from '../persistence/user.repository.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UsersRepository') private readonly userRepository: UserRepository,
    private readonly adminAuditLogService: AdminAuditLogService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  create(data: CreateUserDto): Promise<User> {
    return this.userRepository.create(data);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    this.validateUpdateProfile(dto);
    await this.findById(id);
    return this.userRepository.update(id, dto);
  }

  async findAllPaginated(
    query: ListUsersQueryDto,
  ): Promise<PaginatedResponseDto<User>> {
    const page = UsersService.parsePage(query.page);
    const limit = UsersService.parseLimit(query.limit);
    const { items, total } = await this.userRepository.findAllPaginated(
      page,
      limit,
    );
    return { items, total, page, limit };
  }

  async updateRole(
    adminId: string,
    id: string,
    dto: UpdateRoleDto,
  ): Promise<User> {
    this.validateRole(dto.role);
    const previous = await this.findById(id);
    const updated = await this.userRepository.updateRole(id, dto.role);
    await this.adminAuditLogService.record({
      adminId,
      action: 'user.role.update',
      targetType: 'user',
      targetId: id,
      metadata: { previousRole: previous.role, newRole: updated.role },
    });
    return updated;
  }

  async deleteUser(adminId: string, id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.delete(id);
    await this.adminAuditLogService.record({
      adminId,
      action: 'user.delete',
      targetType: 'user',
      targetId: id,
      metadata: { email: user.email },
    });
  }

  incrementFailedLoginAttempts(id: string): Promise<User> {
    return this.userRepository.incrementFailedLoginAttempts(id);
  }

  lockAccount(id: string, lockedUntil: Date): Promise<User> {
    return this.userRepository.lockAccount(id, lockedUntil);
  }

  resetFailedLoginAttempts(id: string): Promise<User> {
    return this.userRepository.resetFailedLoginAttempts(id);
  }

  private validateRole(role: User['role']): void {
    if (!USER_ROLES.includes(role)) {
      throw new ValidationException(
        `role must be one of the following values: ${USER_ROLES.join(', ')}`,
      );
    }
  }

  private static parsePage(raw?: string): number {
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
  }

  private static parseLimit(raw?: string): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return DEFAULT_LIMIT;
    }
    return Math.min(parsed, MAX_LIMIT);
  }

  private validateUpdateProfile(dto: UpdateProfileDto): void {
    const errors: string[] = [];

    if (dto.displayName !== undefined) {
      if (dto.displayName.length < DISPLAY_NAME_MIN_LENGTH) {
        errors.push(
          `displayName must be longer than or equal to ${DISPLAY_NAME_MIN_LENGTH} characters`,
        );
      } else if (dto.displayName.length > DISPLAY_NAME_MAX_LENGTH) {
        errors.push(
          `displayName must be shorter than or equal to ${DISPLAY_NAME_MAX_LENGTH} characters`,
        );
      }
    }

    if (errors.length > 0) {
      throw new ValidationException(errors.join(', '));
    }
  }
}
