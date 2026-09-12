import { useTranslation } from 'react-i18next'
import { CommentForm } from '#components/PageView/CommentForm'
import { CommentItem } from '#components/PageView/CommentItem'
import { Separator } from '#components/ui/separator'
import { useAuth } from '#hooks/useAuth'
import { useComments } from '#hooks/useComments'

interface CommentThreadProps {
  pageId: string
}

export function CommentThread({ pageId }: CommentThreadProps) {
  const { t } = useTranslation()
  const { status: authStatus } = useAuth()
  const { comments, status, addComment, editComment, removeComment } = useComments(pageId)

  if (status === 'loading') {
    return null
  }

  const totalCount = comments.reduce((total, comment) => total + 1 + (comment.replies?.length ?? 0), 0)

  return (
    <section className="space-y-4">
      <Separator />
      <h2 className="text-lg font-semibold">{t('comments.title', { count: totalCount })}</h2>

      {status === 'error' && <p className="text-sm text-destructive">{t('comments.loadError')}</p>}

      {status === 'ready' && (
        <>
          <div className="divide-y">
            {comments.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  replyCount={comment.replies?.length ?? 0}
                  onReply={(content) => addComment(content, comment.id)}
                  onEdit={(content) => editComment(comment.id, content)}
                  onDelete={() => removeComment(comment.id)}
                />
                {(comment.replies ?? []).map((reply) => (
                  <div key={reply.id} className="ml-11 border-t">
                    <CommentItem
                      comment={reply}
                      onEdit={(content) => editComment(reply.id, content)}
                      onDelete={() => removeComment(reply.id)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {authStatus === 'authenticated' ? (
            <CommentForm submitLabel={t('comments.submit')} onSubmit={(content) => addComment(content)} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('comments.loginToComment')}</p>
          )}
        </>
      )}
    </section>
  )
}
