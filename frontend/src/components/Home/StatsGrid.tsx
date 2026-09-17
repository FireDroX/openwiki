import { useTranslation } from 'react-i18next'
import { Skeleton } from '#components/ui/skeleton'
import type { DashboardStats, PublicStats } from '#api/stats'
import { cn } from '#lib/utils'

interface StatsGridProps {
  stats: DashboardStats | PublicStats | null
  compact?: boolean
}

export function StatsGrid({ stats, compact = false }: StatsGridProps) {
  const { t } = useTranslation()

  const allItems = [
    { value: stats?.pagesCount, label: t('home.stats.pages') },
    { value: stats?.commentsCount, label: t('home.stats.comments') },
    { value: (stats as DashboardStats | null)?.usersCount, label: t('home.stats.users') },
    { value: (stats as DashboardStats | null)?.mediaCount, label: t('home.stats.media') },
  ]
  const items = compact ? allItems.slice(0, 2) : allItems

  return (
    <div className={cn('grid grid-cols-2 gap-4', !compact && 'sm:grid-cols-4')}>
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-card p-4">
          {item.value === undefined ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="font-heading text-2xl font-bold">{item.value}</div>
          )}
          <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
