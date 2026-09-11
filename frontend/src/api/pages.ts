import { apiClient } from '#lib/api-client'
import type { ResponseDto } from '#api/response-dto'

export interface PageTreeNode {
  id: string
  slug: string
  title: string
  children: PageTreeNode[]
}

export async function getTree(): Promise<PageTreeNode[]> {
  const { data } = await apiClient.get<ResponseDto<PageTreeNode[]>>('/pages/tree')
  return data.data
}

export type PageVisibility = 'public' | 'private'

export interface PageDetail {
  id: string
  slug: string
  title: string
  content: string
  visibility: PageVisibility
  isPublished: boolean
  parentId: string | null
  updatedAt: string
}

export async function getPageByPath(pathSegments: string[]): Promise<PageDetail> {
  const path = pathSegments.map(encodeURIComponent).join('/')
  const { data } = await apiClient.get<ResponseDto<PageDetail>>(`/pages/${path}`)
  return data.data
}

export interface UpdatePagePayload {
  title?: string
  content?: string
  changeSummary?: string
}

export interface PageUpdateResult {
  id: string
  slug: string
  title: string
  content: string
  currentVersionId: string
  updatedAt: string
}

export async function updatePage(id: string, payload: UpdatePagePayload): Promise<PageUpdateResult> {
  const { data } = await apiClient.patch<ResponseDto<PageUpdateResult>>(`/pages/${id}`, payload)
  return data.data
}

export interface CreatePagePayload {
  slug: string
  title: string
  content: string
  visibility: PageVisibility
  parentId: string | null
}

export interface PageCreateResult {
  id: string
  slug: string
  title: string
  parentId: string | null
  visibility: PageVisibility
  isPublished: boolean
}

export async function createPage(payload: CreatePagePayload): Promise<PageCreateResult> {
  const { data } = await apiClient.post<ResponseDto<PageCreateResult>>('/pages', payload)
  return data.data
}

export async function movePage(id: string, newParentId: string | null): Promise<void> {
  await apiClient.patch(`/pages/${id}/move`, { newParentId })
}

export async function publishPage(id: string, isPublished: boolean): Promise<void> {
  await apiClient.patch(`/pages/${id}/publish`, { isPublished })
}

export async function changePageVisibility(id: string, visibility: PageVisibility): Promise<void> {
  await apiClient.patch(`/pages/${id}/visibility`, { visibility })
}
