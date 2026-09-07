import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../../common/variables.global.js';
import { AdminAuditLogQueryDto } from '../dto/in/admin-audit-log-query.dto.js';
import type {
  AdminAuditLogRepository,
  AdminAuditLogRow,
} from '../persistence/admin-audit-log.repository.js';

export interface RecordAdminActionInput {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: unknown;
}

@Injectable()
export class AdminAuditLogService {
  constructor(
    @Inject('AdminAuditLogsRepository')
    private readonly auditLogRepository: AdminAuditLogRepository,
  ) {}

  async record(entry: RecordAdminActionInput): Promise<void> {
    await this.auditLogRepository.create({
      adminId: entry.adminId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? null,
    });
  }

  async list(
    query: AdminAuditLogQueryDto,
  ): Promise<{ items: AdminAuditLogRow[]; total: number }> {
    const page = AdminAuditLogService.parsePage(query.page);
    const limit = AdminAuditLogService.parseLimit(query.limit);
    return this.auditLogRepository.findAllPaginated(
      { adminId: query.adminId, action: query.action },
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
