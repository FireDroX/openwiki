import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { VersionNotFoundException } from '../../common/exceptions/pages/version-not-found.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import { PageVersion } from '../../pages/entities/page-version.entity.js';
import type { VersionsRepository } from '../persistence/version.repository.js';
import { VersionsService } from './versions.service.js';

function buildVersion(overrides: Partial<PageVersion> = {}): PageVersion {
  return {
    id: 'version-1',
    pageId: 'page-1',
    content: 'content',
    title: 'Title',
    authorId: 'user-1',
    changeSummary: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('VersionsService', () => {
  let service: VersionsService;
  let versionsRepository: {
    [K in keyof VersionsRepository]: Mock<VersionsRepository[K]>;
  };

  beforeEach(async () => {
    versionsRepository = {
      create: vi.fn(),
      findAllByPageId: vi.fn(),
      findByIdAndPageId: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        VersionsService,
        { provide: 'VersionsRepository', useValue: versionsRepository },
      ],
    }).compile();

    service = module.get(VersionsService);
  });

  describe('findOne', () => {
    it('returns the version when found', async () => {
      const version = buildVersion();
      versionsRepository.findByIdAndPageId.mockResolvedValue(version);

      await expect(service.findOne('page-1', 'version-1')).resolves.toBe(
        version,
      );
    });

    it('throws VersionNotFoundException when not found', async () => {
      versionsRepository.findByIdAndPageId.mockResolvedValue(null);

      await expect(service.findOne('page-1', 'missing')).rejects.toBeInstanceOf(
        VersionNotFoundException,
      );
    });
  });

  describe('computeDiff', () => {
    const fromId = '11111111-1111-1111-1111-111111111111';
    const toId = '22222222-2222-2222-2222-222222222222';

    it('computes added/removed/unchanged lines between two versions', async () => {
      versionsRepository.findByIdAndPageId.mockImplementation((id: string) => {
        if (id === fromId) {
          return Promise.resolve(
            buildVersion({ id: fromId, content: 'a\nb\n' }),
          );
        }
        if (id === toId) {
          return Promise.resolve(buildVersion({ id: toId, content: 'a\nc\n' }));
        }
        return Promise.resolve(null);
      });

      const diff = await service.computeDiff('page-1', fromId, toId);

      expect(diff.from).toBe(fromId);
      expect(diff.to).toBe(toId);
      expect(diff.changes.some((change) => change.type === 'removed')).toBe(
        true,
      );
      expect(diff.changes.some((change) => change.type === 'added')).toBe(true);
    });

    it('throws ValidationException when fromId and toId are identical', async () => {
      await expect(
        service.computeDiff('page-1', fromId, fromId),
      ).rejects.toBeInstanceOf(ValidationException);
      expect(versionsRepository.findByIdAndPageId).not.toHaveBeenCalled();
    });

    it('throws VersionNotFoundException when a version is missing', async () => {
      versionsRepository.findByIdAndPageId.mockResolvedValue(null);

      await expect(
        service.computeDiff('page-1', fromId, toId),
      ).rejects.toBeInstanceOf(VersionNotFoundException);
    });
  });

  describe('createVersion', () => {
    it('throws ValidationException for a title that is too long', () => {
      const tooLong = 'a'.repeat(256);

      expect(() =>
        service.createVersion('page-1', 'content', tooLong, 'user-1'),
      ).toThrow(ValidationException);
      expect(versionsRepository.create).not.toHaveBeenCalled();
    });

    it('persists the new version via the repository', async () => {
      const created = buildVersion({ id: 'version-2' });
      versionsRepository.create.mockResolvedValue(created);

      const result = await service.createVersion(
        'page-1',
        'content',
        'Title',
        'user-1',
        'summary',
      );

      expect(versionsRepository.create).toHaveBeenCalledWith({
        pageId: 'page-1',
        content: 'content',
        title: 'Title',
        authorId: 'user-1',
        changeSummary: 'summary',
      });
      expect(result).toBe(created);
    });
  });
});
