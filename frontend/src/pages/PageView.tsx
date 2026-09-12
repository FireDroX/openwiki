import { Link, useParams } from 'react-router'
import { useMemo } from 'react'
import { History, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UserRole } from '#api/auth'
import { Button } from '#components/ui/button'
import { MarkdownRenderer } from '#components/MarkdownRenderer'
import { Skeleton } from '#components/ui/skeleton'
import { PageBreadcrumb } from '#components/layout/PageBreadcrumb'
import { CommentThread } from '#components/PageView/CommentThread'
import { PageTagList } from '#components/PageView/PageTagList'
import { useAuth } from '#hooks/useAuth'
import { useDocumentTitle } from '#hooks/useDocumentTitle'
import { usePage } from '#hooks/usePage'
import { usePageTags } from '#hooks/usePageTags'

const EDITOR_ROLES: UserRole[] = [UserRole.Editor, UserRole.Admin]

function PageViewSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-4 w-40" />
          <div className="flex shrink-0 gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

interface PageStatusMessageProps {
  title: string
  description: string
}

function PageStatusMessage({ title, description }: PageStatusMessageProps) {
  const { t } = useTranslation()
  return (
    <div className="flex max-w-3xl flex-col items-start gap-4 p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <Button asChild>
        <Link to="/">{t('pageView.backHome')}</Link>
      </Button>
    </div>
  )
}

export function PageView() {
  const { t } = useTranslation()
  const params = useParams()
  const pathSegments = useMemo(() => (params['*'] ?? '').split('/').filter(Boolean), [params])
  const { status, page } = usePage(pathSegments)
  const { tags, status: tagsStatus } = usePageTags(page?.id)
  const { user } = useAuth()
  const canEdit = !!user && EDITOR_ROLES.includes(user.role)
  useDocumentTitle(page?.title)

  if (status === 'loading') {
    return <PageViewSkeleton />
  }

  if (status === 'notFound') {
    return (
      <PageStatusMessage
        title={t('pageView.notFoundTitle')}
        description={t('pageView.notFoundDescription')}
      />
    )
  }

  if (status === 'forbidden') {
    return (
      <PageStatusMessage
        title={t('pageView.forbiddenTitle')}
        description={t('pageView.forbiddenDescription')}
      />
    )
  }

  if (status === 'error' || !page) {
    return (
      <PageStatusMessage
        title={t('pageView.errorTitle')}
        description={t('pageView.errorDescription')}
      />
    )
  }

  if (tagsStatus === 'loading') {
    return <PageViewSkeleton />
  }

  return (
    <article className="space-y-6 p-8">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <PageBreadcrumb title={page.title} parentId={page.parentId} />
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/history/${pathSegments.join('/')}`}>
                <History /> {t('pageView.history')}
              </Link>
            </Button>
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/edit/${pathSegments.join('/')}`}>
                  <Pencil /> {t('pageView.edit')}
                </Link>
              </Button>
            )}
          </div>
        </div>
        <PageTagList tags={tags} />
      </div>
      <MarkdownRenderer content={page.content} />
      <CommentThread pageId={page.id} />
    </article>
  )
}
