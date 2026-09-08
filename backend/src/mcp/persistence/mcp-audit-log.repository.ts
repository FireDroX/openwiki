export interface CreateMcpAuditLogInput {
  apiKeyId: string;
  toolName: string;
  input: unknown;
  output: unknown;
  success: boolean;
  errorMessage: string | null;
}

export interface McpAuditLogRow {
  id: string;
  apiKeyName: string;
  toolName: string;
  input: unknown;
  output: unknown;
  success: boolean;
  errorMessage: string | null;
  createdAt: Date;
}

export interface McpAuditLogFilters {
  apiKeyId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface McpAuditLogRepository {
  create(data: CreateMcpAuditLogInput): Promise<void>;
  findAllPaginated(
    filters: McpAuditLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: McpAuditLogRow[]; total: number }>;
}
