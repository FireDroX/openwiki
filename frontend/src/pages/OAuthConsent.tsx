import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '#components/ui/button'
import { postAuthorizeDecision } from '#api/oauth'
import { UserRole } from '#api/auth'
import { useAuth } from '#hooks/useAuth'
import { extractErrorMessage } from '#lib/api-errors'

export function OAuthConsent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [pending, setPending] = useState<'allow' | 'deny' | null>(null)

  const clientId = searchParams.get('client_id') ?? ''
  const clientName = searchParams.get('client_name') ?? clientId
  const redirectUri = searchParams.get('redirect_uri') ?? ''
  const codeChallenge = searchParams.get('code_challenge') ?? ''
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? ''
  const state = searchParams.get('state') ?? undefined

  const isAdmin = user?.role === UserRole.Admin

  async function handleDecision(decision: 'allow' | 'deny') {
    setPending(decision)
    try {
      const { redirectUrl } = await postAuthorizeDecision({
        clientId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod,
        state,
        decision,
      })
      window.location.assign(redirectUrl)
    } catch (error) {
      toast.error(extractErrorMessage(error))
      setPending(null)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">{t('oauthConsent.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('oauthConsent.description', { name: clientName })}</p>
        </div>

        {isAdmin ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={pending !== null}
              onClick={() => handleDecision('deny')}
            >
              {t('oauthConsent.deny')}
            </Button>
            <Button type="button" className="flex-1" disabled={pending !== null} onClick={() => handleDecision('allow')}>
              {t('oauthConsent.allow')}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-destructive">{t('oauthConsent.notAdmin')}</p>
        )}
      </div>
    </div>
  )
}
