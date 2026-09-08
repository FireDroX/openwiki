export class AdminAuditLogQueryDto {
  adminId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: string;
  limit?: string;
}
