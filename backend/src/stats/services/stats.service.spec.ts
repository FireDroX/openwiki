import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { Page } from '../../pages/entities/page.entity.js';
import { PagesService } from '../../pages/services/pages.service.js';
import type { StatsRepository } from '../persistence/stats.repository.js';
import { StatsService } from './stats.service.js';

function buildPage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'page-1',
    slug: 'home',
    title: 'Home',
    parentId: null,
    currentVersionId: 'version-1',
    commentsEnabled: true,
    viewCount: 0,
    visibility: 'public',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('StatsService', () => {
  let service: StatsService;
  let statsRepository: {
    [K in keyof StatsRepository]: Mock<StatsRepository[K]>;
  };
  let pagesService: {
    listPopularPages: Mock<PagesService['listPopularPages']>;
    getAncestorPath: Mock<PagesService['getAncestorPath']>;
  };

  beforeEach(async () => {
    statsRepository = {
      countPages: vi.fn(),
      countComments: vi.fn(),
      countUsers: vi.fn(),
      countMedia: vi.fn(),
    };
    pagesService = {
      listPopularPages: vi.fn(),
      getAncestorPath: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: 'StatsRepository', useValue: statsRepository },
        { provide: PagesService, useValue: pagesService },
      ],
    }).compile();

    service = module.get(StatsService);
  });

  describe('getStats', () => {
    it('returns the four counters from the repository', async () => {
      statsRepository.countPages.mockResolvedValue(12);
      statsRepository.countComments.mockResolvedValue(34);
      statsRepository.countUsers.mockResolvedValue(5);
      statsRepository.countMedia.mockResolvedValue(7);

      const result = await service.getStats();

      expect(result).toEqual({
        pagesCount: 12,
        commentsCount: 34,
        usersCount: 5,
        mediaCount: 7,
      });
    });

    it('returns 0 comments without throwing when the comments count fails', async () => {
      statsRepository.countPages.mockResolvedValue(1);
      statsRepository.countComments.mockRejectedValue(
        new Error("Table 'comments' doesn't exist"),
      );
      statsRepository.countUsers.mockResolvedValue(1);
      statsRepository.countMedia.mockResolvedValue(0);

      const result = await service.getStats();

      expect(result.commentsCount).toBe(0);
    });

    it('returns 0 for every counter when there is no data yet', async () => {
      statsRepository.countPages.mockResolvedValue(0);
      statsRepository.countComments.mockResolvedValue(0);
      statsRepository.countUsers.mockResolvedValue(0);
      statsRepository.countMedia.mockResolvedValue(0);

      const result = await service.getStats();

      expect(result).toEqual({
        pagesCount: 0,
        commentsCount: 0,
        usersCount: 0,
        mediaCount: 0,
      });
    });
  });

  describe('getPopularPages', () => {
    it('returns popular pages with their computed path', async () => {
      const page = buildPage({ viewCount: 42 });
      pagesService.listPopularPages.mockResolvedValue([page]);
      pagesService.getAncestorPath.mockResolvedValue('/home');

      const result = await service.getPopularPages(5);

      expect(pagesService.listPopularPages).toHaveBeenCalledWith(5);
      expect(result).toEqual([
        { id: page.id, title: page.title, path: '/home', viewCount: 42 },
      ]);
    });

    it('returns an empty list when no page has been viewed yet', async () => {
      pagesService.listPopularPages.mockResolvedValue([]);

      const result = await service.getPopularPages(5);

      expect(result).toEqual([]);
    });
  });
});
