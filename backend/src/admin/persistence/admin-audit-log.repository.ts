export interface CreateAdminAuditLogInput {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
}

export interface AdminAuditLogRow {
  id: string;
  adminId: string;
  adminDisplayName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: Date;
}

export interface AdminAuditLogFilters {
  adminId?: string;
  action?: string;
}

export interface AdminAuditLogRepository {
  create(data: CreateAdminAuditLogInput): Promise<void>;
  findAllPaginated(
    filters: AdminAuditLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: AdminAuditLogRow[]; total: number }>;
}
