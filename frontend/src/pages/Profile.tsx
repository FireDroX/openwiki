import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AvatarUploader } from '#components/Profile/AvatarUploader'
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
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t('profile.title')}</h1>
      <AvatarUploader user={profile} onUpdate={handleUpdate} />
      <ProfileSummary user={profile} />
      <ProfileForm user={profile} onUpdate={handleUpdate} />
    </div>
  )
}
