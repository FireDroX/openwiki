import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { StatsRepository } from '../persistence/stats.repository.js';
import { StatsService } from './stats.service.js';

describe('StatsService', () => {
  let service: StatsService;
  let statsRepository: {
    [K in keyof StatsRepository]: Mock<StatsRepository[K]>;
  };

  beforeEach(async () => {
    statsRepository = {
      countPages: vi.fn(),
      countComments: vi.fn(),
      countUsers: vi.fn(),
      countMedia: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: 'StatsRepository', useValue: statsRepository },
      ],
    }).compile();

    service = module.get(StatsService);
  });

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
