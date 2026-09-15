import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '#components/ui/button'
import { FollowedPagesCard } from '#components/Home/FollowedPagesCard'
import { PopularPagesCard } from '#components/Home/PopularPagesCard'
import { StatsGrid } from '#components/Home/StatsGrid'
import { getFollowedPages, getPopularPages, getStats } from '#api/stats'
import type { DashboardStats, FollowedPage, PopularPage } from '#api/stats'
import { useAuth } from '#hooks/useAuth'
import { useDocumentTitle } from '#hooks/useDocumentTitle'
import { cn } from '#lib/utils'

export function Home() {
  const { t } = useTranslation()
  const { status } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [popularPages, setPopularPages] = useState<PopularPage[] | null>(null)
  const [followedPages, setFollowedPages] = useState<FollowedPage[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  useDocumentTitle(t('home.title'))

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    Promise.all([getStats(), getPopularPages(), getFollowedPages()])
      .then(([statsResult, popularResult, followedResult]) => {
        if (cancelled) return
        setStats(statsResult)
        setPopularPages(popularResult)
        setFollowedPages(followedResult)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
    }
  }, [status])

  if (status !== 'authenticated') {
    return (
      <main className={cn('home-page', 'flex flex-col items-start gap-4 p-8')}>
        <h1 className="text-2xl font-semibold">{t('common.appName')}</h1>
        <Button asChild>
          <Link to="/login">{t('home.getStarted')}</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold">{t('home.title')}</h1>

      {loadError ? (
        <p className="text-sm text-destructive">{t('home.loadError')}</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t('home.statistics')}</h2>
            <StatsGrid stats={stats} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PopularPagesCard pages={popularPages} />
            <FollowedPagesCard pages={followedPages} />
          </div>
        </>
      )}
    </main>
  )
}
