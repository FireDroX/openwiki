import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '#components/ui/button'
import type { AdminUserComment } from '#api/comments'
import { useMyComments } from '#hooks/useMyComments'
import { formatRelativeTime } from '#utils/relative-time'

function CommentPreviewItem({ comment }: { comment: AdminUserComment }) {
  const { t } = useTranslation()

  const content = (
    <>
      <p className="truncate text-xs text-muted-foreground">
        {t('profile.commentsOn')}{' '}
        <span className="font-semibold italic text-foreground">
          {comment.pagePath ?? comment.pageId}
        </span>{' '}
        · {formatRelativeTime(comment.createdAt)}
      </p>
      <p className="truncate text-sm">{comment.content}</p>
    </>
  )

  if (!comment.pagePath) {
    return <div className="min-w-0">{content}</div>
  }

  return (
    <Link to={`/pages/${comment.pagePath}`} className="block min-w-0 hover:text-primary">
      {content}
    </Link>
  )
}

export function CommentsPreview() {
  const { t } = useTranslation()
  const { comments, total, page, limit, status, goToPage } = useMyComments()
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold">{t('profile.commentsTitle', { count: total })}</h2>

      {status === 'loading' && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}
      {status === 'error' && <p className="text-sm text-destructive">{t('profile.commentsLoadError')}</p>}
      {status === 'ready' && comments.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('profile.commentsEmpty')}</p>
      )}

      {status === 'ready' && comments.length > 0 && (
        <ul className="divide-y divide-border">
          {comments.map((comment) => (
            <li key={comment.id} className="py-3 first:pt-0">
              <CommentPreviewItem comment={comment} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
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
