import { useTranslation } from 'react-i18next'
import { Skeleton } from '#components/ui/skeleton'
import type { DashboardStats } from '#api/stats'

interface StatsGridProps {
  stats: DashboardStats | null
}

export function StatsGrid({ stats }: StatsGridProps) {
  const { t } = useTranslation()

  const items = [
    { value: stats?.pagesCount, label: t('home.stats.pages') },
    { value: stats?.commentsCount, label: t('home.stats.comments') },
    { value: stats?.usersCount, label: t('home.stats.users') },
    { value: stats?.mediaCount, label: t('home.stats.media') },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
