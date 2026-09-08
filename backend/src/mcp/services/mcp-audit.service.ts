import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_PAGE,
  MCP_AUDIT_LOG_DEFAULT_LIMIT,
  MCP_AUDIT_LOG_MAX_LIMIT,
  MCP_AUDIT_LOG_STRING_MAX_LENGTH,
} from '../../common/variables.global.js';
import { AuditLogQueryDto } from '../dto/in/audit-log-query.dto.js';
import type {
  McpAuditLogRepository,
  McpAuditLogRow,
} from '../persistence/mcp-audit-log.repository.js';

export interface LogActionInput {
  apiKeyId: string;
  toolName: string;
  input: unknown;
  output: unknown;
  success: boolean;
  errorMessage: string | null;
}

@Injectable()
export class McpAuditService {
  constructor(
    @Inject('McpAuditLogsRepository')
    private readonly auditLogRepository: McpAuditLogRepository,
  ) {}

  async logAction(entry: LogActionInput): Promise<void> {
    await this.auditLogRepository.create({
      apiKeyId: entry.apiKeyId,
      toolName: entry.toolName,
      input: McpAuditService.truncateStrings(entry.input),
      output: McpAuditService.truncateStrings(entry.output),
      success: entry.success,
      errorMessage: entry.errorMessage,
    });
  }

  async list(
    query: AuditLogQueryDto,
  ): Promise<{ items: McpAuditLogRow[]; total: number }> {
    const page = McpAuditService.parsePage(query.page);
    const limit = McpAuditService.parseLimit(query.limit);
    return this.auditLogRepository.findAllPaginated(
      {
        apiKeyId: query.apiKeyId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        search: query.search,
      },
      page,
      limit,
    );
  }

  private static truncateStrings(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.length > MCP_AUDIT_LOG_STRING_MAX_LENGTH
        ? `${value.slice(0, MCP_AUDIT_LOG_STRING_MAX_LENGTH)}…`
        : value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => McpAuditService.truncateStrings(item));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          McpAuditService.truncateStrings(item),
        ]),
      );
    }
    return value;
  }

  private static parsePage(raw?: string): number {
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
  }

  private static parseLimit(raw?: string): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return MCP_AUDIT_LOG_DEFAULT_LIMIT;
    }
    return Math.min(parsed, MCP_AUDIT_LOG_MAX_LIMIT);
  }
}
