import { apiClient } from '#lib/api-client'
import type { ResponseDto } from '#api/response-dto'

export interface SearchResultTag {
  id: string
  name: string
  color: string
}

export interface SearchResult {
  pageId: string
  slug: string
  title: string
  excerpt: string
  score: number
  tags: SearchResultTag[]
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
}

export async function search(q: string, page = 1, limit = 20): Promise<SearchResponse> {
  const { data } = await apiClient.get<ResponseDto<SearchResponse>>('/search', {
    params: { q, page, limit },
  })
  return data.data
}
