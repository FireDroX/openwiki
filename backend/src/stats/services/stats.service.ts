import { Inject, Injectable, Logger } from '@nestjs/common';
import { StatsResponseDto } from '../dto/out/stats-response.dto.js';
import type { StatsRepository } from '../persistence/stats.repository.js';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @Inject('StatsRepository')
    private readonly statsRepository: StatsRepository,
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
