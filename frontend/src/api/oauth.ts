import { apiClient } from '#lib/api-client'
import type { ResponseDto } from '#api/response-dto'

export interface OAuthAuthorizeDecisionPayload {
  clientId: string
  redirectUri: string
  codeChallenge: string
  codeChallengeMethod: string
  state?: string
  decision: 'allow' | 'deny'
}

export interface OAuthAuthorizeDecisionResult {
  redirectUrl: string
}

export async function postAuthorizeDecision(
  payload: OAuthAuthorizeDecisionPayload,
): Promise<OAuthAuthorizeDecisionResult> {
  const { data } = await apiClient.post<ResponseDto<OAuthAuthorizeDecisionResult>>(
    '/oauth/authorize/decision',
    payload,
  )
  return data.data
}
