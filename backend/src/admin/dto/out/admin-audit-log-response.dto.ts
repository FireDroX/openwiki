export interface AdminAuditLogItemDto {
  id: string;
  adminId: string;
  adminDisplayName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: Date;
}

export interface AdminAuditLogListDto {
  items: AdminAuditLogItemDto[];
  total: number;
}
