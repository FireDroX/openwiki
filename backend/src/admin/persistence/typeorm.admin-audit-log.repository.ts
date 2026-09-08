import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { AdminAuditLog } from '../entities/admin-audit-log.entity.js';
import {
  AdminAuditLogFilters,
  AdminAuditLogRepository,
  AdminAuditLogRow,
  CreateAdminAuditLogInput,
} from './admin-audit-log.repository.js';

@Injectable()
export class TypeormAdminAuditLogRepository implements AdminAuditLogRepository {
  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly repository: Repository<AdminAuditLog>,
  ) {}

  async create(data: CreateAdminAuditLogInput): Promise<void> {
    await this.repository.save(this.repository.create(data));
  }

  async findAllPaginated(
    filters: AdminAuditLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: AdminAuditLogRow[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('log')
      .innerJoin(User, 'admin', 'admin.id = log.adminId')
      .select('log.id', 'id')
      .addSelect('log.adminId', 'adminId')
      .addSelect('admin.displayName', 'adminDisplayName')
      .addSelect('log.action', 'action')
      .addSelect('log.targetType', 'targetType')
      .addSelect('log.targetId', 'targetId')
      .addSelect('log.metadata', 'metadata')
      .addSelect('log.createdAt', 'createdAt')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.adminId) {
      query.andWhere('log.adminId = :adminId', { adminId: filters.adminId });
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
            .orWhere('admin.displayName LIKE :search', { search })
            .orWhere('admin.email LIKE :search', { search });
        }),
      );
    }

    const [items, total] = await Promise.all([
      query.getRawMany<AdminAuditLogRow>(),
      query.getCount(),
    ]);

    return { items, total };
  }
}
