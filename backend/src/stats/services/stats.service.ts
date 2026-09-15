import { Inject, Injectable, Logger } from '@nestjs/common';
import { PagesService } from '../../pages/services/pages.service.js';
import { FollowedPageDto } from '../dto/out/followed-page.dto.js';
import { PopularPageDto } from '../dto/out/popular-page.dto.js';
import { StatsResponseDto } from '../dto/out/stats-response.dto.js';
import type { StatsRepository } from '../persistence/stats.repository.js';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @Inject('StatsRepository')
    private readonly statsRepository: StatsRepository,
    private readonly pagesService: PagesService,
  ) {}

  async getStats(): Promise<StatsResponseDto> {
    const [pagesCount, commentsCount, usersCount, mediaCount] =
      await Promise.all([
        this.statsRepository.countPages(),
        this.countCommentsSafely(),
        this.statsRepository.countUsers(),
        this.statsRepository.countMedia(),
      ]);

    return { pagesCount, commentsCount, usersCount, mediaCount };
  }

  async getPopularPages(limit: number): Promise<PopularPageDto[]> {
    const pages = await this.pagesService.listPopularPages(limit);
    return Promise.all(
      pages.map(async (page) => ({
        id: page.id,
        title: page.title,
        path: await this.pagesService.getAncestorPath(page),
        viewCount: page.viewCount,
      })),
    );
  }

  async getFollowedPages(userId: string): Promise<FollowedPageDto[]> {
    const followed = await this.pagesService.getFollowedPages(userId);
    return Promise.all(
      followed.map(async ({ page, lastActivityAt }) => ({
        id: page.id,
        title: page.title,
        path: await this.pagesService.getAncestorPath(page),
        lastActivityAt,
      })),
    );
  }

  private async countCommentsSafely(): Promise<number> {
    try {
      return await this.statsRepository.countComments();
    } catch (error) {
      this.logger.warn(
        `Failed to count comments, defaulting to 0: ${(error as Error).message}`,
      );
      return 0;
    }
  }
}
