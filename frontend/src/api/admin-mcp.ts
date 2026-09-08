import { apiClient } from '#lib/api-client'
import type { ResponseDto } from '#api/response-dto'

export const MCP_SCOPES = [
  'pages:read',
  'pages:write',
  'tags:read',
  'tags:write',
  'users:read',
  'users:write',
  'media:read',
  'media:write',
  'search:read',
] as const

export type McpScope = (typeof MCP_SCOPES)[number]

export interface McpApiKeyCreated {
  id: string
  name: string
  key: string
  scopes: McpScope[]
  createdAt: string
}

export interface McpApiKeySummary {
  id: string
  name: string
  scopes: McpScope[]
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export async function createApiKey(name: string, scopes: McpScope[]): Promise<McpApiKeyCreated> {
  const { data } = await apiClient.post<ResponseDto<McpApiKeyCreated>>('/admin/mcp/api-keys', { name, scopes })
  return data.data
}

export async function listApiKeys(): Promise<McpApiKeySummary[]> {
  const { data } = await apiClient.get<ResponseDto<McpApiKeySummary[]>>('/admin/mcp/api-keys')
  return data.data
}

export async function revokeApiKey(id: string): Promise<void> {
  await apiClient.delete(`/admin/mcp/api-keys/${id}`)
}

export interface McpAuditLogItem {
  id: string
  apiKeyName: string
  toolName: string
  success: boolean
  input: unknown
  output: unknown
  errorMessage: string | null
  createdAt: string
}

export interface McpAuditLogPage {
  items: McpAuditLogItem[]
  total: number
}

export async function getAuditLog(params: {
  apiKeyId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}): Promise<McpAuditLogPage> {
  const { data } = await apiClient.get<ResponseDto<McpAuditLogPage>>('/admin/mcp/audit-log', { params })
  return data.data
}
