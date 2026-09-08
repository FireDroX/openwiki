export interface CreateUserActivityLogInput {
  userId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
}

export interface UserActivityLogRow {
  id: string;
  userId: string;
  userDisplayName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: Date;
}

export interface UserActivityLogFilters {
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface UserActivityLogRepository {
  create(data: CreateUserActivityLogInput): Promise<void>;
  findAllPaginated(
    filters: UserActivityLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: UserActivityLogRow[]; total: number }>;
}
