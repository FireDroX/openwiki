import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { UserActivityLog } from '../entities/user-activity-log.entity.js';
import {
  CreateUserActivityLogInput,
  UserActivityLogFilters,
  UserActivityLogRepository,
  UserActivityLogRow,
} from './user-activity-log.repository.js';

@Injectable()
export class TypeormUserActivityLogRepository
  implements UserActivityLogRepository
{
  constructor(
    @InjectRepository(UserActivityLog)
    private readonly repository: Repository<UserActivityLog>,
  ) {}

  async create(data: CreateUserActivityLogInput): Promise<void> {
    await this.repository.save(this.repository.create(data));
  }

  async findAllPaginated(
    filters: UserActivityLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: UserActivityLogRow[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('log')
      .innerJoin(User, 'user', 'user.id = log.userId')
      .select('log.id', 'id')
      .addSelect('log.userId', 'userId')
      .addSelect('user.displayName', 'userDisplayName')
      .addSelect('log.action', 'action')
      .addSelect('log.targetType', 'targetType')
      .addSelect('log.targetId', 'targetId')
      .addSelect('log.metadata', 'metadata')
      .addSelect('log.createdAt', 'createdAt')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.userId) {
      query.andWhere('log.userId = :userId', { userId: filters.userId });
    }
    if (filters.action) {
      query.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters.dateFrom) {
      query.andWhere('DATE(log.createdAt) >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }
    if (filters.dateTo) {
      query.andWhere('DATE(log.createdAt) <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }
    if (filters.search) {
      const search = `%${filters.search}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('log.action LIKE :search', { search })
            .orWhere('log.targetType LIKE :search', { search })
            .orWhere('log.targetId LIKE :search', { search })
            .orWhere('user.displayName LIKE :search', { search })
            .orWhere('user.email LIKE :search', { search });
        }),
      );
    }

    const [items, total] = await Promise.all([
      query.getRawMany<UserActivityLogRow>(),
      query.getCount(),
    ]);

    return { items, total };
  }
}
