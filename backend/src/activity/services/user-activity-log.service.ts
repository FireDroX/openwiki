import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../../common/variables.global.js';
import { UserActivityLogQueryDto } from '../dto/in/user-activity-log-query.dto.js';
import type {
  UserActivityLogRepository,
  UserActivityLogRow,
} from '../persistence/user-activity-log.repository.js';

export interface RecordUserActivityInput {
  userId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: unknown;
}

@Injectable()
export class UserActivityLogService {
  private readonly logger = new Logger(UserActivityLogService.name);

  constructor(
    @Inject('UserActivityLogsRepository')
    private readonly activityLogRepository: UserActivityLogRepository,
  ) {}

  async record(entry: RecordUserActivityInput): Promise<void> {
    try {
      await this.activityLogRepository.create({
        userId: entry.userId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        metadata: entry.metadata ?? null,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record activity "${entry.action}" for user ${entry.userId}: ${(error as Error).message}`,
      );
    }
  }

  async list(
    query: UserActivityLogQueryDto,
  ): Promise<{ items: UserActivityLogRow[]; total: number }> {
    const page = UserActivityLogService.parsePage(query.page);
    const limit = UserActivityLogService.parseLimit(query.limit);
    return this.activityLogRepository.findAllPaginated(
      {
        userId: query.userId,
        action: query.action,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        search: query.search,
      },
      page,
      limit,
    );
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
}
