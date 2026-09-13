import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AdminAuditLogService } from '../../admin/services/admin-audit-log.service.js';
import { UserNotFoundException } from '../../common/exceptions/users/user-not-found.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import { UpdateProfileDto } from '../dto/in/update-profile.dto.js';
import { User } from '../entities/user.entity.js';
import type { UserRepository } from '../persistence/user.repository.js';
import { UsersService } from './users.service.js';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    displayName: 'User One',
    avatarUrl: null,
    role: 'reader',
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: { [K in keyof UserRepository]: Mock<UserRepository[K]> };
  let adminAuditLogService: { record: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findAllPaginated: vi.fn(),
      updateRole: vi.fn(),
      delete: vi.fn(),
      incrementFailedLoginAttempts: vi.fn(),
      lockAccount: vi.fn(),
      resetFailedLoginAttempts: vi.fn(),
    };
    adminAuditLogService = { record: vi.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'UsersRepository', useValue: userRepository },
        { provide: AdminAuditLogService, useValue: adminAuditLogService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findById', () => {
    it('returns the user when it exists', async () => {
      const user = buildUser();
      userRepository.findById.mockResolvedValue(user);

      await expect(service.findById('user-1')).resolves.toEqual(user);
    });

    it('throws UserNotFoundException when the user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates displayName and returns the updated user', async () => {
      const user = buildUser();
      const updated = buildUser({ displayName: 'New Name' });
      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(updated);

      const dto: UpdateProfileDto = { displayName: 'New Name' };
      const result = await service.updateProfile('user-1', dto);

      expect(userRepository.update).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(updated);
    });

    it('throws ValidationException when displayName is empty', async () => {
      userRepository.findById.mockResolvedValue(buildUser());

      await expect(
        service.updateProfile('user-1', { displayName: '' }),
      ).rejects.toBeInstanceOf(ValidationException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('throws ValidationException when displayName is too long', async () => {
      userRepository.findById.mockResolvedValue(buildUser());

      await expect(
        service.updateProfile('user-1', { displayName: 'a'.repeat(101) }),
      ).rejects.toBeInstanceOf(ValidationException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
});
