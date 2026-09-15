import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '#components/ui/skeleton'
import type { FollowedPage } from '#api/stats'
import { formatRelativeTime } from '#utils/relative-time'

interface FollowedPagesCardProps {
  pages: FollowedPage[] | null
}

export function FollowedPagesCard({ pages }: FollowedPagesCardProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-heading text-base font-semibold">{t('home.followedPages.title')}</h2>

      {pages === null && (
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      )}

      {pages !== null && pages.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">{t('home.followedPages.empty')}</p>
      )}

      {pages !== null && pages.length > 0 && (
        <ul className="mt-2 divide-y divide-border">
          {pages.map((page) => (
            <li key={page.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
              <Link
                to={`/pages${page.path}`}
                className="min-w-0 flex-1 truncate text-sm text-foreground hover:underline"
              >
                {page.title}
              </Link>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatRelativeTime(page.lastActivityAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
