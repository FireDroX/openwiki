import { useTranslation } from 'react-i18next'
import { Button } from '#components/ui/button'
import type { UserActivityLogItem } from '#api/user-activity-log'
import { useMyActivity } from '#hooks/useMyActivity'
import { formatRelativeTime } from '#utils/relative-time'

const ACTION_CATEGORIES: Record<string, string> = {
  'page.created': 'creation',
  'page.updated': 'edition',
  'page.restored': 'edition',
  'page.moved': 'edition',
  'page.visibility_changed': 'edition',
  'page.comments_enabled_changed': 'edition',
  'page.deleted': 'suppression',
  'comment.created': 'commentaire',
  'media.uploaded': 'media',
  'media.deleted': 'suppression',
  'user.avatar_uploaded': 'profil',
  'user.avatar_removed': 'profil',
  'auth.login': 'connexion',
  'auth.password_changed': 'securite',
}

function metadataTitle(metadata: unknown): string | null {
  if (metadata && typeof metadata === 'object' && 'title' in metadata) {
    const { title } = metadata as { title: unknown }
    return typeof title === 'string' ? title : null
  }
  return null
}

interface ActivityItemProps {
  item: UserActivityLogItem
  actionLabels: Record<string, string>
  categoryLabels: Record<string, string>
}

function ActivityItem({ item, actionLabels, categoryLabels }: ActivityItemProps) {
  const category = ACTION_CATEGORIES[item.action] ?? 'edition'
  const categoryLabel = categoryLabels[category] ?? category
  const content = metadataTitle(item.metadata) ?? actionLabels[item.action] ?? item.action

  return (
    <li className="flex items-center gap-4 py-3 first:pt-0">
      <span className="w-28 shrink-0 text-xs font-semibold tracking-wide text-primary uppercase">
        {categoryLabel}
      </span>
      <span className="min-w-0 flex-1 truncate">{content}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
    </li>
  )
}

export function ActivityFeed() {
  const { t } = useTranslation()
  const { items, total, page, limit, status, goToPage } = useMyActivity()
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const actionLabels = t('profile.activityActions', { returnObjects: true }) as Record<string, string>
  const categoryLabels = t('profile.activityCategories', { returnObjects: true }) as Record<string, string>

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      {status === 'loading' && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}
      {status === 'error' && (
        <p className="text-sm text-destructive">{t('profile.activityLoadError')}</p>
      )}
      {status === 'ready' && items.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('profile.activityEmpty')}</p>
      )}

      {status === 'ready' && items.length > 0 && (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <ActivityItem key={item.id} item={item} actionLabels={actionLabels} categoryLabels={categoryLabels} />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">{t('common.pageOf', { page, total: totalPages })}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
