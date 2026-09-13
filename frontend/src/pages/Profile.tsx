import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AvatarUploader } from '#components/Profile/AvatarUploader'
import { CommentsPreview } from '#components/Profile/CommentsPreview'
import { ProfileForm } from '#components/Profile/ProfileForm'
import { ProfileSummary } from '#components/Profile/ProfileSummary'
import { getMe } from '#api/users'
import type { AuthUser } from '#api/auth'
import { useAuth } from '#hooks/useAuth'
import { useDocumentTitle } from '#hooks/useDocumentTitle'

export function Profile() {
  const { t } = useTranslation()
  const { refreshUser } = useAuth()
  const [profile, setProfile] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useDocumentTitle(t('profile.title'))

  useEffect(() => {
    let cancelled = false

    getMe()
      .then((user) => {
        if (!cancelled) {
          setProfile(user)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function handleUpdate(updated: AuthUser) {
    setProfile((current) => (current ? { ...current, ...updated } : updated))
    void refreshUser()
  }

  if (status === 'loading' || !profile) {
    return <div className="p-8" />
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 p-8 md:flex-row">
      <div className="flex flex-col gap-8 md:w-72 md:shrink-0 md:border-r md:border-border md:pr-10">
        <div className="flex flex-col gap-4">
          <AvatarUploader user={profile} onUpdate={handleUpdate} />
          <ProfileSummary user={profile} />
        </div>
        <ProfileForm user={profile} onUpdate={handleUpdate} />
      </div>

      <div className="max-w-xl">
        <CommentsPreview />
      </div>
    </div>
  )
}
