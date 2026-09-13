import { useTranslation } from 'react-i18next'
import { Badge } from '#components/ui/badge'
import { UserRole, type AuthUser } from '#api/auth'

interface ProfileSummaryProps {
  user: AuthUser
}

export function ProfileSummary({ user }: ProfileSummaryProps) {
  const { t } = useTranslation()

  const roleLabels: Record<UserRole, string> = {
    [UserRole.Admin]: t('admin.users.roleAdmin'),
    [UserRole.Editor]: t('admin.users.roleEditor'),
    [UserRole.Reader]: t('admin.users.roleReader'),
  }

  return (
    <div className="flex items-center gap-3">
      <Badge variant="secondary">{roleLabels[user.role]}</Badge>
      <span className="text-sm text-muted-foreground">
        {t('profile.commentsCount', { count: user.commentsCount ?? 0 })}
      </span>
    </div>
  )
}
