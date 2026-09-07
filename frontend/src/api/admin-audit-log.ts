import { apiClient } from '#lib/api-client'
import type { ResponseDto } from '#api/response-dto'

export interface AdminAuditLogItem {
  id: string
  adminId: string
  adminDisplayName: string
  action: string
  targetType: string
  targetId: string | null
  metadata: unknown
  createdAt: string
}

export interface AdminAuditLogPage {
  items: AdminAuditLogItem[]
  total: number
}

export async function listAuditLog(params: {
  adminId?: string
  action?: string
  page?: number
  limit?: number
}): Promise<AdminAuditLogPage> {
  const { data } = await apiClient.get<ResponseDto<AdminAuditLogPage>>('/admin/audit-log', { params })
  return data.data
}
