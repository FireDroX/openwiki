import { apiClient } from '#lib/api-client'
import type { ResponseDto } from '#api/response-dto'

export interface DashboardStats {
  pagesCount: number
  commentsCount: number
  usersCount: number
  mediaCount: number
}

export interface PopularPage {
  id: string
  title: string
  path: string
  viewCount: number
}

export interface FollowedPage {
  id: string
  title: string
  path: string
  lastActivityAt: string
}

export async function getStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<ResponseDto<DashboardStats>>('/stats')
  return data.data
}

export async function getPopularPages(limit = 5): Promise<PopularPage[]> {
  const { data } = await apiClient.get<ResponseDto<PopularPage[]>>('/stats/popular-pages', {
    params: { limit },
  })
  return data.data
}

export async function getFollowedPages(): Promise<FollowedPage[]> {
  const { data } = await apiClient.get<ResponseDto<FollowedPage[]>>('/stats/followed-pages')
  return data.data
}
