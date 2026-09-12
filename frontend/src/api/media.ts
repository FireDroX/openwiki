import { apiClient } from '#lib/api-client'
import type { ResponseDto } from '#api/response-dto'

export interface AttachmentDto {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  pageId: string | null
}

export interface MediaLibraryQuery {
  search?: string
  type?: 'image' | 'file'
  page?: number
  limit?: number
}

export interface MediaLibraryResult {
  items: AttachmentDto[]
  total: number
}

export async function uploadFile(file: File, pageId?: string): Promise<AttachmentDto> {
  const formData = new FormData()
  formData.append('file', file)
  if (pageId) {
    formData.append('pageId', pageId)
  }

  const { data } = await apiClient.post<ResponseDto<AttachmentDto>>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function listMediaLibrary(query: MediaLibraryQuery = {}): Promise<MediaLibraryResult> {
  const { data } = await apiClient.post<ResponseDto<MediaLibraryResult>>('/media', query)
  return data.data
}

export async function deleteMedia(id: string): Promise<void> {
  await apiClient.delete(`/media/${id}`)
}
