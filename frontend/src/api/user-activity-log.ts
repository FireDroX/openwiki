import { apiClient } from '#lib/api-client'
import type { ResponseDto } from '#api/response-dto'

export interface UserActivityLogItem {
  id: string
  userId: string
  userDisplayName: string
  action: string
  targetType: string
  targetId: string | null
  metadata: unknown
  createdAt: string
}

export interface UserActivityLogPage {
  items: UserActivityLogItem[]
  total: number
}

export async function listMyActivity(page = 1, limit = 20): Promise<UserActivityLogPage> {
  const { data } = await apiClient.get<ResponseDto<UserActivityLogPage>>('/users/me/activity', {
    params: { page, limit },
  })
  return data.data
}

export async function listActivityLog(params: {
  userId?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}): Promise<UserActivityLogPage> {
  const { data } = await apiClient.get<ResponseDto<UserActivityLogPage>>('/admin/activity-log', { params })
  return data.data
}
